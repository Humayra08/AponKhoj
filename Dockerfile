# Use an official PHP image with Apache
FROM php:8.2-apache

# Non-secret build-time default, used only for the client's Vite build below.
# All real runtime config (DB, JWT, mail, Redis, chatbot) lives in server/.env,
# which is bind-mounted into the container at runtime — never baked into the image.
ARG APP_URL=http://localhost

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    cron \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip

# Install Node.js 20.x
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Enable mod_rewrite
RUN a2enmod rewrite

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Install Redis PHP extension via PECL
RUN pecl install redis && docker-php-ext-enable redis

# Set Apache document root to Laravel public directory
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy Laravel backend code
COPY server/ /var/www/html
COPY client/ /var/www/html/client

# Set working directory
WORKDIR /var/www/html

# Install Laravel dependencies (including predis)
RUN composer require predis/predis && composer install

# No .env is baked into the image — server/.env (bind-mounted at runtime,
# gitignored, never committed) is the only source of real config/secrets.
# If server/.env doesn't exist yet, copy server/.env.example to create it
# before first run.

# Set permissions for Laravel storage and cache
RUN chown -R www-data:www-data /var/www/html && \
    chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Create client .env file with backend endpoint
RUN echo "VITE_BACKEND_ENDPOINT=${APP_URL}" > client/.env

# Install client dependencies and build
RUN cd client && npm install && npm run build

# Move React build to Laravel public directory
RUN cp -r client/dist/* public/

# Laravel scheduler: run `php artisan schedule:run` every minute via cron.
# Kernel::schedule() decides what actually fires (currently: chat:resync-embeddings hourly).
RUN echo "* * * * * www-data cd /var/www/html && php artisan schedule:run >> /dev/null 2>&1" > /etc/cron.d/laravel-scheduler && \
    chmod 0644 /etc/cron.d/laravel-scheduler && \
    crontab /etc/cron.d/laravel-scheduler

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port 80 for Apache
EXPOSE 80

# Start cron (for the Laravel scheduler) alongside Apache
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["apache2-foreground"]
#!/bin/sh
set -e

# Start cron in the background so the Laravel scheduler (php artisan schedule:run,
# invoked every minute) can run alongside the Apache foreground process.
cron

exec "$@"

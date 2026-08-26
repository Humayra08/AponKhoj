<?php

namespace App\Providers;

use App\Models\FoundReport;
use App\Models\MissingReport;
use App\Observers\FoundReportObserver;
use App\Observers\MissingReportObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        //
    }

    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        MissingReport::observe(MissingReportObserver::class);
        FoundReport::observe(FoundReportObserver::class);
    }
}

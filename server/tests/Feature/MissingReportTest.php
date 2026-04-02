<?php

namespace Tests\Feature;

use Tests\TestCase;

class MissingReportTest extends TestCase
{
    public function test_cloudinary_service_initializes()
    {
        $service = app(\App\Services\CloudinaryService::class);
        $this->assertNotNull($service);
    }

    public function test_missing_report_controller_exists()
    {
        $controller = new \App\Http\Controllers\MissingPersonController(
            app(\App\Services\CloudinaryService::class)
        );
        $this->assertNotNull($controller);
    }
}

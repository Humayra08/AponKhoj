<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\MissingPersonController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group.
|
*/

// Public Authentication Routes
Route::group(['prefix' => 'auth'], function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
    Route::post('verify-email', [AuthController::class, 'verifyEmail']);
    Route::post('resend-code', [AuthController::class, 'resendCode']);
    
    // Protected Authentication Routes
    Route::middleware('auth:api')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('refresh', [AuthController::class, 'refresh']);
        Route::get('me', [AuthController::class, 'me']);
    });
});

// Protected API Routes (Require Authentication)
Route::middleware('auth:api')->group(function () {
    Route::get('user', function (Request $request) {
        return $request->user();
    });

    Route::get('profile', [ProfileController::class, 'show']);
    Route::put('profile', [ProfileController::class, 'update']);
    Route::patch('profile', [ProfileController::class, 'update']);
    Route::get('profile/stats', [ProfileController::class, 'stats']);

    // Missing Person Reports Routes
    Route::post('missing-reports', [MissingPersonController::class, 'store']);
    Route::get('missing-reports/my', [MissingPersonController::class, 'getMyReports']);
});

// Public missing reports feed
Route::get('missing-reports/published', [MissingPersonController::class, 'getPublished']);
Route::get('missing-reports/published/{id}', [MissingPersonController::class, 'getPublishedById']);
Route::get('missing-reports/stats', [MissingPersonController::class, 'getPublicStats']);

// Admin-only API routes
Route::middleware(['auth:api', 'admin.only'])->group(function () {
    Route::get('admin/stats', [AdminController::class, 'stats']);
    Route::get('admin/reports/recent', [AdminController::class, 'recentReports']);

    Route::get('admin/moderation/stats', [AdminController::class, 'moderationStats']);
    Route::get('admin/moderation/reports', [AdminController::class, 'moderationReports']);
    Route::get('admin/moderation/flagged-users', [AdminController::class, 'moderationFlaggedUsers']);
    Route::get('admin/moderation/appeals', [AdminController::class, 'moderationAppeals']);
    
    // Missing Person Reports Admin Routes
    Route::get('admin/missing-reports/pending', [MissingPersonController::class, 'getPending']);
    Route::patch('admin/missing-reports/{id}/approve', [MissingPersonController::class, 'approve']);
    Route::patch('admin/missing-reports/{id}/reject', [MissingPersonController::class, 'reject']);
});
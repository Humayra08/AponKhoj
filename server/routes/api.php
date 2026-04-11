<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\MissingPersonController;
use App\Http\Controllers\FoundPersonController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Admin\SuccessStoryController;
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
    
    // Password Reset Routes
    Route::post('forget-password-request', [PasswordResetController::class, 'requestReset']);
    Route::post('verify-reset-code', [PasswordResetController::class, 'verifyResetCode']);
    Route::post('reset-password', [PasswordResetController::class, 'resetPassword']);
    
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
    Route::post('profile/avatar', [ProfileController::class, 'uploadAvatar']);
    Route::get('profile/stats', [ProfileController::class, 'stats']);

    // Missing Person Reports Routes
    Route::post('missing-reports', [MissingPersonController::class, 'store']);
    Route::get('missing-reports/my', [MissingPersonController::class, 'getMyReports']);

    // Found Person Reports Routes
    Route::post('found-reports', [FoundPersonController::class, 'store']);
    Route::get('found-reports/my', [FoundPersonController::class, 'getMyReports']);
    Route::get('found-reports/my/ai-matches', [FoundPersonController::class, 'getMyAiMatches']);
    Route::get('found-reports/my/{id}/ai-matches', [FoundPersonController::class, 'getMyAiMatchDetails']);
});

// Public missing reports feed
Route::get('missing-reports/published', [MissingPersonController::class, 'getPublished']);
Route::get('missing-reports/published/{id}', [MissingPersonController::class, 'getPublishedById']);
Route::get('missing-reports/stats', [MissingPersonController::class, 'getPublicStats']);

// Public found reports feed
Route::get('found-reports/published', [FoundPersonController::class, 'getPublished']);
Route::get('found-reports/published/{id}', [FoundPersonController::class, 'getPublishedById']);

Route::get('success-stories', [SuccessStoryController::class, 'publicIndex']);
Route::get('success-stories/{id}', [SuccessStoryController::class, 'publicShow']);

// Admin-only API routes
Route::middleware(['auth:api', 'admin.only'])->group(function () {
    Route::get('admin/stats', [AdminController::class, 'stats']);
    Route::get('admin/reports/recent', [AdminController::class, 'recentReports']);

    Route::get('admin/moderation/stats', [AdminController::class, 'moderationStats']);
    Route::get('admin/moderation/reports', [AdminController::class, 'moderationReports']);
    Route::get('admin/moderation/flagged-users', [AdminController::class, 'moderationFlaggedUsers']);
    Route::get('admin/moderation/appeals', [AdminController::class, 'moderationAppeals']);

    // Success Stories Admin Routes
    Route::get('admin/success-stories', [SuccessStoryController::class, 'index']);
    Route::post('admin/success-stories', [SuccessStoryController::class, 'store']);
    Route::get('admin/success-stories/{id}', [SuccessStoryController::class, 'show']);
    Route::post('admin/success-stories/{id}', [SuccessStoryController::class, 'update']);
    Route::patch('admin/success-stories/{id}/toggle-publish', [SuccessStoryController::class, 'togglePublish']);
    Route::patch('admin/success-stories/{id}/toggle-featured', [SuccessStoryController::class, 'toggleFeatured']);
    Route::delete('admin/success-stories/{id}', [SuccessStoryController::class, 'destroy']);

    // Missing Person Reports Admin Routes
    Route::get('admin/missing-reports/pending', [MissingPersonController::class, 'getPending']);
    Route::patch('admin/missing-reports/{id}/approve', [MissingPersonController::class, 'approve']);
    Route::patch('admin/missing-reports/{id}/reject', [MissingPersonController::class, 'reject']);

    // Found Person Reports Admin Routes
    Route::get('admin/found-reports/pending', [FoundPersonController::class, 'getPending']);
    Route::get('admin/found-reports/{id}/matches', [FoundPersonController::class, 'getMatches']);
    Route::post('admin/found-reports/{id}/rematch', [FoundPersonController::class, 'rematch']);
    Route::patch('admin/found-reports/{id}/approve', [FoundPersonController::class, 'approve']);
    Route::patch('admin/found-reports/{id}/reject', [FoundPersonController::class, 'reject']);

});
// PUBLIC Contact Form Route
Route::post('contact', [App\Http\Controllers\ContactController::class, 'sendContactForm']);
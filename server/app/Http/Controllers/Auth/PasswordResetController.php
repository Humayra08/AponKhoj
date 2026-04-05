<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\PasswordResetRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class PasswordResetController extends Controller
{
    public function __construct()
    {
        $this->middleware('throttle:10,1')->only(['requestReset']);
    }

    /**
     * Step 1: Request password reset — generates ONE code, saves to DB, emails that same code.
     */
    public function requestReset(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'No account found with that email address.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        try {
            $email = strtolower(trim($request->email));

            // Invalidate all previous unused reset codes for this email
            PasswordResetRequest::where('email', $email)
                ->where('used', false)
                ->update(['used' => true]);

            // Generate a single 4-digit code
            $code = str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT);

            // Save this exact code to database
            PasswordResetRequest::create([
                'email'             => $email,
                'verification_code' => $code,
                'expires_at'        => now()->addMinutes(15),
                'used'              => false,
            ]);

            // Email that SAME code
            $this->sendResetEmail($email, $code);

            Log::info("Password reset code generated for {$email}: {$code}");

            return response()->json([
                'message' => 'Verification code sent to your email.',
                'email'   => $email,
            ], 200);

        } catch (\Exception $e) {
            Log::error('Password reset request failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to process request. Please try again.',
            ], 500);
        }
    }

    /**
     * Step 2: Verify the reset code (validates only, does NOT mark as used yet).
     */
    public function verifyResetCode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
            'code'  => 'required|string|size:4',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        try {
            $email = strtolower(trim($request->email));
            $code  = trim($request->code);

            $resetRequest = PasswordResetRequest::where('email', $email)
                ->where('verification_code', $code)
                ->where('used', false)
                ->where('expires_at', '>', now())
                ->latest()
                ->first();

            if (!$resetRequest) {
                Log::warning("Invalid/expired reset code attempt for {$email}");
                return response()->json([
                    'message' => 'Invalid or expired verification code.',
                    'error'   => 'invalid_code',
                ], 400);
            }

            Log::info("Reset code pre-verified for {$email}");

            return response()->json([
                'message' => 'Code verified successfully!',
                'valid'   => true,
            ], 200);

        } catch (\Exception $e) {
            Log::error('Code verification failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Verification failed. Please try again.',
            ], 500);
        }
    }

    /**
     * Step 3: Reset the password using a verified code.
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email'    => 'required|email|exists:users,email',
            'code'     => 'required|string|size:4',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        try {
            $email = strtolower(trim($request->email));
            $code  = trim($request->code);

            // Re-validate the code on the final step too
            $resetRequest = PasswordResetRequest::where('email', $email)
                ->where('verification_code', $code)
                ->where('used', false)
                ->where('expires_at', '>', now())
                ->latest()
                ->first();

            if (!$resetRequest) {
                Log::warning("Invalid/expired reset code on password update for {$email}");
                return response()->json([
                    'message' => 'Invalid or expired verification code. Please start over.',
                    'error'   => 'invalid_code',
                ], 400);
            }

            // Update the user's password
            $user = User::where('email', $email)->firstOrFail();
            $user->update(['password' => Hash::make($request->password)]);

            // Mark the code as used so it can't be reused
            $resetRequest->update(['used' => true]);

            Log::info("Password reset successful for {$email}");

            return response()->json([
                'message' => 'Password reset successfully! Please login with your new password.',
            ], 200);

        } catch (\Exception $e) {
            Log::error('Password reset failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Password reset failed. Please try again.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Send the password reset email with the given code.
     */
    private function sendResetEmail(string $email, string $code): void
    {
        try {
            $user     = User::where('email', $email)->first();
            $userName = $user ? $user->name : 'ব্যবহারকারী';

            Mail::send('emails.password-reset', [
                'code'     => $code,
                'userName' => $userName,
            ], function ($message) use ($email) {
                $message->to($email)
                    ->subject('AponKhoj - পাসওয়ার্ড রিসেট কোড');
            });

            Log::info("Password reset email sent to {$email}");
        } catch (\Exception $e) {
            Log::error("Failed to send reset email to {$email}: " . $e->getMessage());
            // Don't rethrow — the code is in the DB and logged; the user can check server logs in dev
        }
    }
}
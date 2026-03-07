<?php

namespace App\Services;

use App\Models\VerificationCode;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class VerificationService
{
    /**
     * Generate a random 4-digit verification code.
     *
     * @return string
     */
    public function generateCode()
    {
        return str_pad(random_int(0, 9999), 4, '0', STR_PAD_LEFT);
    }

    /**
     * Create and send a verification code to the user's email.
     *
     * @param string $email
     * @return VerificationCode
     */
    public function createAndSendCode($email)
    {
        // Delete any existing unverified codes for this email
        VerificationCode::where('email', $email)
            ->where('verified', false)
            ->delete();

        // Generate new code
        $code = $this->generateCode();

        // Create verification code record
        $verification = VerificationCode::create([
            'email' => $email,
            'code' => $code,
            'expires_at' => now()->addMinutes(15), // Code expires in 15 minutes
            'verified' => false,
        ]);

        // Send email with code
        $this->sendVerificationEmail($email, $code);

        return $verification;
    }

    /**
     * Send verification email with code.
     *
     * @param string $email
     * @param string $code
     * @return void
     */
    protected function sendVerificationEmail($email, $code)
    {
        try {
            // Get user name for personalized email
            $user = User::where('email', $email)->first();
            $userName = $user ? $user->name : 'ব্যবহারকারী';
            
            // Log the code for testing purposes (in case mail fails)
            Log::info("Verification code for {$email}: {$code}");
            
            // Send email with verification code
            Mail::send('emails.verification', [
                'code' => $code,
                'userName' => $userName
            ], function ($message) use ($email) {
                $message->to($email)
                    ->subject('AponKhoj - আপনার ইমেইল যাচাইকরণ কোড');
            });
            
            Log::info("Verification email sent successfully to {$email}");
        } catch (\Exception $e) {
            // Log error but don't throw exception - code is still logged above
            Log::error("Failed to send verification email to {$email}: " . $e->getMessage());
            Log::info("The verification code {$code} is still valid for {$email} - check logs if email fails");
        }
    }

    /**
     * Verify a code for a given email.
     *
     * @param string $email
     * @param string $code
     * @return bool
     */
    public function verifyCode($email, $code)
    {
        $verification = VerificationCode::where('email', $email)
            ->where('code', $code)
            ->where('verified', false)
            ->latest()
            ->first();

        if (!$verification) {
            return false;
        }

        if ($verification->isExpired()) {
            return false;
        }

        // Mark as verified
        $verification->update(['verified' => true]);

        return true;
    }

    /**
     * Check if email has a valid unverified code.
     *
     * @param string $email
     * @return bool
     */
    public function hasValidCode($email)
    {
        return VerificationCode::where('email', $email)
            ->where('verified', false)
            ->where('expires_at', '>', now())
            ->exists();
    }

    /**
     * Get the latest code for an email (for testing purposes).
     *
     * @param string $email
     * @return string|null
     */
    public function getLatestCode($email)
    {
        $verification = VerificationCode::where('email', $email)
            ->latest()
            ->first();

        return $verification ? $verification->code : null;
    }
}

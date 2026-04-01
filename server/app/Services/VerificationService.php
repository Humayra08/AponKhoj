<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class VerificationService
{
    /**
     * Redis key prefix for OTP storage.
     *
     * @var string
     */
    private const OTP_KEY_PREFIX = 'verification_code:';

    /**
     * OTP validity in seconds.
     *
     * @var int
     */
    private const OTP_TTL_SECONDS = 900;

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
     * @return array<string, mixed>
     */
    public function createAndSendCode($email)
    {
        // Generate new code
        $code = $this->generateCode();

        // Store OTP in Redis with expiration.
        $payload = [
            'email' => $email,
            'code' => $code,
            'expires_at' => now()->addSeconds(self::OTP_TTL_SECONDS)->toIso8601String(),
        ];

        Redis::setex(
            $this->otpKey($email),
            self::OTP_TTL_SECONDS,
            json_encode($payload)
        );

        // Send email with code
        $this->sendVerificationEmail($email, $code);

        return $payload;
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
        $stored = Redis::get($this->otpKey($email));

        if (!$stored) {
            return false;
        }

        $data = json_decode($stored, true);

        if (!is_array($data) || !isset($data['code']) || $data['code'] !== $code) {
            return false;
        }

        // Enforce one-time usage after successful verification.
        Redis::del($this->otpKey($email));

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
        return Redis::exists($this->otpKey($email)) > 0;
    }

    /**
     * Get the latest code for an email (for testing purposes).
     *
     * @param string $email
     * @return string|null
     */
    public function getLatestCode($email)
    {
        $stored = Redis::get($this->otpKey($email));

        if (!$stored) {
            return null;
        }

        $data = json_decode($stored, true);

        return is_array($data) && isset($data['code']) ? $data['code'] : null;
    }

    /**
     * Build a case-insensitive Redis key for an email.
     *
     * @param string $email
     * @return string
     */
    private function otpKey($email)
    {
        return self::OTP_KEY_PREFIX . strtolower(trim($email));
    }
}

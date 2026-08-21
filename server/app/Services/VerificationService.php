<?php

namespace App\Services;

use App\Models\User;
use App\Models\VerificationCode;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class VerificationService
{
    /**
     * OTP validity in seconds.
     *
     * @var int
     */
    private const OTP_TTL_SECONDS = 900;

    /**
     * Default purpose used for registration verification codes.
     *
     * @var string
     */
    public const PURPOSE_REGISTRATION = 'registration';

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
     * Create and send a verification code to the user's email, optionally
     * attaching a payload (e.g. pending registration data) to the same row
     * so no separate temporary store is needed.
     *
     * @param string $email
     * @param string $purpose
     * @param array|null $payload
     * @return array<string, mixed>
     */
    public function createAndSendCode($email, $purpose = self::PURPOSE_REGISTRATION, ?array $payload = null)
    {
        $code = $this->generateCode();
        $expiresAt = now()->addSeconds(self::OTP_TTL_SECONDS);

        $attributes = ['email' => $this->normalizeEmail($email), 'purpose' => $purpose];
        $values = ['code' => $code, 'expires_at' => $expiresAt, 'verified' => false];

        if ($payload !== null) {
            $values['payload'] = $payload;
        }

        VerificationCode::updateOrCreate($attributes, $values);

        $this->sendVerificationEmail($email, $code);

        return ['email' => $email, 'code' => $code, 'expires_at' => $expiresAt->toIso8601String()];
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
     * Check whether a still-valid (unexpired) pending code/payload exists for this email+purpose.
     *
     * @param string $email
     * @param string $purpose
     * @return bool
     */
    public function hasPending($email, $purpose = self::PURPOSE_REGISTRATION)
    {
        return VerificationCode::where('email', $this->normalizeEmail($email))
            ->where('purpose', $purpose)
            ->where('expires_at', '>', now())
            ->exists();
    }

    /**
     * Verify a code for a given email+purpose. On success, consumes (deletes)
     * the row and returns its stored payload (or an empty array if none was
     * attached). Returns null if the code is invalid, expired, or not found.
     *
     * @param string $email
     * @param string $code
     * @param string $purpose
     * @return array|null
     */
    public function verifyAndConsume($email, $code, $purpose = self::PURPOSE_REGISTRATION)
    {
        $record = VerificationCode::where('email', $this->normalizeEmail($email))
            ->where('purpose', $purpose)
            ->where('code', $code)
            ->where('expires_at', '>', now())
            ->first();

        if (!$record) {
            return null;
        }

        $payload = $record->payload ?? [];
        $record->delete();

        return $payload;
    }

    /**
     * Normalize an email for case-insensitive lookups.
     *
     * @param string $email
     * @return string
     */
    private function normalizeEmail($email)
    {
        return strtolower(trim($email));
    }
}

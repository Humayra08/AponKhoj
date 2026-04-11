<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * GioSmsService
 *
 * Wraps the GioSMS REST API (https://api.giosms.com/api/v1).
 * Configured via environment variables — see .env additions below.
 */
class GioSmsService
{
    private string $baseUrl;
    private string $token;
    private string $senderId;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.giosms.base_url', 'https://api.giosms.com/api/v1'), '/');
        $this->token   = config('services.giosms.token', '');
        $this->senderId = config('services.giosms.sender_id', '');  
    }

    /**
     * Send a single SMS to one phone number.
     *
     * @param  string $phone   Recipient number with country code, e.g. 8801712345678
     * @param  string $message The message body (Bengali Unicode is fine — API auto-detects)
     * @param  string $type    'otp' | 'transactional' | 'promotional'
     * @return array           ['success' => bool, 'message_id' => string|null, 'error' => string|null]
     */
    public function sendSingle(string $phone, string $message, string $type = 'transactional'): array
    {
        try {
            $response = Http::withToken($this->token)
                ->acceptJson()
                ->post("{$this->baseUrl}/send", [
                    'sender_id' => $this->senderId,
                    'to'      => $phone,
                    'message' => $message,
                    'type'    => $type,
                ]);

            $body = $response->json();

            if ($response->successful() && ($body['success'] ?? false)) {
                Log::info('[GioSMS] SMS sent', [
                    'to'         => $phone,
                    'message_id' => $body['data']['message_id'] ?? null,
                ]);

                return [
                    'success'    => true,
                    'message_id' => $body['data']['message_id'] ?? null,
                    'error'      => null,
                ];
            }

            Log::warning('[GioSMS] SMS send failed', [
                'to'       => $phone,
                'status'   => $response->status(),
                'response' => $body,
            ]);

            return [
                'success'    => false,
                'message_id' => null,
                'error'      => $body['message'] ?? 'Unknown error from GioSMS',
            ];

        } catch (\Throwable $e) {
            Log::error('[GioSMS] Exception while sending SMS', [
                'to'    => $phone,
                'error' => $e->getMessage(),
            ]);

            return [
                'success'    => false,
                'message_id' => null,
                'error'      => $e->getMessage(),
            ];
        }
    }

    /**
     * Send the same message to multiple phone numbers (bulk mode).
     * Comma-separates the numbers and lets GioSMS handle batching.
     *
     * @param  array  $phones  Array of phone numbers (each with country code)
     * @param  string $message The message body
     * @param  string $type    'otp' | 'transactional' | 'promotional'
     * @return array           ['success' => bool, 'batch_id' => string|null, 'error' => string|null]
     */
    public function sendBulk(array $phones, string $message, string $type = 'transactional'): array
    {
        if (empty($phones)) {
            return ['success' => false, 'batch_id' => null, 'error' => 'No recipients provided'];
        }

        // GioSMS bulk mode: comma-separated numbers in "to"
        $to = implode(',', $phones);

        try {
            $response = Http::withToken($this->token)
                ->acceptJson()
                ->post("{$this->baseUrl}/send", [
                    'sender_id' => $this->senderId,
                    'to'      => $to,
                    'message' => $message,
                    'type'    => $type,
                ]);

            $body = $response->json();

            if ($response->successful() && ($body['success'] ?? false)) {
                $batchId = $body['data']['batch_id'] ?? null;

                Log::info('[GioSMS] Bulk SMS queued', [
                    'recipients' => count($phones),
                    'batch_id'   => $batchId,
                ]);

                return [
                    'success'  => true,
                    'batch_id' => $batchId,
                    'error'    => null,
                ];
            }

            Log::warning('[GioSMS] Bulk SMS send failed', [
                'status'   => $response->status(),
                'response' => $body,
            ]);

            return [
                'success'  => false,
                'batch_id' => null,
                'error'    => $body['message'] ?? 'Unknown error from GioSMS',
            ];

        } catch (\Throwable $e) {
            Log::error('[GioSMS] Exception in bulk send', ['error' => $e->getMessage()]);

            return [
                'success'  => false,
                'batch_id' => null,
                'error'    => $e->getMessage(),
            ];
        }
    }

    /**
     * Build the standard missing-report alert message in Bengali.
     *
     * @param  string $name          Missing person's name
     * @param  string $address       Last seen address
     * @param  string $contactPhone  Contact number provided in the report
     * @return string
     */
    public static function buildMissingReportMessage(
        string $name,
        string $address,
        string $contactPhone
    ): string {
        return "আপনার এলাকায় একটি নিখোঁজ রিপোর্ট হয়েছে\n"
            . "নাম: {$name}\n"
            . "ঠিকানা: {$address}\n"
            . "খোঁজ পেলে যোগাযোগ করুন: {$contactPhone}\n"
            . "— আপনখোঁজ";
    }
}

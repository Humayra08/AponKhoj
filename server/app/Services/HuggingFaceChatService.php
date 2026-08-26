<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class HuggingFaceChatService
{
    private string $apiKey;
    private string $model;
    private string $baseUrl = 'https://router.huggingface.co/v1';

    public function __construct()
    {
        $this->apiKey = config('services.huggingface.api_key', '');
        $this->model = config('services.huggingface.chat_model', 'meta-llama/Llama-3.3-70B-Instruct');
    }

    /**
     * Send a chat-completion request to the Hugging Face Inference API.
     * $messages is the standard OpenAI-style [{role, content}, ...] array.
     * Retries once on 429/5xx (free tier can rate-limit or cold-start).
     *
     * @param array<int, array{role: string, content: string}> $messages
     * @return string|null the assistant's reply text, or null on failure
     */
    public function chat(array $messages, float $temperature = 0.3, int $maxTokens = 800): ?string
    {
        $attempts = 0;

        while ($attempts < 2) {
            $attempts++;

            try {
                $response = Http::withToken($this->apiKey)
                    ->timeout(45)
                    ->post("{$this->baseUrl}/chat/completions", [
                        'model' => $this->model,
                        'messages' => $messages,
                        'temperature' => $temperature,
                        'max_tokens' => $maxTokens,
                    ]);

                if ($response->successful()) {
                    return $response->json('choices.0.message.content');
                }

                if (in_array($response->status(), [429, 500, 502, 503, 504], true) && $attempts < 2) {
                    Log::warning("HuggingFaceChatService: got {$response->status()}, retrying once");
                    usleep(500_000);
                    continue;
                }

                Log::warning('HuggingFaceChatService: request failed with status ' . $response->status() . ' body: ' . $response->body());
                return null;
            } catch (\Exception $e) {
                if ($attempts < 2) {
                    usleep(500_000);
                    continue;
                }
                Log::error('HuggingFaceChatService: request threw: ' . $e->getMessage());
                return null;
            }
        }

        return null;
    }
}

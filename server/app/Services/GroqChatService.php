<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Chat generation via Groq's free-tier API — swapped in for the earlier
 * Hugging Face Inference API after HF's small monthly credit pool was
 * exhausted during development. Groq's free tier has a much higher request
 * ceiling (tens of thousands/day vs. HF's easily-exhausted credit pool) and
 * exposes the same OpenAI-compatible /chat/completions shape, so this is a
 * near drop-in replacement for HuggingFaceChatService.
 */
class GroqChatService
{
    private string $apiKey;
    private string $model;
    private string $baseUrl = 'https://api.groq.com/openai/v1';

    public function __construct()
    {
        $this->apiKey = config('services.groq.api_key', '');
        $this->model = config('services.groq.chat_model', 'openai/gpt-oss-120b');
    }

    /**
     * Send a chat-completion request to Groq.
     * $messages is the standard OpenAI-style [{role, content}, ...] array.
     * Retries on 429/5xx and on degenerate output (rare, but seen historically
     * with frequency/presence penalties on Bengali prompts — deliberately not
     * set here, see note below).
     *
     * @param array<int, array{role: string, content: string}> $messages
     * @return string|null the assistant's reply text, or null on failure
     */
    public function chat(array $messages, float $temperature = 0.3, int $maxTokens = 800): ?string
    {
        $attempts = 0;
        $maxAttempts = 3;

        while ($attempts < $maxAttempts) {
            $attempts++;

            try {
                // NOTE: deliberately no frequency_penalty/presence_penalty.
                // On the equivalent Hugging Face setup, these caused the model
                // to substitute Hindi/Cyrillic-script tokens mid-reply on
                // Bengali prompts (Bengali reuses subword tokens far more than
                // English, so penalizing repeats backfires) — confirmed via
                // direct A/B testing. Kept out here as a precaution.
                $response = Http::withToken($this->apiKey)
                    ->timeout(45)
                    ->post("{$this->baseUrl}/chat/completions", [
                        'model' => $this->model,
                        'messages' => $messages,
                        'temperature' => $temperature,
                        'max_tokens' => $maxTokens,
                    ]);

                if ($response->successful()) {
                    $content = $response->json('choices.0.message.content');

                    if ($content !== null && $this->looksDegenerate($content)) {
                        $more = $attempts < $maxAttempts;
                        Log::warning('GroqChatService: degenerate output detected' . ($more ? ', retrying' : ' (out of retries)'));
                        if ($more) {
                            usleep(300_000);
                            continue;
                        }
                        return null;
                    }

                    return $content;
                }

                if (in_array($response->status(), [429, 500, 502, 503, 504], true) && $attempts < $maxAttempts) {
                    Log::warning("GroqChatService: got {$response->status()}, retrying");
                    usleep(500_000);
                    continue;
                }

                Log::warning('GroqChatService: request failed with status ' . $response->status() . ' body: ' . $response->body());
                return null;
            } catch (\Exception $e) {
                if ($attempts < $maxAttempts) {
                    usleep(500_000);
                    continue;
                }
                Log::error('GroqChatService: request threw: ' . $e->getMessage());
                return null;
            }
        }

        return null;
    }

    /**
     * Heuristic check for the "model collapses into repeating the same token
     * forever" failure mode (e.g. a reply that's 90% the character "?").
     * Not a language-quality check — just catches obvious garbage so it
     * triggers a retry/fallback instead of being shown to the user.
     */
    private function looksDegenerate(string $content): bool
    {
        $length = mb_strlen($content);

        if ($length < 60) {
            return false;
        }

        $counts = [];
        foreach (mb_str_split($content) as $char) {
            if (trim($char) === '') {
                continue;
            }
            $counts[$char] = ($counts[$char] ?? 0) + 1;
        }

        if (empty($counts)) {
            return false;
        }

        $mostCommon = max($counts);

        return ($mostCommon / $length) > 0.35;
    }
}

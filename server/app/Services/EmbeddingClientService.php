<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EmbeddingClientService
{
    private string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.ai_embeddings.base_url', ''), '/');
    }

    /**
     * Get a text embedding vector from the ai-embeddings microservice.
     * Returns null on any failure (network, non-2xx, malformed response).
     *
     * @return float[]|null
     */
    public function embedText(string $text): ?array
    {
        try {
            $response = Http::timeout(15)->post("{$this->baseUrl}/embed-text", [
                'text' => $text,
            ]);

            if (!$response->successful()) {
                Log::warning('EmbeddingClientService: /embed-text failed with status ' . $response->status());
                return null;
            }

            $embedding = $response->json('embedding');
            return is_array($embedding) ? $embedding : null;
        } catch (\Exception $e) {
            Log::error('EmbeddingClientService: /embed-text request failed: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get a face embedding vector from an image URL via the ai-embeddings microservice.
     * Returns null if no face was detected or the request failed.
     *
     * @return float[]|null
     */
    public function embedFace(string $imageUrl): ?array
    {
        try {
            $response = Http::timeout(30)->post("{$this->baseUrl}/embed-face", [
                'image_url' => $imageUrl,
            ]);

            if (!$response->successful()) {
                Log::warning('EmbeddingClientService: /embed-face failed with status ' . $response->status());
                return null;
            }

            $embedding = $response->json('embedding');
            return is_array($embedding) ? $embedding : null;
        } catch (\Exception $e) {
            Log::error('EmbeddingClientService: /embed-face request failed: ' . $e->getMessage());
            return null;
        }
    }
}

<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class VectorIndexService
{
    private const TEXT_DIM = 384; // sentence-transformers/all-MiniLM-L6-v2
    private const FACE_DIM = 512; // insightface/ArcFace (Phase 2)

    private function connection()
    {
        return Redis::connection('vector');
    }

    /**
     * Pack a float array into the binary blob format RediSearch expects for a VECTOR field.
     */
    private function packVector(array $vector): string
    {
        return pack('g*', ...$vector);
    }

    private function ensureIndex(string $indexName, string $prefix, int $dim): void
    {
        try {
            $this->connection()->executeRaw([
                'FT.CREATE', $indexName,
                'ON', 'HASH',
                'PREFIX', '1', $prefix,
                'SCHEMA',
                'text', 'TEXT',
                'ref_id', 'TEXT',
                'ref_type', 'TAG',
                'embedding', 'VECTOR', 'HNSW', '6',
                'TYPE', 'FLOAT32',
                'DIM', (string) $dim,
                'DISTANCE_METRIC', 'COSINE',
            ]);
        } catch (\Exception $e) {
            // "Index already exists" is expected on every call after the first — ignore it.
            if (!str_contains($e->getMessage(), 'Index already exists')) {
                Log::warning("VectorIndexService: FT.CREATE {$indexName} failed: " . $e->getMessage());
            }
        }
    }

    public function ensureKbIndex(): void
    {
        $this->ensureIndex('idx:kb', 'kb:', self::TEXT_DIM);
    }

    public function ensureReportsTextIndex(): void
    {
        $this->ensureIndex('idx:reports_text', 'report_text:', self::TEXT_DIM);
    }

    public function ensureFacesIndex(): void
    {
        $this->ensureIndex('idx:faces', 'face:', self::FACE_DIM);
    }

    public function upsertKbChunk(int $chunkId, string $text, array $embedding): void
    {
        $this->ensureKbIndex();
        $this->connection()->hmset("kb:{$chunkId}", [
            'text' => $text,
            'ref_id' => (string) $chunkId,
            'ref_type' => 'kb',
            'embedding' => $this->packVector($embedding),
        ]);
    }

    public function upsertReportText(string $reportType, int $reportId, string $text, array $embedding): void
    {
        $this->ensureReportsTextIndex();
        $key = "report_text:{$reportType}:{$reportId}";
        $this->connection()->hmset($key, [
            'text' => $text,
            'ref_id' => (string) $reportId,
            'ref_type' => $reportType,
            'embedding' => $this->packVector($embedding),
        ]);
    }

    public function upsertFaceEmbedding(int $missingReportId, array $embedding): void
    {
        $this->ensureFacesIndex();
        $key = "face:missing:{$missingReportId}";
        $this->connection()->hmset($key, [
            'ref_id' => (string) $missingReportId,
            'ref_type' => 'missing',
            'embedding' => $this->packVector($embedding),
        ]);
    }

    public function deleteReportText(string $reportType, int $reportId): void
    {
        $this->connection()->del("report_text:{$reportType}:{$reportId}");
    }

    public function deleteFaceEmbedding(int $missingReportId): void
    {
        $this->connection()->del("face:missing:{$missingReportId}");
    }

    /**
     * KNN search against idx:kb. Returns [['ref_id' => ..., 'text' => ..., 'score' => float], ...]
     */
    public function searchKb(array $queryEmbedding, int $limit = 4): array
    {
        return $this->knnSearch('idx:kb', $queryEmbedding, $limit);
    }

    /**
     * KNN search against idx:reports_text. Returns [['ref_id' => ..., 'ref_type' => ..., 'text' => ..., 'score' => float], ...]
     */
    public function searchReportsText(array $queryEmbedding, int $limit = 6): array
    {
        return $this->knnSearch('idx:reports_text', $queryEmbedding, $limit);
    }

    /**
     * KNN search against idx:faces. Returns [['ref_id' => ..., 'score' => float], ...] sorted by similarity.
     */
    public function searchFaces(array $queryEmbedding, int $limit = 5): array
    {
        return $this->knnSearch('idx:faces', $queryEmbedding, $limit);
    }

    private function knnSearch(string $indexName, array $queryEmbedding, int $limit): array
    {
        try {
            $blob = $this->packVector($queryEmbedding);

            $raw = $this->connection()->executeRaw([
                'FT.SEARCH', $indexName,
                "*=>[KNN {$limit} @embedding \$vec AS score]",
                'PARAMS', '2', 'vec', $blob,
                'SORTBY', 'score',
                'RETURN', '3', 'ref_id', 'ref_type', 'text',
                'DIALECT', '2',
            ]);

            return $this->parseSearchResults($raw);
        } catch (\Exception $e) {
            Log::warning("VectorIndexService: FT.SEARCH {$indexName} failed: " . $e->getMessage());
            return [];
        }
    }

    /**
     * RediSearch raw reply shape: [total, key1, [field, value, field, value, ...], key2, [...], ...]
     */
    private function parseSearchResults($raw): array
    {
        if (!is_array($raw) || count($raw) < 1) {
            return [];
        }

        $results = [];
        $count = count($raw);

        for ($i = 1; $i < $count; $i += 2) {
            $fields = $raw[$i + 1] ?? [];
            $row = ['key' => $raw[$i]];

            for ($j = 0; $j < count($fields); $j += 2) {
                $row[$fields[$j]] = $fields[$j + 1] ?? null;
            }

            $results[] = $row;
        }

        return $results;
    }
}

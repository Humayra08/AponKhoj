<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Vector store client for the chatbot's semantic search — backed by Supabase
 * Postgres + pgvector (connection 'supabase' in config/database.php), kept
 * entirely separate from the app's main MySQL database. Callers pass
 * pre-computed embeddings (from EmbeddingClientService), so this class never
 * calls the embedding model itself.
 *
 * All rows live in one `chat_vectors` table, distinguished by `collection`
 * ('kb', 'reports_text', 'faces') — see the migration that creates it.
 */
class VectorIndexService
{
    public function upsertKbChunk(int $chunkId, string $text, array $embedding): void
    {
        $this->upsert('kb', "kb:{$chunkId}", $text, $embedding, (string) $chunkId, 'kb');
    }

    public function upsertReportText(string $reportType, int $reportId, string $text, array $embedding): void
    {
        $this->upsert('reports_text', "{$reportType}:{$reportId}", $text, $embedding, (string) $reportId, $reportType);
    }

    public function upsertFaceEmbedding(int $missingReportId, array $embedding): void
    {
        $this->upsert('faces', "missing:{$missingReportId}", '', $embedding, (string) $missingReportId, 'missing');
    }

    public function deleteReportText(string $reportType, int $reportId): void
    {
        $this->delete('reports_text', "{$reportType}:{$reportId}");
    }

    public function deleteFaceEmbedding(int $missingReportId): void
    {
        $this->delete('faces', "missing:{$missingReportId}");
    }

    /**
     * KNN search against the kb collection. Returns [['ref_id','ref_type','text','score'], ...]
     */
    public function searchKb(array $queryEmbedding, int $limit = 4): array
    {
        return $this->search('kb', $queryEmbedding, $limit);
    }

    /**
     * KNN search against the reports_text collection.
     */
    public function searchReportsText(array $queryEmbedding, int $limit = 6): array
    {
        return $this->search('reports_text', $queryEmbedding, $limit);
    }

    /**
     * KNN search against the faces collection (Phase 2).
     */
    public function searchFaces(array $queryEmbedding, int $limit = 5): array
    {
        return $this->search('faces', $queryEmbedding, $limit);
    }

    private function upsert(string $collection, string $refKey, string $text, array $embedding, string $refId, string $refType): void
    {
        try {
            $vectorLiteral = $this->toVectorLiteral($embedding);

            DB::connection('supabase')->statement(
                'INSERT INTO chat_vectors (collection, ref_key, ref_id, ref_type, text, embedding, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?::vector, NOW())
                 ON CONFLICT (collection, ref_key)
                 DO UPDATE SET ref_id = EXCLUDED.ref_id, ref_type = EXCLUDED.ref_type,
                               text = EXCLUDED.text, embedding = EXCLUDED.embedding, updated_at = NOW()',
                [$collection, $refKey, $refId, $refType, $text, $vectorLiteral]
            );
        } catch (\Exception $e) {
            Log::warning("VectorIndexService: upsert into {$collection} failed: " . $e->getMessage());
        }
    }

    private function delete(string $collection, string $refKey): void
    {
        try {
            DB::connection('supabase')->delete(
                'DELETE FROM chat_vectors WHERE collection = ? AND ref_key = ?',
                [$collection, $refKey]
            );
        } catch (\Exception $e) {
            Log::warning("VectorIndexService: delete from {$collection} failed: " . $e->getMessage());
        }
    }

    private function search(string $collection, array $queryEmbedding, int $limit): array
    {
        try {
            $vectorLiteral = $this->toVectorLiteral($queryEmbedding);

            $rows = DB::connection('supabase')->select(
                'SELECT ref_id, ref_type, text, embedding <=> ?::vector AS distance
                 FROM chat_vectors
                 WHERE collection = ?
                 ORDER BY embedding <=> ?::vector
                 LIMIT ?',
                [$vectorLiteral, $collection, $vectorLiteral, $limit]
            );

            return array_map(fn ($row) => [
                'ref_id' => $row->ref_id,
                'ref_type' => $row->ref_type,
                'text' => $row->text,
                'score' => (float) $row->distance,
            ], $rows);
        } catch (\Exception $e) {
            Log::warning("VectorIndexService: search on {$collection} failed: " . $e->getMessage());
            return [];
        }
    }

    /**
     * pgvector's text input/output format: '[0.1,0.2,0.3]'
     */
    private function toVectorLiteral(array $embedding): string
    {
        return '[' . implode(',', array_map(fn ($v) => (string) (float) $v, $embedding)) . ']';
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Runs against the 'supabase' connection (Postgres + pgvector), not the app's
 * main MySQL database. Holds the chatbot's semantic-search vectors: KB chunks,
 * report text embeddings, and (Phase 2) face embeddings — all in one table,
 * distinguished by `collection`.
 *
 * Embedding dimension is 1024 to match the ai-embeddings microservice's
 * BAAI/bge-m3 model (multilingual — chosen over English-only MiniLM for
 * Bengali/English/Banglish mixed text).
 */
return new class extends Migration
{
    protected $connection = 'supabase';

    public function up(): void
    {
        DB::connection('supabase')->statement('CREATE EXTENSION IF NOT EXISTS vector');

        DB::connection('supabase')->statement(<<<'SQL'
            CREATE TABLE IF NOT EXISTS chat_vectors (
                id BIGSERIAL PRIMARY KEY,
                collection VARCHAR(40) NOT NULL,
                ref_key VARCHAR(120) NOT NULL,
                ref_id VARCHAR(40),
                ref_type VARCHAR(40),
                text TEXT,
                embedding VECTOR(1024),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                UNIQUE (collection, ref_key)
            )
        SQL);

        // Cosine-distance ANN index. IVFFlat needs data present to pick a good
        // `lists` value, but works fine (just less optimally) on an empty table
        // for a project at this scale — fine to leave as-is long term too.
        DB::connection('supabase')->statement(
            'CREATE INDEX IF NOT EXISTS chat_vectors_embedding_idx
             ON chat_vectors USING ivfflat (embedding vector_cosine_ops)
             WITH (lists = 100)'
        );

        DB::connection('supabase')->statement(
            'CREATE INDEX IF NOT EXISTS chat_vectors_collection_idx ON chat_vectors (collection)'
        );
    }

    public function down(): void
    {
        DB::connection('supabase')->statement('DROP TABLE IF EXISTS chat_vectors');
    }
};

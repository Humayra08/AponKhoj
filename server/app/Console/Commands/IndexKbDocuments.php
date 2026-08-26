<?php

namespace App\Console\Commands;

use App\Models\KbDocument;
use App\Services\EmbeddingClientService;
use App\Services\VectorIndexService;
use Illuminate\Console\Command;

class IndexKbDocuments extends Command
{
    protected $signature = 'chat:index-kb {--file= : Path to the KB markdown file (default: resources/kb/faq.md)}';

    protected $description = 'Chunk and embed the chatbot knowledge-base markdown file into KbDocument rows and the Redis vector index.';

    public function handle(EmbeddingClientService $embeddingClient, VectorIndexService $vectorIndex): int
    {
        $path = $this->option('file') ?: resource_path('kb/faq.md');

        if (!file_exists($path)) {
            $this->error("KB file not found: {$path}");
            return self::FAILURE;
        }

        $markdown = file_get_contents($path);
        $chunks = $this->chunkByHeading($markdown);

        $this->info('Found ' . count($chunks) . ' chunk(s). Clearing previous KB rows...');
        KbDocument::where('source', 'faq.md')->delete();

        $bar = $this->output->createProgressBar(count($chunks));
        $indexed = 0;

        foreach ($chunks as $i => $chunk) {
            $doc = KbDocument::create([
                'source' => 'faq.md',
                'title' => $chunk['title'],
                'chunk_text' => $chunk['text'],
                'chunk_index' => $i,
            ]);

            $embedding = $embeddingClient->embedText($chunk['title'] . "\n" . $chunk['text']);

            if ($embedding !== null) {
                $vectorIndex->upsertKbChunk($doc->id, $chunk['title'] . ': ' . $chunk['text'], $embedding);
                $doc->update(['embedding_indexed_at' => now()]);
                $indexed++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("Indexed {$indexed}/" . count($chunks) . ' chunks.');

        return self::SUCCESS;
    }

    /**
     * Split markdown into chunks on "## " headings — each heading + its body becomes one chunk.
     *
     * @return array<int, array{title: string, text: string}>
     */
    private function chunkByHeading(string $markdown): array
    {
        $sections = preg_split('/^##\s+/m', $markdown);
        $chunks = [];

        foreach ($sections as $section) {
            $section = trim($section);
            if ($section === '' || str_starts_with($section, '# ')) {
                continue;
            }

            $lines = explode("\n", $section, 2);
            $title = trim($lines[0]);
            $body = trim($lines[1] ?? '');

            if ($title !== '' && $body !== '') {
                $chunks[] = ['title' => $title, 'text' => $body];
            }
        }

        return $chunks;
    }
}

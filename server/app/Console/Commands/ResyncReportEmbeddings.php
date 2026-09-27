<?php

namespace App\Console\Commands;

use App\Models\FoundReport;
use App\Models\MissingReport;
use App\Observers\FoundReportObserver;
use App\Observers\MissingReportObserver;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ResyncReportEmbeddings extends Command
{
    protected $signature = 'chat:resync-embeddings';

    protected $description = 'Safety net for the real-time observer: re-index any published report whose embedding is missing or stale (updated_at newer than embedding_indexed_at).';

    public function handle(): int
    {
        $staleMissing = MissingReport::where('approved', true)
            ->where('status', 'published')
            ->where(function ($q) {
                $q->whereNull('embedding_indexed_at')
                    ->orWhereColumn('embedding_indexed_at', '<', 'updated_at');
            })
            ->get();

        foreach ($staleMissing as $report) {
            MissingReportObserver::indexReport($report->id);
        }

        $staleFound = FoundReport::where('approved', true)
            ->where('status', 'published')
            ->where(function ($q) {
                $q->whereNull('embedding_indexed_at')
                    ->orWhereColumn('embedding_indexed_at', '<', 'updated_at');
            })
            ->get();

        foreach ($staleFound as $report) {
            FoundReportObserver::indexReport($report->id);
        }

        $total = $staleMissing->count() + $staleFound->count();
        $this->info("Resynced {$total} stale report embedding(s) ({$staleMissing->count()} missing, {$staleFound->count()} found).");

        return self::SUCCESS;
    }
}

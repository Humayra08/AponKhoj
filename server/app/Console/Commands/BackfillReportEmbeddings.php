<?php

namespace App\Console\Commands;

use App\Models\FoundReport;
use App\Models\MissingReport;
use App\Observers\FoundReportObserver;
use App\Observers\MissingReportObserver;
use Illuminate\Console\Command;

class BackfillReportEmbeddings extends Command
{
    protected $signature = 'chat:backfill-embeddings';

    protected $description = 'One-time backfill: index every published, approved missing/found report that has no embedding yet.';

    public function handle(): int
    {
        $missing = MissingReport::where('approved', true)
            ->where('status', 'published')
            ->get();

        $this->info("Backfilling {$missing->count()} missing report(s)...");
        $bar = $this->output->createProgressBar($missing->count());
        foreach ($missing as $report) {
            MissingReportObserver::indexReport($report->id);
            $bar->advance();
        }
        $bar->finish();
        $this->newLine();

        $found = FoundReport::where('approved', true)
            ->where('status', 'published')
            ->get();

        $this->info("Backfilling {$found->count()} found report(s)...");
        $bar = $this->output->createProgressBar($found->count());
        foreach ($found as $report) {
            FoundReportObserver::indexReport($report->id);
            $bar->advance();
        }
        $bar->finish();
        $this->newLine();
        $this->info('Backfill complete.');

        return self::SUCCESS;
    }
}

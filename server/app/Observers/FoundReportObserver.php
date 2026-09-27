<?php

namespace App\Observers;

use App\Models\FoundReport;
use App\Services\EmbeddingClientService;
use App\Services\VectorIndexService;
use Illuminate\Support\Facades\Log;

class FoundReportObserver
{
    public function saved(FoundReport $report): void
    {
        if (!($report->approved && $report->status === 'published')) {
            return;
        }

        $reportId = $report->id;

        dispatch(function () use ($reportId) {
            self::indexReport($reportId);
        })->afterResponse();
    }

    public function deleted(FoundReport $report): void
    {
        $reportId = $report->id;

        dispatch(function () use ($reportId) {
            try {
                app(VectorIndexService::class)->deleteReportText('found', $reportId);
            } catch (\Exception $e) {
                Log::warning("FoundReportObserver: cleanup failed for #{$reportId}: " . $e->getMessage());
            }
        })->afterResponse();
    }

    public static function indexReport(int $reportId): void
    {
        try {
            $report = FoundReport::find($reportId);
            if (!$report || !($report->approved && $report->status === 'published')) {
                return;
            }

            $embeddingClient = app(EmbeddingClientService::class);
            $vectorIndex = app(VectorIndexService::class);

            $text = self::buildIndexText($report);
            $embedding = $embeddingClient->embedText($text);

            if ($embedding !== null) {
                $vectorIndex->upsertReportText('found', $report->id, $text, $embedding);
            }

            $report->timestamps = false;
            $report->embedding_indexed_at = now();
            $report->saveQuietly();
        } catch (\Exception $e) {
            Log::warning("FoundReportObserver: indexing failed for #{$reportId}: " . $e->getMessage());
        }
    }

    public static function buildIndexText(FoundReport $report): string
    {
        return implode(', ', array_filter([
            $report->name,
            $report->district,
            $report->address,
            $report->physical_description,
            $report->additional_info,
        ]));
    }
}

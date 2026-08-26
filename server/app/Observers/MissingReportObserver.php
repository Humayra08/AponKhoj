<?php

namespace App\Observers;

use App\Models\MissingReport;
use App\Services\EmbeddingClientService;
use App\Services\VectorIndexService;
use Illuminate\Support\Facades\Log;

class MissingReportObserver
{
    public function saved(MissingReport $report): void
    {
        if (!($report->approved && $report->status === 'published')) {
            return;
        }

        $reportId = $report->id;

        dispatch(function () use ($reportId) {
            self::indexReport($reportId);
        })->afterResponse();
    }

    public function deleted(MissingReport $report): void
    {
        $reportId = $report->id;

        dispatch(function () use ($reportId) {
            try {
                app(VectorIndexService::class)->deleteReportText('missing', $reportId);
                app(VectorIndexService::class)->deleteFaceEmbedding($reportId);
            } catch (\Exception $e) {
                Log::warning("MissingReportObserver: cleanup failed for #{$reportId}: " . $e->getMessage());
            }
        })->afterResponse();
    }

    public static function indexReport(int $reportId): void
    {
        try {
            $report = MissingReport::find($reportId);
            if (!$report || !($report->approved && $report->status === 'published')) {
                return;
            }

            $embeddingClient = app(EmbeddingClientService::class);
            $vectorIndex = app(VectorIndexService::class);

            $text = self::buildIndexText($report);
            $embedding = $embeddingClient->embedText($text);

            if ($embedding !== null) {
                $vectorIndex->upsertReportText('missing', $report->id, $text, $embedding);
            }

            if ($report->photo_url) {
                $faceEmbedding = $embeddingClient->embedFace($report->photo_url);
                if ($faceEmbedding !== null) {
                    $vectorIndex->upsertFaceEmbedding($report->id, $faceEmbedding);
                }
            }

            $report->timestamps = false;
            $report->embedding_indexed_at = now();
            $report->saveQuietly();
        } catch (\Exception $e) {
            Log::warning("MissingReportObserver: indexing failed for #{$reportId}: " . $e->getMessage());
        }
    }

    public static function buildIndexText(MissingReport $report): string
    {
        return implode(', ', array_filter([
            $report->name,
            $report->district,
            $report->address,
            $report->clothing_description,
            $report->additional_info,
        ]));
    }
}

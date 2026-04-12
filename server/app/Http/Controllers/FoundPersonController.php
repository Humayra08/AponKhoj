<?php

namespace App\Http\Controllers;

use App\Models\FoundMatch;
use App\Models\FoundReport;
use App\Models\MissingReport;
use App\Services\CloudinaryService;
use App\Services\OpenRouterMatchingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class FoundPersonController extends Controller
{
    private const USER_AI_MATCH_MIN_SCORE = 60.0;

    public function __construct(
        protected CloudinaryService $cloudinaryService,
        protected OpenRouterMatchingService $matchingService,
    ) {}

    // ──────────────────────────────────────────────────────────
    // USER: Submit found person report
    // POST /api/found-reports
    // ──────────────────────────────────────────────────────────
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name'                 => 'nullable|string|max:255',
                'approximate_age'      => 'nullable|integer|min:0|max:150',
                'gender'               => 'nullable|string|in:male,female,other',
                'health_status'        => 'nullable|string|in:healthy,sick,unknown',
                'found_date'           => 'nullable|date',
                'found_time'           => 'nullable|date_format:H:i',
                'district'             => 'required|string|max:100',
                'address'              => 'nullable|string|max:500',
                'physical_description' => 'nullable|string|max:500',
                'additional_info'      => 'nullable|string|max:1000',
                'contact_person_name'  => 'required|string|max:255',
                'contact_phone'        => 'required|string|max:20',
                'photo'                => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
            ]);

            $photoUrl  = null;
            $publicId  = null;

            if ($request->hasFile('photo')) {
                $upload = $this->cloudinaryService->uploadImage(
                    $request->file('photo'),
                    'aponkhoj/found-reports'
                );
                if (!$upload['success']) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Photo upload failed: ' . $upload['message'],
                    ], 400);
                }
                $photoUrl = $upload['url'];
                $publicId = $upload['public_id'];
            }

            $report = FoundReport::create([
                'user_id'              => Auth::id(),
                'name'                 => $validated['name'] ?? null,
                'approximate_age'      => $validated['approximate_age'] ?? null,
                'gender'               => $validated['gender'] ?? null,
                'health_status'        => $validated['health_status'] ?? 'unknown',
                'found_date'           => $validated['found_date'] ?? null,
                'found_time'           => $validated['found_time'] ?? null,
                'district'             => $validated['district'],
                'address'              => $validated['address'] ?? null,
                'physical_description' => $validated['physical_description'] ?? null,
                'additional_info'      => $validated['additional_info'] ?? null,
                'contact_person_name'  => $validated['contact_person_name'],
                'contact_phone'        => $validated['contact_phone'],
                'photo_url'            => $photoUrl,
                'cloudinary_public_id' => $publicId,
                'status'               => 'pending',
                'approved'             => false,
            ]);

            // Run matching after response so user submit latency stays low.
            $reportId = $report->id;
            dispatch(function () use ($reportId) {
                try {
                    $reportToMatch = FoundReport::find($reportId);
                    if ($reportToMatch) {
                        $this->matchingService->runMatchingForFoundReport($reportToMatch);
                    }
                } catch (\Exception $e) {
                    \Log::warning('AI matching failed after submission: ' . $e->getMessage());
                }
            })->afterResponse();

            return response()->json([
                'success' => true,
                'message' => 'রিপোর্ট সফলভাবে জমা দেওয়া হয়েছে। আমাদের টিম পর্যালোচনা করবে।',
                'report'  => [
                    'id'     => $report->id,
                    'status' => $report->status,
                ],
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error submitting report: ' . $e->getMessage(),
            ], 500);
        }
    }

    // ──────────────────────────────────────────────────────────
    // USER: Get my found reports
    // GET /api/found-reports/my
    // ──────────────────────────────────────────────────────────
    public function getMyReports(Request $request)
    {
        $reports = FoundReport::where('user_id', $request->user()->id)
            ->latest()
            ->get()
            ->map(fn($r) => $this->formatReport($r));

        return response()->json(['success' => true, 'reports' => $reports]);
    }

    // ──────────────────────────────────────────────────────────
    // USER: Get my approved found reports that have AI matches
    // GET /api/found-reports/my/ai-matches
    // ──────────────────────────────────────────────────────────
    public function getMyAiMatches(Request $request)
    {
        $reports = FoundReport::where('user_id', $request->user()->id)
            ->where('approved', true)
            ->where('status', 'published')
            ->latest('created_at')
            ->get()
            ->map(function (FoundReport $report) {
                $query = $this->visibleMatchesQuery($report->id)
                    ->where('total_score', '>', self::USER_AI_MATCH_MIN_SCORE);
                $matchCount = (clone $query)->count();
                $topMatch = (clone $query)->first();

                return [
                    'id' => $report->id,
                    'name' => $report->name,
                    'approximate_age' => $report->approximate_age,
                    'district' => $report->district,
                    'photo_url' => $report->photo_url,
                    'found_date' => optional($report->found_date)->format('Y-m-d'),
                    'created_at' => optional($report->created_at)->format('Y-m-d H:i:s'),
                    'ai_match_count' => $matchCount,
                    'top_match_score' => $topMatch?->total_score,
                ];
            })
            ->filter(fn(array $item) => ($item['ai_match_count'] ?? 0) > 0)
            ->values();

        return response()->json([
            'success' => true,
            'reports' => $reports,
            'total' => $reports->count(),
        ]);
    }

    // ──────────────────────────────────────────────────────────
    // USER: Get AI match details for one of my approved found reports
    // GET /api/found-reports/my/{id}/ai-matches
    // ──────────────────────────────────────────────────────────
    public function getMyAiMatchDetails(Request $request, $id)
    {
        $report = FoundReport::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->where('approved', true)
            ->where('status', 'published')
            ->first();

        if (!$report) {
            return response()->json([
                'success' => false,
                'message' => 'Report not found or not approved yet',
            ], 404);
        }

        $matches = $this->visibleMatchesQuery($report->id)
            ->where('total_score', '>', self::USER_AI_MATCH_MIN_SCORE)
            ->limit(20)
            ->get()
            ->map(function ($match) {
                $mr = $match->missingReport;

                return [
                    'missing_report_id'   => $match->missing_report_id,
                    'missing_name'        => $mr?->name,
                    'missing_age'         => $mr?->age,
                    'missing_gender'      => $mr?->gender,
                    'missing_district'    => $mr?->district,
                    'missing_address'     => $mr?->address,
                    'missing_photo_url'   => $mr?->photo_url,
                    'missing_last_seen'   => optional($mr?->last_seen_date)?->format('Y-m-d'),
                    'contact_phone'       => $mr?->contact_phone,
                    'total_score'         => $match->total_score,
                    'name_score'          => $match->name_score,
                    'district_score'      => $match->district_score,
                    'location_score'      => $match->location_score,
                    'age_score'           => $match->age_score,
                    'gender_score'        => $match->gender_score,
                    'description_score'   => $match->description_score,
                    'match_level'         => $match->match_level,
                    'ai_reasoning'        => $match->ai_reasoning,
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'found_report' => $this->formatReport($report),
            'matches' => $matches,
            'total' => $matches->count(),
        ]);
    }

    // ──────────────────────────────────────────────────────────
    // ADMIN: Get pending found reports
    // GET /api/admin/found-reports/pending
    // ──────────────────────────────────────────────────────────
    public function getPending()
    {
        $reports = FoundReport::with('user')
            ->where('approved', false)
            ->where('status', 'pending')
            ->latest()
            ->limit(50)
            ->get()
            ->map(function ($report) {
                $data = $this->formatReport($report);
                $data['type'] = 'found_report';
                $data['title'] = 'উদ্ধার রিপোর্ট: ' . ($report->name ?? 'অজানা');
                $data['submittedBy'] = $report->user?->email ?? 'Unknown';
                $data['date'] = optional($report->created_at)->format('Y-m-d');
                $data['priority'] = 'high';
                $data['status'] = 'pending';
                $data['description'] = $report->physical_description ?: $report->additional_info ?: 'কোনো বিবরণ নেই';
                $data['division'] = $report->district;
                $data['age'] = $report->approximate_age;

                // Attach top 5 AI matches
                $data['ai_matches'] = $this->getTopMatches($report->id, 5);

                return $data;
            });

        return response()->json([
            'success' => true,
            'reports' => $reports,
        ]);
    }

    // ──────────────────────────────────────────────────────────
    // ADMIN: Get AI matches for a specific found report
    // GET /api/admin/found-reports/{id}/matches
    // ──────────────────────────────────────────────────────────
    public function getMatches($id)
    {
        try {
            $report = FoundReport::findOrFail($id);
            $matches = $this->getTopMatches($id, 20);

            return response()->json([
                'success'      => true,
                'found_report' => $this->formatReport($report),
                'matches'      => $matches,
                'total'        => count($matches),
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 404);
        }
    }

    // ──────────────────────────────────────────────────────────
    // ADMIN: Re-run AI matching manually
    // POST /api/admin/found-reports/{id}/rematch
    // ──────────────────────────────────────────────────────────
    public function rematch($id)
    {
        try {
            $report  = FoundReport::findOrFail($id);
            $matches = $this->matchingService->runMatchingForFoundReport($report);

            return response()->json([
                'success' => true,
                'message' => 'AI matching completed',
                'matches' => array_slice($matches, 0, 10),
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ──────────────────────────────────────────────────────────
    // ADMIN: Approve found report
    // PATCH /api/admin/found-reports/{id}/approve
    // ──────────────────────────────────────────────────────────
    public function approve($id)
    {
        try {
            $report = FoundReport::findOrFail($id);
            $report->update(['approved' => true, 'status' => 'published']);

            return response()->json([
                'success' => true,
                'message' => 'Found report approved and published',
                'report'  => ['id' => $report->id, 'status' => $report->status],
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ──────────────────────────────────────────────────────────
    // ADMIN: Reject found report
    // PATCH /api/admin/found-reports/{id}/reject
    // ──────────────────────────────────────────────────────────
    public function reject(Request $request, $id)
    {
        try {
            $validated = $request->validate(['reason' => 'required|string|max:500']);
            $report    = FoundReport::findOrFail($id);

            if ($report->cloudinary_public_id) {
                $this->cloudinaryService->deleteImage($report->cloudinary_public_id);
            }

            $report->update([
                'status'           => 'rejected',
                'rejection_reason' => $validated['reason'],
            ]);

            return response()->json(['success' => true, 'message' => 'Report rejected']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ──────────────────────────────────────────────────────────
    // PUBLIC: Get published found reports
    // GET /api/found-reports/published
    // ──────────────────────────────────────────────────────────
    public function getPublished(Request $request)
    {
        $query = FoundReport::where('approved', true)->where('status', 'published');

        if ($d = $request->query('district')) {
            $query->where('district', $d);
        }

        $paginator = $query->latest()->paginate(9);
        $items     = collect($paginator->items())->map(fn($r) => $this->formatReport($r));

        return response()->json([
            'success'      => true,
            'reports'      => $items,
            'total'        => $paginator->total(),
            'current_page' => $paginator->currentPage(),
            'last_page'    => $paginator->lastPage(),
        ]);
    }

    // PUBLIC: Get single published found report by id
    // GET /api/found-reports/published/{id}
    public function getPublishedById($id)
    {
        $report = FoundReport::where('id', $id)
            ->where('approved', true)
            ->where('status', 'published')
            ->first();

        if (!$report) {
            return response()->json([
                'success' => false,
                'message' => 'Report not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'report' => $this->formatReport($report),
        ]);
    }

    // ── Helpers ───────────────────────────────────────────────

    private function formatReport(FoundReport $r): array
    {
        return [
            'id'                   => $r->id,
            'name'                 => $r->name,
            'approximate_age'      => $r->approximate_age,
            'gender'               => $r->gender,
            'health_status'        => $r->health_status,
            'photo_url'            => $r->photo_url,
            'found_date'           => optional($r->found_date)->format('Y-m-d'),
            'found_time'           => $r->found_time,
            'district'             => $r->district,
            'address'              => $r->address,
            'physical_description' => $r->physical_description,
            'additional_info'      => $r->additional_info,
            'contact_person_name'  => $r->contact_person_name,
            'contact_phone'        => $r->contact_phone,
            'status'               => $r->status,
            'approved'             => $r->approved,
            'rejection_reason'     => $r->rejection_reason,
            'created_at'           => optional($r->created_at)->format('Y-m-d H:i:s'),
        ];
    }

    private function getTopMatches(int $foundReportId, int $limit = 5): array
    {
        return FoundMatch::where('found_report_id', $foundReportId)
            ->with('missingReport')
            ->orderByDesc('total_score')
            ->limit($limit)
            ->get()
            ->map(function ($match) {
                $mr = $match->missingReport;
                return [
                    'missing_report_id'   => $match->missing_report_id,
                    'missing_name'        => $mr?->name,
                    'missing_age'         => $mr?->age,
                    'missing_gender'      => $mr?->gender,
                    'missing_district'    => $mr?->district,
                    'missing_address'     => $mr?->address,
                    'missing_photo_url'   => $mr?->photo_url,
                    'missing_last_seen'   => optional($mr?->last_seen_date)?->format('Y-m-d'),
                    'contact_phone'       => $mr?->contact_phone,
                    'total_score'         => $match->total_score,
                    'name_score'          => $match->name_score,
                    'district_score'      => $match->district_score,
                    'location_score'      => $match->location_score,
                    'age_score'           => $match->age_score,
                    'gender_score'        => $match->gender_score,
                    'description_score'   => $match->description_score,
                    'match_level'         => $match->match_level,
                    'ai_reasoning'        => $match->ai_reasoning,
                ];
            })
            ->toArray();
    }

    private function visibleMatchesQuery(int $foundReportId)
    {
        return FoundMatch::where('found_report_id', $foundReportId)
            ->whereHas('missingReport', function ($query) {
                $query->where('approved', true)
                    ->where('status', 'published');
            })
            ->with('missingReport')
            ->orderByDesc('total_score');
    }
}

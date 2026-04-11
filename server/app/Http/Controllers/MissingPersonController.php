<?php

namespace App\Http\Controllers;

use App\Models\MissingReport;
use App\Models\FoundReport;
use App\Models\User;
use App\Services\CloudinaryService;
use App\Services\GioSmsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class MissingPersonController extends Controller
{
    protected $cloudinaryService;
    protected $smsService;

    public function __construct(CloudinaryService $cloudinaryService, GioSmsService $smsService)
    {
        $this->cloudinaryService = $cloudinaryService;
        $this->smsService        = $smsService;
    }

    /**
     * Submit a new missing person report
     *
     * POST /api/missing-reports
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name'                 => 'required|string|max:255',
                'age'                  => 'nullable|integer|min:0|max:150',
                'gender'               => 'nullable|string|in:male,female,other',
                'height'               => 'nullable|string|max:100',
                'last_seen_date'       => 'nullable|date',
                'last_seen_time'       => 'nullable|date_format:H:i',
                'district'             => 'required|string|max:100',
                'address'              => 'nullable|string|max:500',
                'clothing_description' => 'nullable|string|max:500',
                'additional_info'      => 'nullable|string|max:1000',
                'contact_person_name'  => 'required|string|max:255',
                'contact_phone'        => 'required|string|max:20',
                'photo'                => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
            ]);

            $photoUrl = null;
            $publicId = null;

            if ($request->hasFile('photo')) {
                $uploadResult = $this->cloudinaryService->uploadImage(
                    $request->file('photo'),
                    'aponkhoj/missing-reports'
                );

                if (!$uploadResult['success']) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Photo upload failed: ' . $uploadResult['message'],
                    ], 400);
                }

                $photoUrl = $uploadResult['url'];
                $publicId = $uploadResult['public_id'];
            }

            $report = MissingReport::create([
                'user_id'              => Auth::id(),
                'name'                 => $validated['name'],
                'age'                  => $validated['age'] ?? null,
                'gender'               => $validated['gender'] ?? null,
                'height'               => $validated['height'] ?? null,
                'last_seen_date'       => $validated['last_seen_date'] ?? null,
                'last_seen_time'       => $validated['last_seen_time'] ?? null,
                'district'             => $validated['district'],
                'address'              => $validated['address'] ?? null,
                'clothing_description' => $validated['clothing_description'] ?? null,
                'additional_info'      => $validated['additional_info'] ?? null,
                'contact_person_name'  => $validated['contact_person_name'],
                'contact_phone'        => $validated['contact_phone'],
                'photo_url'            => $photoUrl,
                'cloudinary_public_id' => $publicId,
                'status'               => 'pending',
                'approved'             => false,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Report submitted successfully. It will be reviewed by our team.',
                'report'  => [
                    'id'       => $report->id,
                    'status'   => $report->status,
                    'approved' => $report->approved,
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
                'message' => 'An error occurred while submitting the report: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get published (approved) missing reports
     *
     * GET /api/missing-reports/published
     */
    public function getPublished(Request $request)
    {
        try {
            $query = MissingReport::where('approved', true)
                ->where('status', 'published');

            $district = $request->query('district');
            if ($district && $district !== 'all') {
                $query->where('district', $district);
            }

            $ageMin = $request->query('age_min');
            $ageMax = $request->query('age_max');
            if (is_numeric($ageMin) && (int)$ageMin > 0) {
                $query->where(function ($q) use ($ageMin) {
                    $q->whereNull('age')->orWhere('age', '>=', (int)$ageMin);
                });
            }
            if (is_numeric($ageMax) && (int)$ageMax < 100) {
                $query->where(function ($q) use ($ageMax) {
                    $q->whereNull('age')->orWhere('age', '<=', (int)$ageMax);
                });
            }

            $gender = $request->query('gender');
            if ($gender && in_array($gender, ['male', 'female', 'other'])) {
                $query->where('gender', $gender);
            }

            $search = trim($request->query('search', ''));
            if ($search !== '') {
                $query->where('name', 'like', '%' . $search . '%');
            }

            $sort = $request->query('sort', 'newest');
            match ($sort) {
                'oldest'   => $query->oldest('created_at'),
                'age_asc'  => $query->orderByRaw('ISNULL(age), age ASC'),
                'age_desc' => $query->orderByRaw('ISNULL(age), age DESC'),
                default    => $query->latest('created_at'),
            };

            $perPage   = min((int)($request->query('per_page', 9)), 50);
            $paginator = $query->paginate($perPage);

            $items = collect($paginator->items())->map(function ($report) {
                return [
                    'id'                   => $report->id,
                    'name'                 => $report->name,
                    'age'                  => $report->age,
                    'gender'               => $report->gender,
                    'height'               => $report->height,
                    'photo_url'            => $report->photo_url,
                    'last_seen_date'       => optional($report->last_seen_date)->format('Y-m-d'),
                    'last_seen_time'       => $report->last_seen_time,
                    'district'             => $report->district,
                    'address'              => $report->address,
                    'clothing_description' => $report->clothing_description,
                    'additional_info'      => $report->additional_info,
                    'contact_person_name'  => $report->contact_person_name,
                    'contact_phone'        => $report->contact_phone,
                    'created_at'           => optional($report->created_at)->format('Y-m-d'),
                ];
            });

            return response()->json([
                'success'      => true,
                'reports'      => $items,
                'total'        => $paginator->total(),
                'per_page'     => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'count'        => $items->count(),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching reports: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a single published missing report by id
     *
     * GET /api/missing-reports/published/{id}
     */
    public function getPublishedById($id)
    {
        try {
            $report = MissingReport::where('id', $id)
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
                'report'  => [
                    'id'                   => $report->id,
                    'name'                 => $report->name,
                    'age'                  => $report->age,
                    'gender'               => $report->gender,
                    'height'               => $report->height,
                    'photo_url'            => $report->photo_url,
                    'last_seen_date'       => optional($report->last_seen_date)->format('Y-m-d'),
                    'last_seen_time'       => $report->last_seen_time,
                    'district'             => $report->district,
                    'address'              => $report->address,
                    'clothing_description' => $report->clothing_description,
                    'additional_info'      => $report->additional_info,
                    'contact_person_name'  => $report->contact_person_name,
                    'contact_phone'        => $report->contact_phone,
                    'created_at'           => optional($report->created_at)->format('Y-m-d H:i:s'),
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching report details: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get public missing report stats
     *
     * GET /api/missing-reports/stats
     */
    public function getPublicStats()
    {
        try {
            $totalSubmitted = MissingReport::count() + FoundReport::count();

            return response()->json([
                'success'         => true,
                'total_submitted' => $totalSubmitted,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching report stats: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get authenticated user's submitted missing reports
     *
     * GET /api/missing-reports/my
     */
    public function getMyReports(Request $request)
    {
        try {
            $reports = MissingReport::where('user_id', $request->user()->id)
                ->latest('created_at')
                ->get()
                ->map(function ($report) {
                    return [
                        'id'                   => $report->id,
                        'name'                 => $report->name,
                        'age'                  => $report->age,
                        'gender'               => $report->gender,
                        'height'               => $report->height,
                        'status'               => $report->status,
                        'approved'             => $report->approved,
                        'photo_url'            => $report->photo_url,
                        'last_seen_date'       => optional($report->last_seen_date)->format('Y-m-d'),
                        'last_seen_time'       => $report->last_seen_time,
                        'district'             => $report->district,
                        'address'              => $report->address,
                        'clothing_description' => $report->clothing_description,
                        'additional_info'      => $report->additional_info,
                        'contact_person_name'  => $report->contact_person_name,
                        'contact_phone'        => $report->contact_phone,
                        'rejection_reason'     => $report->rejection_reason,
                        'created_at'           => optional($report->created_at)->format('Y-m-d H:i:s'),
                    ];
                });

            return response()->json([
                'success' => true,
                'count'   => $reports->count(),
                'reports' => $reports,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching your reports: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get pending reports for admin review
     *
     * GET /api/admin/missing-reports/pending
     */
    public function getPending()
    {
        try {
            $reports = MissingReport::where('approved', false)
                ->where('status', 'pending')
                ->latest('created_at')
                ->limit(50)
                ->get()
                ->map(function ($report) {
                    return [
                        'id'                   => $report->id,
                        'type'                 => 'missing_report',
                        'title'                => 'Missing Report: ' . $report->name,
                        'submittedBy'          => $report->user->email ?? 'Unknown',
                        'date'                 => optional($report->created_at)->format('Y-m-d'),
                        'priority'             => 'high',
                        'status'               => 'pending',
                        'description'          => $report->additional_info,
                        'district'             => $report->district,
                        'age'                  => $report->age,
                        'gender'               => $report->gender,
                        'height'               => $report->height,
                        'photo_url'            => $report->photo_url,
                        'clothing_description' => $report->clothing_description,
                        'contact_person_name'  => $report->contact_person_name,
                        'contact_phone'        => $report->contact_phone,
                        'last_seen_date'       => optional($report->last_seen_date)->format('Y-m-d'),
                        'address'              => $report->address,
                    ];
                });

            return response()->json($reports, 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching pending reports: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Approve a missing person report (admin only).
     * After approving, sends an SMS alert to all users in the same district
     * who have a phone number stored on their profile.
     *
     * PATCH /api/admin/missing-reports/{id}/approve
     */
    public function approve($id)
    {
        try {
            $report = MissingReport::findOrFail($id);

            $report->update([
                'approved' => true,
                'status'   => 'published',
            ]);

            // ── SMS Alert ────────────────────────────────────────────────────
            $this->sendDistrictSmsAlert($report);
            // ────────────────────────────────────────────────────────────────

            return response()->json([
                'success' => true,
                'message' => 'Report approved and published',
                'report'  => [
                    'id'       => $report->id,
                    'status'   => $report->status,
                    'approved' => $report->approved,
                ],
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Report not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error approving report: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reject a missing person report (admin only)
     *
     * PATCH /api/admin/missing-reports/{id}/reject
     */
    public function reject(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'reason' => 'required|string|max:500',
            ]);

            $report = MissingReport::findOrFail($id);

            if ($report->cloudinary_public_id) {
                $this->cloudinaryService->deleteImage($report->cloudinary_public_id);
            }

            $report->update([
                'status'           => 'rejected',
                'rejection_reason' => $validated['reason'],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Report rejected',
                'report'  => [
                    'id'     => $report->id,
                    'status' => $report->status,
                ],
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Report not found',
            ], 404);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error rejecting report: ' . $e->getMessage(),
            ], 500);
        }
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    /**
     * Find all users in the same district who have a phone number,
     * build the Bengali alert message, and dispatch a bulk SMS.
     *
     * The reporter themselves is excluded (they already know about the report).
     * Users without a phone number on their profile are silently skipped.
     */
    private function sendDistrictSmsAlert(MissingReport $report): void
    {
        try {
            $district = $report->district;

            // Fetch phone numbers of users in the same district
            // Case-insensitive comparison so "Dhaka" and "dhaka" both match.
            $phones = User::whereRaw('LOWER(district) = ?', [strtolower($district)])
                ->where('id', '!=', $report->user_id)   // exclude the reporter
                ->whereNotNull('phone')
                ->where('phone', '!=', '')
                ->pluck('phone')
                ->map(fn($p) => $this->normalizePhone($p))
                ->filter()                               // remove nulls from normalization failures
                ->unique()
                ->values()
                ->toArray();

            // Keep poster excluded even when using fallback contact phone.
            $reporterPhoneRaw = User::where('id', $report->user_id)->value('phone');
            $reporterPhone = $reporterPhoneRaw ? $this->normalizePhone((string) $reporterPhoneRaw) : null;

            // Include report contact phone as fallback only if it's not the poster's number.
            $contactPhone = $this->normalizePhone((string) $report->contact_phone);
            if ($contactPhone && $contactPhone !== $reporterPhone) {
                $phones[] = $contactPhone;
                $phones = array_values(array_unique($phones));
            }

            if (empty($phones)) {
                Log::info("[GioSMS] No users with phone numbers found in district: {$district}");
                return;
            }

            $message = GioSmsService::buildMissingReportMessage(
                $report->name,
                $report->address ?? $district,
                $report->contact_phone
            );

            // Single recipient → single SMS; multiple → bulk
            if (count($phones) === 1) {
                $result = $this->smsService->sendSingle($phones[0], $message, 'transactional');
            } else {
                $result = $this->smsService->sendBulk($phones, $message, 'transactional');
            }

            if (!$result['success']) {
                Log::error('[GioSMS] District SMS alert failed', [
                    'report_id' => $report->id,
                    'district'  => $district,
                    'error'     => $result['error'],
                ]);
            } else {
                Log::info('[GioSMS] District SMS alert dispatched', [
                    'report_id'  => $report->id,
                    'district'   => $district,
                    'recipients' => count($phones),
                ]);
            }

        } catch (\Throwable $e) {
            // SMS failure must NEVER break the approve flow — log and move on.
            Log::error('[GioSMS] Unexpected error in district SMS alert', [
                'report_id' => $report->id,
                'error'     => $e->getMessage(),
            ]);
        }
    }

    /**
     * Normalize a Bangladeshi phone number to the format GioSMS expects:
     * 880XXXXXXXXXX (13 digits, no leading +).
     *
     * Accepts common formats:
     *   - 01XXXXXXXXX   (11 digits, local)
     *   - 8801XXXXXXXXX (13 digits, with country code)
     *   - +8801XXXXXXXX (with + prefix)
     *
     * Returns null if the number cannot be normalized.
     */
    private function normalizePhone(string $phone): ?string
    {
        // Strip all non-numeric characters
        $digits = preg_replace('/\D/', '', $phone);

        // Already 13 digits starting with 880
        if (strlen($digits) === 13 && str_starts_with($digits, '880')) {
            return $digits;
        }

        // 11 digits starting with 01 → prepend 88
        if (strlen($digits) === 11 && str_starts_with($digits, '01')) {
            return '88' . $digits;
        }

        // 10 digits starting with 1 → prepend 880
        if (strlen($digits) === 10 && str_starts_with($digits, '1')) {
            return '880' . $digits;
        }

        Log::warning('[GioSMS] Could not normalize phone number', ['raw' => $phone]);
        return null;
    }
}

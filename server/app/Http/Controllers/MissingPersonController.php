<?php

namespace App\Http\Controllers;

use App\Models\MissingReport;
use App\Services\CloudinaryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class MissingPersonController extends Controller
{
    protected $cloudinaryService;

    public function __construct(CloudinaryService $cloudinaryService)
    {
        $this->cloudinaryService = $cloudinaryService;
    }

    /**
     * Submit a new missing person report
     * 
     * POST /api/missing-reports
     */
    public function store(Request $request)
    {
        try {
            // Validate input
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'age' => 'nullable|integer|min:0|max:150',
                'gender' => 'nullable|string|in:male,female,other',
                'height' => 'nullable|string|max:100',
                'last_seen_date' => 'nullable|date',
                'last_seen_time' => 'nullable|date_format:H:i',
                'district' => 'required|string|max:100',
                'address' => 'nullable|string|max:500',
                'clothing_description' => 'nullable|string|max:500',
                'additional_info' => 'nullable|string|max:1000',
                'contact_person_name' => 'required|string|max:255',
                'contact_phone' => 'required|string|max:20',
                'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
            ]);

            $photoUrl = null;
            $publicId = null;

            // Upload photo if provided
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

            // Create the missing report
            $report = MissingReport::create([
                'user_id' => Auth::id(),
                'name' => $validated['name'],
                'age' => $validated['age'] ?? null,
                'gender' => $validated['gender'] ?? null,
                'height' => $validated['height'] ?? null,
                'last_seen_date' => $validated['last_seen_date'] ?? null,
                'last_seen_time' => $validated['last_seen_time'] ?? null,
                'district' => $validated['district'],
                'address' => $validated['address'] ?? null,
                'clothing_description' => $validated['clothing_description'] ?? null,
                'additional_info' => $validated['additional_info'] ?? null,
                'contact_person_name' => $validated['contact_person_name'],
                'contact_phone' => $validated['contact_phone'],
                'photo_url' => $photoUrl,
                'cloudinary_public_id' => $publicId,
                'status' => 'pending',
                'approved' => false,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Report submitted successfully. It will be reviewed by our team.',
                'report' => [
                    'id' => $report->id,
                    'status' => $report->status,
                    'approved' => $report->approved,
                ],
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while submitting the report: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all approved/published missing person reports
     * 
     * GET /api/missing-reports/published
     */
    public function getPublished()
    {
        try {
            $reports = MissingReport::where('approved', true)
                ->where('status', 'published')
                ->latest('created_at')
                ->get()
                ->map(function ($report) {
                    return [
                        'id' => $report->id,
                        'name' => $report->name,
                        'age' => $report->age,
                        'gender' => $report->gender,
                        'height' => $report->height,
                        'photo_url' => $report->photo_url,
                        'last_seen_date' => optional($report->last_seen_date)->format('Y-m-d'),
                        'last_seen_time' => $report->last_seen_time,
                        'district' => $report->district,
                        'address' => $report->address,
                        'clothing_description' => $report->clothing_description,
                        'additional_info' => $report->additional_info,
                        'contact_person_name' => $report->contact_person_name,
                        'contact_phone' => $report->contact_phone,
                        'created_at' => optional($report->created_at)->format('Y-m-d'),
                    ];
                });

            return response()->json([
                'success' => true,
                'count' => count($reports),
                'reports' => $reports,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching reports: ' . $e->getMessage(),
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
                        'id' => $report->id,
                        'type' => 'missing_report',
                        'title' => 'Missing Report: ' . $report->name,
                        'submittedBy' => $report->user->email ?? 'Unknown',
                        'date' => optional($report->created_at)->format('Y-m-d'),
                        'priority' => 'high',
                        'status' => 'pending',
                        'description' => $report->additional_info,
                        'district' => $report->district,
                        'age' => $report->age,
                        'gender' => $report->gender,
                        'height' => $report->height,
                        'photo_url' => $report->photo_url,
                        'clothing_description' => $report->clothing_description,
                        'contact_person_name' => $report->contact_person_name,
                        'contact_phone' => $report->contact_phone,
                        'last_seen_date' => optional($report->last_seen_date)->format('Y-m-d'),
                        'address' => $report->address,
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
     * Approve a missing person report (admin only)
     * 
     * PATCH /api/admin/missing-reports/{id}/approve
     */
    public function approve($id)
    {
        try {
            $report = MissingReport::findOrFail($id);

            $report->update([
                'approved' => true,
                'status' => 'published',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Report approved and published',
                'report' => [
                    'id' => $report->id,
                    'status' => $report->status,
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

            // Delete image from Cloudinary if it exists
            if ($report->cloudinary_public_id) {
                $this->cloudinaryService->deleteImage($report->cloudinary_public_id);
            }

            $report->update([
                'status' => 'rejected',
                'rejection_reason' => $validated['reason'],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Report rejected',
                'report' => [
                    'id' => $report->id,
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
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error rejecting report: ' . $e->getMessage(),
            ], 500);
        }
    }
}

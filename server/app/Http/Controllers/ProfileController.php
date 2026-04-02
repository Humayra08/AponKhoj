<?php

namespace App\Http\Controllers;

use App\Services\CloudinaryService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Models\MissingReport;

class ProfileController extends Controller
{
    protected $cloudinaryService;

    public function __construct(CloudinaryService $cloudinaryService)
    {
        $this->cloudinaryService = $cloudinaryService;
    }

    public function show(Request $request)
    {
        return response()->json($request->user());
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|required|string|between:2,100',
            'email' => [
                'sometimes',
                'required',
                'string',
                'email',
                'max:100',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'phone' => 'sometimes|nullable|string|max:20',
            'district' => 'sometimes|nullable|string|max:100',
            'avatar' => 'sometimes|nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'image' => 'sometimes|nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        if ($request->hasFile('avatar') || $request->hasFile('image')) {
            $avatarFile = $request->file('image') ?: $request->file('avatar');

            $uploadResult = $this->cloudinaryService->uploadImage(
                $avatarFile,
                'aponkhoj/users/avatars'
            );

            if (!$uploadResult['success']) {
                return response()->json([
                    'message' => 'Avatar upload failed: ' . $uploadResult['message'],
                ], 400);
            }

            if ($user->avatar_public_id) {
                $this->cloudinaryService->deleteImage($user->avatar_public_id);
            }

            $validated['avatar_url'] = $uploadResult['url'];
            $validated['avatar_public_id'] = $uploadResult['public_id'];
        }

        $user->fill($validated);
        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $user->fresh(),
        ]);
    }

    public function uploadAvatar(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'image' => 'required_without:avatar|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'avatar' => 'sometimes|nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        $imageFile = $validated['image'] ?? ($validated['avatar'] ?? null);

        if (!$imageFile) {
            return response()->json([
                'success' => false,
                'message' => 'No image file provided.',
            ], 422);
        }

        $uploadResult = $this->cloudinaryService->uploadImage(
            $imageFile,
            'aponkhoj/users/avatars'
        );

        if (!$uploadResult['success']) {
            return response()->json([
                'success' => false,
                'message' => 'Avatar upload failed: ' . $uploadResult['message'],
            ], 400);
        }

        if ($user->avatar_public_id) {
            $this->cloudinaryService->deleteImage($user->avatar_public_id);
        }

        $user->avatar_url = $uploadResult['url'];
        $user->avatar_public_id = $uploadResult['public_id'];
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Avatar uploaded successfully.',
            'image_url' => $user->avatar_url,
            'public_id' => $user->avatar_public_id,
            'user' => $user->fresh(),
        ]);
    }

    public function stats(Request $request)
    {
        $user = $request->user();

        $totalReports = MissingReport::where('user_id', $user->id)->count();
        $pendingReports = MissingReport::where('user_id', $user->id)
            ->where('status', 'pending')
            ->where('approved', false)
            ->count();
        $approvedReports = MissingReport::where('user_id', $user->id)
            ->where('status', 'published')
            ->where('approved', true)
            ->count();
        $rejectedReports = MissingReport::where('user_id', $user->id)
            ->where('status', 'rejected')
            ->count();

        return response()->json([
            'totalReports' => $totalReports,
            'pendingReports' => $pendingReports,
            'approvedReports' => $approvedReports,
            'rejectedReports' => $rejectedReports,
        ]);
    }
}

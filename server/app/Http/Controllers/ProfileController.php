<?php

namespace App\Http\Controllers;

use App\Services\CloudinaryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use App\Models\MissingReport;
use App\Models\FoundReport;

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
            'current_password' => 'sometimes|required_with:password|string',
            'password' => 'sometimes|required_with:current_password|string|min:8|confirmed|different:current_password',
            'password_confirmation' => 'sometimes|required_with:password|string|min:8',
            'avatar' => 'sometimes|nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
            'image' => 'sometimes|nullable|image|mimes:jpeg,png,jpg,gif,webp|max:5120',
        ]);

        if (isset($validated['password']) && !Hash::check($validated['current_password'] ?? '', $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect.',
            ], 422);
        }

        $newPassword = $validated['password'] ?? null;
        unset($validated['current_password'], $validated['password'], $validated['password_confirmation']);

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

        if ($newPassword !== null) {
            $user->password = Hash::make($newPassword);
        }

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

        $missingTotal = MissingReport::where('user_id', $user->id)->count();
        $foundTotal = FoundReport::where('user_id', $user->id)->count();
        $totalReports = $missingTotal + $foundTotal;

        $missingPending = MissingReport::where('user_id', $user->id)
            ->where('status', 'pending')
            ->where('approved', false)
            ->count();

        $foundPending = FoundReport::where('user_id', $user->id)
            ->where('status', 'pending')
            ->where('approved', false)
            ->count();

        $pendingReports = $missingPending + $foundPending;

        $missingApproved = MissingReport::where('user_id', $user->id)
            ->where('status', 'published')
            ->where('approved', true)
            ->count();

        $foundApproved = FoundReport::where('user_id', $user->id)
            ->where('status', 'published')
            ->where('approved', true)
            ->count();

        $approvedReports = $missingApproved + $foundApproved;

        $missingRejected = MissingReport::where('user_id', $user->id)
            ->where('status', 'rejected')
            ->count();

        $foundRejected = FoundReport::where('user_id', $user->id)
            ->where('status', 'rejected')
            ->count();

        $rejectedReports = $missingRejected + $foundRejected;

        return response()->json([
            'totalReports' => $totalReports,
            'pendingReports' => $pendingReports,
            'approvedReports' => $approvedReports,
            'rejectedReports' => $rejectedReports,
        ]);
    }
}

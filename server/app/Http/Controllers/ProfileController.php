<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Models\MissingReport;

class ProfileController extends Controller
{
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
        ]);

        $user->fill($validated);
        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully.',
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

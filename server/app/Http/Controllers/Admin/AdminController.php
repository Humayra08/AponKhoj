<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\VerificationCode;
use Illuminate\Support\Carbon;

class AdminController extends Controller
{
    public function stats()
    {
        $totalReports = VerificationCode::count();
        $closedReports = VerificationCode::where('verified', true)->count();
        $activeMissing = max($totalReports - $closedReports, 0);
        $users = User::count();
        $newUsersWeek = User::where('created_at', '>=', now()->subDays(7))->count();
        $successRate = $totalReports > 0 ? round(($closedReports / $totalReports) * 100, 1) : 0;

        $monthlyData = $this->monthlyReportSeries();
        $statusData = $this->statusDistribution($totalReports, $closedReports, $activeMissing);
        $divisions = $this->divisionDistribution();
        $recentUsers = $this->recentUsers();
        $activity = $this->activityFeed();

        return response()->json([
            'stats' => [
                'totalReports' => $totalReports,
                'activeMissing' => $activeMissing,
                'reunions' => $closedReports,
                'users' => $users,
                'newUsersWeek' => $newUsersWeek,
                'successRate' => $successRate,
            ],
            'monthlyData' => $monthlyData,
            'statusData' => $statusData,
            'divisions' => $divisions,
            'recentUsers' => $recentUsers,
            'activity' => $activity,
        ]);
    }

    public function recentReports()
    {
        $reports = VerificationCode::query()
            ->latest('created_at')
            ->limit(10)
            ->get()
            ->map(function ($record) {
                return [
                    'id' => $record->id,
                    'name' => $record->email,
                    'age' => '—',
                    'division' => 'N/A',
                    'status' => $record->verified ? 'closed' : 'pending',
                    'date' => optional($record->created_at)->format('Y-m-d'),
                ];
            })
            ->values();

        return response()->json($reports);
    }

    public function moderationStats()
    {
        $pendingReviews = VerificationCode::where('verified', false)->count();

        return response()->json([
            'pendingReviews' => $pendingReviews,
            'highPriority' => 0,
            'resolvedToday' => VerificationCode::where('verified', true)
                ->whereDate('updated_at', now()->toDateString())
                ->count(),
            'avgResponseTime' => 'N/A',
        ]);
    }

    public function moderationReports()
    {
        $items = VerificationCode::query()
            ->where('verified', false)
            ->latest('created_at')
            ->limit(25)
            ->get()
            ->map(function ($record) {
                return [
                    'id' => $record->id,
                    'type' => 'report',
                    'title' => 'Verification pending for ' . $record->email,
                    'submittedBy' => $record->email,
                    'date' => optional($record->created_at)->format('Y-m-d'),
                    'priority' => 'medium',
                    'status' => 'pending',
                    'description' => 'Email verification code is pending confirmation.',
                    'division' => null,
                    'age' => null,
                    'reason' => null,
                    'notes' => null,
                ];
            })
            ->values();

        return response()->json($items);
    }

    public function moderationFlaggedUsers()
    {
        return response()->json([]);
    }

    public function moderationAppeals()
    {
        return response()->json([]);
    }

    private function monthlyReportSeries()
    {
        $start = Carbon::now()->startOfMonth()->subMonths(5);
        $rows = VerificationCode::query()
            ->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month_key, COUNT(*) as total')
            ->where('created_at', '>=', $start)
            ->groupBy('month_key')
            ->pluck('total', 'month_key');

        $series = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->startOfMonth()->subMonths($i);
            $key = $date->format('Y-m');
            $series[] = [
                'label' => $date->format('M'),
                'value' => (int) ($rows[$key] ?? 0),
            ];
        }

        return $series;
    }

    private function statusDistribution($totalReports, $closedReports, $activeMissing)
    {
        $matched = 0;
        $verified = 0;
        $pending = max($activeMissing, 0);

        $segments = [
            ['label' => 'Pending', 'value' => $pending, 'color' => '#f59e0b'],
            ['label' => 'Verified', 'value' => $verified, 'color' => '#3b82f6'],
            ['label' => 'Matched', 'value' => $matched, 'color' => '#8b5cf6'],
            ['label' => 'Closed', 'value' => $closedReports, 'color' => '#10b981'],
        ];

        return array_map(function ($item) use ($totalReports) {
            $item['pct'] = $totalReports > 0 ? round(($item['value'] / $totalReports) * 100) : 0;
            return $item;
        }, $segments);
    }

    private function divisionDistribution()
    {
        $rows = User::query()
            ->selectRaw('COALESCE(NULLIF(TRIM(district), ""), "Unknown") as name, COUNT(*) as count')
            ->groupBy('name')
            ->orderByDesc('count')
            ->limit(8)
            ->get();

        $max = (int) ($rows->max('count') ?? 0);

        return $rows->map(function ($row) use ($max) {
            return [
                'name' => $row->name,
                'count' => (int) $row->count,
                'max' => $max,
            ];
        })->values();
    }

    private function recentUsers()
    {
        return User::query()
            ->latest('created_at')
            ->limit(6)
            ->get()
            ->map(function ($user) {
                return [
                    'name' => $user->name,
                    'email' => $user->email,
                    'joined' => optional($user->created_at)->diffForHumans(),
                ];
            })
            ->values();
    }

    private function activityFeed()
    {
        $verificationEvents = VerificationCode::query()
            ->latest('updated_at')
            ->limit(5)
            ->get()
            ->map(function ($record) {
                return [
                    'text' => $record->verified
                        ? 'Verification completed for ' . $record->email
                        : 'Verification pending for ' . $record->email,
                    'time' => optional($record->updated_at)->diffForHumans(),
                    'type' => $record->verified ? 'verify' : 'system',
                    'ts' => optional($record->updated_at)->timestamp ?? 0,
                ];
            });

        $userEvents = User::query()
            ->latest('created_at')
            ->limit(3)
            ->get()
            ->map(function ($user) {
                return [
                    'text' => 'New user registered: ' . $user->email,
                    'time' => optional($user->created_at)->diffForHumans(),
                    'type' => 'user',
                    'ts' => optional($user->created_at)->timestamp ?? 0,
                ];
            });

        return $verificationEvents
            ->concat($userEvents)
            ->sortByDesc('ts')
            ->take(8)
            ->map(function ($item) {
                unset($item['ts']);
                return $item;
            })
            ->values();
    }
}

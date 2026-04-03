<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\MissingReport;
use App\Models\VerificationCode;
use Illuminate\Support\Carbon;

class AdminController extends Controller
{
    public function stats()
    {
        // Total reports = all approved/published reports (visible to public)
        $totalReports = MissingReport::where('approved', 1)->count();
        
        // Active Missing = approved reports where person is STILL missing (not found/closed)
        $activeMissing = MissingReport::where('approved', 1)
                                      ->where('status', '!=', 'found')
                                      ->where('status', '!=', 'closed')
                                      ->count();
        
        $users = User::count();
        $newUsersWeek = User::where('created_at', '>=', now()->subDays(7))->count();
        
        // Success rate = (Found/Closed) / Total published
        $successRate = $totalReports > 0 ? round((($totalReports - $activeMissing) / $totalReports) * 100, 1) : 0;

        $monthlyData = $this->monthlyReportSeries();
        $statusData = $this->statusDistribution($totalReports, $activeMissing);
        $divisions = $this->divisionDistribution();
        $recentUsers = $this->recentUsers();
        $activity = $this->activityFeed();

        return response()->json([
            'stats' => [
                'totalReports' => $totalReports,
                'activeMissing' => $activeMissing,
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
        $reports = MissingReport::query()
            ->with('user')
            ->latest('created_at')
            ->limit(10)
            ->get()
            ->map(function ($record) {
                return [
                    'id' => $record->id,
                    'name' => $record->name,
                    'age' => $record->age ?? '—',
                    'division' => $record->district ?? 'N/A',
                    'status' => $record->approved ? 'approved' : 'pending',
                    'date' => optional($record->created_at)->format('Y-m-d'),
                ];
            })
            ->values();

        return response()->json($reports);
    }

    public function moderationStats()
    {
        $pendingReviews = MissingReport::where('approved', 0)->count();

        return response()->json([
            'pendingReviews' => $pendingReviews,
            'highPriority' => 0,
            'resolvedToday' => MissingReport::where('approved', 1)
                ->whereDate('updated_at', now()->toDateString())
                ->count(),
            'avgResponseTime' => 'N/A',
        ]);
    }

    public function moderationReports()
    {
        $items = MissingReport::query()
            ->where('approved', 0)
            ->latest('created_at')
            ->limit(25)
            ->get()
            ->map(function ($record) {
                return [
                    'id' => $record->id,
                    'type' => 'report',
                    'title' => 'Missing: ' . $record->name,
                    'submittedBy' => $record->contact_person_name,
                    'date' => optional($record->created_at)->format('Y-m-d'),
                    'priority' => 'medium',
                    'status' => 'pending',
                    'description' => $record->additional_info,
                    'division' => $record->district,
                    'age' => $record->age,
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
        $rows = MissingReport::query()
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

    private function statusDistribution($totalReports, $activeMissing)
    {
        $resolved = max($totalReports - $activeMissing, 0);
        $pending = $activeMissing;

        $segments = [
            ['label' => 'Pending', 'value' => $pending, 'color' => '#f59e0b'],
            ['label' => 'Resolved', 'value' => $resolved, 'color' => '#10b981'],
        ];

        $total = array_sum(array_column($segments, 'value'));

        return array_map(function ($item) use ($total) {
            $item['pct'] = $total > 0 ? round(($item['value'] / $total) * 100, 1) : 0;
            return $item;
        }, $segments);
    }

    private function divisionDistribution()
    {
        $rows = MissingReport::query()
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
        $reportEvents = MissingReport::query()
            ->latest('updated_at')
            ->limit(5)
            ->get()
            ->map(function ($record) {
                return [
                    'text' => $record->approved
                        ? 'Report approved for ' . $record->name
                        : 'New report pending for ' . $record->name,
                    'time' => optional($record->updated_at)->diffForHumans(),
                    'type' => $record->approved ? 'verify' : 'system',
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

        return $reportEvents
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
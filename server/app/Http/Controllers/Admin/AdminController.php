<?php
namespace App\Http\Controllers\Admin;
use App\Http\Controllers\Controller;
use App\Models\FoundReport;
use App\Models\User;
use App\Models\MissingReport;
use App\Models\VerificationCode;
use Illuminate\Support\Carbon;

class AdminController extends Controller
{
    public function stats()
    {
        $missingTotal = MissingReport::count();
        $foundTotal = FoundReport::count();

        // Total reports includes both missing and found reports.
        $totalReports = $missingTotal + $foundTotal;
        
        // Pending across both report types.
        $activeMissing = MissingReport::where('approved', 0)
                                      ->where('status', '!=', 'found')
                                      ->where('status', '!=', 'closed')
                                      ->count()
                        + FoundReport::where('approved', 0)
                                      ->where('status', '!=', 'found')
                                      ->where('status', '!=', 'closed')
                                      ->count();
        
        $users = User::count();
        $newUsersWeek = User::where('created_at', '>=', now()->subDays(7))->count();
        
        // Success rate = (Found/Closed) / Total published
        $successRate = $totalReports > 0 ? round((($totalReports - $activeMissing) / $totalReports) * 100, 1) : 0;

        $monthlyData = $this->monthlyReportSeries();
        $statusData = $this->statusDistribution($totalReports);
        $divisions = $this->divisionDistribution();
        $recentUsers = $this->recentUsers();
        $activity = $this->activityFeed();

        return response()->json([
            'stats' => [
                'totalReports' => $totalReports,
                'activeMissing' => $activeMissing,
                'missingReports' => $missingTotal,
                'foundReports' => $foundTotal,
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
        $missingReports = MissingReport::query()
            ->with('user')
            ->latest('created_at')
            ->limit(20)
            ->get()
            ->map(function ($record) {
                return [
                    'id' => $record->id,
                    'type' => 'missing',
                    'name' => $record->name,
                    'age' => $record->age ?? '—',
                    'division' => $record->district ?? 'N/A',
                    'status' => $record->status ?: ($record->approved ? 'verified' : 'pending'),
                    'date' => optional($record->created_at)->format('Y-m-d'),
                    'created_at' => optional($record->created_at)?->timestamp ?? 0,
                ];
            });

        $foundReports = FoundReport::query()
            ->with('user')
            ->latest('created_at')
            ->limit(20)
            ->get()
            ->map(function ($record) {
                return [
                    'id' => $record->id,
                    'type' => 'found',
                    'name' => $record->name ?? 'অজানা',
                    'age' => $record->approximate_age ?? '—',
                    'division' => $record->district ?? 'N/A',
                    'status' => $record->status ?: ($record->approved ? 'published' : 'pending'),
                    'date' => optional($record->created_at)->format('Y-m-d'),
                    'created_at' => optional($record->created_at)?->timestamp ?? 0,
                ];
            });

        $reports = $missingReports
            ->concat($foundReports)
            ->sortByDesc('created_at')
            ->take(10)
            ->map(function ($record) {
                unset($record['created_at']);
                return $record;
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
        $start = Carbon::now()->startOfMonth()->subMonths(11);

        $missingRows = MissingReport::query()
            ->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month_key, COUNT(*) as total')
            ->where('created_at', '>=', $start)
            ->groupBy('month_key')
            ->pluck('total', 'month_key');

        $foundRows = FoundReport::query()
            ->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month_key, COUNT(*) as total')
            ->where('created_at', '>=', $start)
            ->groupBy('month_key')
            ->pluck('total', 'month_key');

        $series = [];
        for ($i = 11; $i >= 0; $i--) {
            $date = Carbon::now()->startOfMonth()->subMonths($i);
            $key = $date->format('Y-m');
            $series[] = [
                'label' => $date->format('M'),
                'value' => (int) (($missingRows[$key] ?? 0) + ($foundRows[$key] ?? 0)),
            ];
        }

        return $series;
    }

    private function statusDistribution(int $totalReports)
    {
        $pending = MissingReport::where('approved', 0)->count()
            + FoundReport::where('approved', 0)->where('status', 'pending')->count();

        $verified = MissingReport::where('approved', 1)
            ->whereNotIn('status', ['found', 'closed'])
            ->count();

        $resolved = MissingReport::whereIn('status', ['found', 'closed'])->count();
        $published = FoundReport::where('approved', 1)->where('status', 'published')->count();
        $rejected = FoundReport::where('status', 'rejected')->count();
        $knownTotal = $pending + $verified + $resolved + $published + $rejected;
        $other = max($totalReports - $knownTotal, 0);

        $segments = array_values(array_filter([
            ['key' => 'pending', 'label' => 'Pending', 'value' => $pending, 'color' => '#f59e0b'],
            ['key' => 'verified', 'label' => 'Verified', 'value' => $verified, 'color' => '#3b82f6'],
            ['key' => 'resolved', 'label' => 'Resolved', 'value' => $resolved, 'color' => '#10b981'],
            ['key' => 'published', 'label' => 'Published', 'value' => $published, 'color' => '#14b8a6'],
            ['key' => 'rejected', 'label' => 'Rejected', 'value' => $rejected, 'color' => '#ef4444'],
            ['key' => 'other', 'label' => 'Other', 'value' => $other, 'color' => '#6b7280'],
        ], fn ($item) => $item['value'] > 0));

        if (empty($segments)) {
            $segments[] = ['key' => 'pending', 'label' => 'Pending', 'value' => 0, 'color' => '#f59e0b'];
        }

        $total = max($totalReports, 0);

        return array_map(function ($item) use ($total) {
            $item['pct'] = $total > 0 ? round(($item['value'] / $total) * 100, 1) : 0;
            return $item;
        }, $segments);
    }

    private function divisionDistribution()
    {
        $districtExpr = 'COALESCE(NULLIF(TRIM(district), ""), "Unknown")';

        $rows = MissingReport::query()
            ->selectRaw("{$districtExpr} as name, COUNT(*) as count")
            ->groupByRaw($districtExpr)
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
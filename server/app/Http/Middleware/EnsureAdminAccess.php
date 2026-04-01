<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureAdminAccess
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if (!$this->isAdminEmail($user->email)) {
            return response()->json(['message' => 'Forbidden. Admin access required.'], 403);
        }

        return $next($request);
    }

    private function isAdminEmail($email)
    {
        $normalizedEmail = strtolower(trim((string) $email));

        foreach (config('admin.credentials', []) as $admin) {
            if (!isset($admin['email'])) {
                continue;
            }

            if (strtolower(trim((string) $admin['email'])) === $normalizedEmail) {
                return true;
            }
        }

        return false;
    }
}

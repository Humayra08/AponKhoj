<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Supabase's free tier pauses a project after 7 days with no activity.
 * This trivial query, run daily via the scheduler, keeps the chatbot's
 * vector store awake indefinitely at zero cost.
 */
class SupabaseKeepAlive extends Command
{
    protected $signature = 'chat:supabase-keepalive';

    protected $description = 'Ping the Supabase vector store to prevent free-tier auto-pause after 7 days idle.';

    public function handle(): int
    {
        try {
            DB::connection('supabase')->select('SELECT 1');
            $this->info('Supabase keep-alive ping succeeded.');
            return self::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Supabase keep-alive ping failed: ' . $e->getMessage());
            return self::FAILURE;
        }
    }
}

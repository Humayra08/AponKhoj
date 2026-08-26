<?php

namespace App\Services;

use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\FoundReport;
use App\Models\MissingReport;

class RagPipelineService
{
    private const MAX_CONTEXT_CHARS = 6000;
    private const MAX_HISTORY_MESSAGES = 8;

    public function __construct(
        private EmbeddingClientService $embeddingClient,
        private VectorIndexService $vectorIndex,
        private HuggingFaceChatService $chatService,
    ) {
    }

    /**
     * Handle one turn: store the user message, retrieve context, generate a reply,
     * store the assistant message, and return a response payload for the API.
     */
    public function handleMessage(ChatConversation $conversation, string $userMessage): array
    {
        ChatMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'user',
            'content' => $userMessage,
        ]);

        $retrieved = $this->retrieve($userMessage);
        $context = $this->buildContext($retrieved);
        $reply = $this->generate($conversation, $userMessage, $context);

        if ($reply === null) {
            $reply = 'দুঃখিত, এই মুহূর্তে উত্তর দিতে সমস্যা হচ্ছে। একটু পরে আবার চেষ্টা করুন।';
        }

        ChatMessage::create([
            'conversation_id' => $conversation->id,
            'role' => 'assistant',
            'content' => $reply,
            'retrieved_context' => $retrieved,
        ]);

        return [
            'reply' => $reply,
            'matched_reports' => $retrieved['reports'] ?? [],
        ];
    }

    /**
     * Retrieve relevant KB chunks and, when the query looks like a person search,
     * relevant report text matches. Returns raw retrieval data (not yet formatted).
     */
    private function retrieve(string $query): array
    {
        $queryEmbedding = $this->embeddingClient->embedText($query);

        if ($queryEmbedding === null) {
            return ['kb' => [], 'reports' => []];
        }

        $kbHits = $this->vectorIndex->searchKb($queryEmbedding, 4);
        $reportHits = $this->vectorIndex->searchReportsText($queryEmbedding, 6);

        $reports = $this->hydrateReportHits($reportHits);

        return [
            'kb' => $kbHits,
            'reports' => $reports,
        ];
    }

    /**
     * Turn raw RediSearch hits (ref_type + ref_id) into lightweight report summaries
     * safe to show in chat and send back to the frontend as cards.
     */
    private function hydrateReportHits(array $hits): array
    {
        $missingIds = [];
        $foundIds = [];

        foreach ($hits as $hit) {
            $id = (int) ($hit['ref_id'] ?? 0);
            if (!$id) {
                continue;
            }
            if (($hit['ref_type'] ?? '') === 'missing') {
                $missingIds[] = $id;
            } elseif (($hit['ref_type'] ?? '') === 'found') {
                $foundIds[] = $id;
            }
        }

        $summaries = [];

        if (!empty($missingIds)) {
            $reports = MissingReport::whereIn('id', $missingIds)
                ->where('approved', true)
                ->where('status', 'published')
                ->get();

            foreach ($reports as $r) {
                $summaries[] = [
                    'type' => 'missing',
                    'id' => $r->id,
                    'name' => $r->name,
                    'age' => $r->age,
                    'gender' => $r->gender,
                    'district' => $r->district,
                    'photo_url' => $r->photo_url,
                    'last_seen_date' => optional($r->last_seen_date)->format('Y-m-d'),
                ];
            }
        }

        if (!empty($foundIds)) {
            $reports = FoundReport::whereIn('id', $foundIds)
                ->where('approved', true)
                ->where('status', 'published')
                ->get();

            foreach ($reports as $r) {
                $summaries[] = [
                    'type' => 'found',
                    'id' => $r->id,
                    'name' => $r->name,
                    'age' => $r->approximate_age,
                    'gender' => $r->gender,
                    'district' => $r->district,
                    'photo_url' => $r->photo_url,
                    'found_date' => optional($r->found_date)->format('Y-m-d'),
                ];
            }
        }

        return $summaries;
    }

    /**
     * Assemble a bounded, citation-tagged context block for the system prompt.
     */
    private function buildContext(array $retrieved): string
    {
        $parts = [];

        foreach ($retrieved['kb'] as $hit) {
            $text = trim((string) ($hit['text'] ?? ''));
            if ($text !== '') {
                $parts[] = "[KB] {$text}";
            }
        }

        foreach ($retrieved['reports'] as $r) {
            $label = $r['type'] === 'missing' ? 'নিখোঁজ' : 'উদ্ধার হওয়া';
            $parts[] = sprintf(
                '[REPORT #%d] %s ব্যক্তি: %s, বয়স: %s, লিঙ্গ: %s, জেলা: %s',
                $r['id'],
                $label,
                $r['name'] ?: 'অজ্ঞাত',
                $r['age'] ?? 'অজানা',
                $r['gender'] ?? 'অজানা',
                $r['district'] ?? 'অজানা'
            );
        }

        $context = implode("\n", $parts);

        return mb_substr($context, 0, self::MAX_CONTEXT_CHARS);
    }

    private function generate(ChatConversation $conversation, string $userMessage, string $context): ?string
    {
        $messages = [
            ['role' => 'system', 'content' => $this->systemPrompt($context)],
        ];

        foreach ($this->recentHistory($conversation) as $m) {
            $messages[] = ['role' => $m->role === 'assistant' ? 'assistant' : 'user', 'content' => $m->content];
        }

        $messages[] = ['role' => 'user', 'content' => $userMessage];

        return $this->chatService->chat($messages);
    }

    private function recentHistory(ChatConversation $conversation)
    {
        return $conversation->messages()
            ->whereIn('role', ['user', 'assistant'])
            ->orderByDesc('created_at')
            ->limit(self::MAX_HISTORY_MESSAGES)
            ->get()
            ->reverse()
            ->values();
    }

    private function systemPrompt(string $context): string
    {
        $base = <<<'PROMPT'
আপনি "আপনখোঁজ" (AponKhoj) ওয়েবসাইটের একজন সহায়ক সহকারী — এটি বাংলাদেশে নিখোঁজ ও উদ্ধার হওয়া ব্যক্তিদের খুঁজে বের করার একটি প্ল্যাটফর্ম।

আপনার কাজ:
1. ওয়েবসাইট কীভাবে কাজ করে সে সম্পর্কে প্রশ্নের উত্তর দিন।
2. নিখোঁজ বা উদ্ধার হওয়া ব্যক্তি সম্পর্কে প্রশ্নের উত্তর দিন, নিচে দেওয়া প্রাসঙ্গিক তথ্যের ভিত্তিতে।
3. কেবলমাত্র নিচে প্রদত্ত প্রসঙ্গ (context) থেকে তথ্য ব্যবহার করুন। যদি প্রসঙ্গে উত্তর না থাকে, সৎভাবে বলুন যে আপনি জানেন না।
4. সংক্ষিপ্ত, স্পষ্ট এবং বাংলায় উত্তর দিন যদি না ব্যবহারকারী ইংরেজিতে জিজ্ঞাসা করেন।
5. কোনো ব্যক্তির সংবেদনশীল ব্যক্তিগত তথ্য (যেমন সম্পূর্ণ ঠিকানা, ফোন নম্বর) নিজে থেকে প্রকাশ করবেন না — ব্যবহারকারীকে সংশ্লিষ্ট রিপোর্ট পেজ দেখতে বলুন।
PROMPT;

        if (trim($context) !== '') {
            $base .= "\n\nপ্রাসঙ্গিক তথ্য (context):\n{$context}";
        }

        return $base;
    }
}

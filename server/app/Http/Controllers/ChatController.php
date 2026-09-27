<?php

namespace App\Http\Controllers;

use App\Models\ChatConversation;
use App\Services\RagPipelineService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ChatController extends Controller
{
    public function __construct(private RagPipelineService $ragPipeline)
    {
    }

    /**
     * POST /api/chat/message
     * body: conversation_id?, session_id?, message
     */
    public function sendMessage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'message' => 'required|string|max:2000',
            'conversation_id' => 'nullable|integer',
            'session_id' => 'nullable|uuid',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $conversation = $this->resolveConversation($request);

        $result = $this->ragPipeline->handleMessage($conversation, $request->input('message'));

        return response()->json([
            'conversation_id' => $conversation->id,
            'session_id' => $conversation->session_id,
            'reply' => $result['reply'],
            'matched_reports' => $result['matched_reports'],
        ]);
    }

    /**
     * GET /api/chat/conversations
     * Lists past conversations for the current user (logged in) or session_id
     * (guest), newest first, for the full chat page's history sidebar.
     */
    public function listConversations(Request $request)
    {
        $user = $request->user('api');

        $query = ChatConversation::query()->orderByDesc('updated_at');

        if ($user) {
            $query->where('user_id', $user->id);
        } else {
            $sessionId = $request->query('session_id');
            if (!$sessionId) {
                return response()->json(['conversations' => []]);
            }
            $query->where('session_id', $sessionId)->whereNull('user_id');
        }

        $conversations = $query->limit(30)->get(['id', 'title', 'updated_at']);

        return response()->json(['conversations' => $conversations]);
    }

    /**
     * GET /api/chat/conversations/{id}
     */
    public function show(Request $request, int $id)
    {
        $conversation = ChatConversation::find($id);

        if (!$conversation) {
            return response()->json(['message' => 'Conversation not found.'], 404);
        }

        if (!$this->canAccess($request, $conversation)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return response()->json([
            'conversation_id' => $conversation->id,
            'session_id' => $conversation->session_id,
            'messages' => $conversation->messages()->get(['role', 'content', 'created_at']),
        ]);
    }

    private function resolveConversation(Request $request): ChatConversation
    {
        $user = $request->user('api');

        if ($request->filled('conversation_id')) {
            $existing = ChatConversation::find($request->input('conversation_id'));
            if ($existing && $this->canAccess($request, $existing)) {
                return $existing;
            }
        }

        $sessionId = $request->input('session_id') ?: (string) Str::uuid();

        return ChatConversation::create([
            'user_id' => $user?->id,
            'session_id' => $user ? null : $sessionId,
        ]);
    }

    private function canAccess(Request $request, ChatConversation $conversation): bool
    {
        $user = $request->user('api');

        if ($user && $conversation->user_id === $user->id) {
            return true;
        }

        if (!$conversation->user_id && $conversation->session_id && $conversation->session_id === $request->input('session_id')) {
            return true;
        }

        return false;
    }
}

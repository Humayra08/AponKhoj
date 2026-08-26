<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatConversation extends Model
{
    protected $table = 'chat_conversations';

    protected $fillable = [
        'user_id',
        'session_id',
        'title',
        'status',
        'context_type',
        'draft_report_payload',
    ];

    protected $casts = [
        'draft_report_payload' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function messages()
    {
        return $this->hasMany(ChatMessage::class, 'conversation_id')->orderBy('created_at');
    }
}

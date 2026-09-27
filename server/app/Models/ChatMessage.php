<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChatMessage extends Model
{
    protected $table = 'chat_messages';

    protected $fillable = [
        'conversation_id',
        'role',
        'content',
        'attachments',
        'retrieved_context',
        'metadata',
    ];

    protected $casts = [
        'attachments' => 'array',
        'retrieved_context' => 'array',
        'metadata' => 'array',
    ];

    public function conversation()
    {
        return $this->belongsTo(ChatConversation::class, 'conversation_id');
    }
}

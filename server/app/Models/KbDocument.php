<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KbDocument extends Model
{
    protected $table = 'kb_documents';

    protected $fillable = [
        'source',
        'title',
        'chunk_text',
        'chunk_index',
        'embedding_indexed_at',
    ];

    protected $casts = [
        'embedding_indexed_at' => 'datetime',
    ];
}

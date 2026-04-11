<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class SuccessStory extends Model
{
    use HasFactory;

    protected $table = 'success_stories';

    protected $fillable = [
        'title', 'slug', 'excerpt', 'story',
        'person_name', 'person_age', 'person_gender',
        'division', 'district',
        'missing_date', 'found_date',
        'cover_image_url', 'cover_image_public_id',
        'missing_report_id', 'found_report_id',
        'published_by', 'is_published', 'published_at',
        'featured', 'views', 'tag',
    ];

    protected $casts = [
        'missing_date'  => 'date',
        'found_date'    => 'date',
        'published_at'  => 'datetime',
        'is_published'  => 'boolean',
        'featured'      => 'boolean',
        'views'         => 'integer',
        'person_age'    => 'integer',
    ];

    public function publisher()
    {
        return $this->belongsTo(User::class, 'published_by');
    }

    public function missingReport()
    {
        return $this->belongsTo(MissingReport::class, 'missing_report_id');
    }

    public function foundReport()
    {
        return $this->belongsTo(FoundReport::class, 'found_report_id');
    }

    public function scopePublished($query)
    {
        return $query->where('is_published', true);
    }

    public function scopeFeatured($query)
    {
        return $query->where('featured', true);
    }

    public static function generateSlug(string $title, ?int $ignoreId = null): string
    {
        $base = Str::slug($title);
        $slug = $base;
        $i    = 1;

        while (
            static::where('slug', $slug)
                  ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                  ->exists()
        ) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }
}
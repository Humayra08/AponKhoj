<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MissingReport extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'missing_reports';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'name',
        'age',
        'gender',
        'height',
        'photo_url',
        'cloudinary_public_id',
        'last_seen_date',
        'last_seen_time',
        'district',
        'address',
        'clothing_description',
        'additional_info',
        'contact_person_name',
        'contact_phone',
        'status',
        'approved',
        'rejection_reason',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'last_seen_date' => 'date',
        'approved' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user that submitted this report.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

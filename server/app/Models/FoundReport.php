<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FoundReport extends Model
{
    use HasFactory;

    protected $table = 'found_reports';

    protected $fillable = [
        'user_id',
        'name',
        'approximate_age',
        'gender',
        'health_status',
        'photo_url',
        'cloudinary_public_id',
        'found_date',
        'found_time',
        'district',
        'address',
        'physical_description',
        'additional_info',
        'contact_person_name',
        'contact_phone',
        'status',
        'approved',
        'rejection_reason',
    ];

    protected $casts = [
        'found_date' => 'date',
        'approved'   => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function matches()
    {
        return $this->hasMany(FoundMatch::class, 'found_report_id');
    }
}

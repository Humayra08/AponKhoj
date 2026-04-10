<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FoundMatch extends Model
{
    protected $table = 'found_matches';

    protected $fillable = [
        'found_report_id',
        'missing_report_id',
        'total_score',
        'name_score',
        'district_score',
        'location_score',
        'age_score',
        'gender_score',
        'description_score',
        'ai_reasoning',
        'match_level',
    ];

    protected $casts = [
        'total_score'       => 'float',
        'name_score'        => 'float',
        'district_score'    => 'float',
        'location_score'    => 'float',
        'age_score'         => 'float',
        'gender_score'      => 'float',
        'description_score' => 'float',
    ];

    public function foundReport()
    {
        return $this->belongsTo(FoundReport::class, 'found_report_id');
    }

    public function missingReport()
    {
        return $this->belongsTo(MissingReport::class, 'missing_report_id');
    }
}

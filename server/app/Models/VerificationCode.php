<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VerificationCode extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'verification_codes';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'email',
        'code',
        'expires_at',
        'verified',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'expires_at' => 'datetime',
        'verified' => 'boolean',
    ];

    /**
     * Check if the verification code has expired.
     *
     * @return bool
     */
    public function isExpired()
    {
        return $this->expires_at < now();
    }

    /**
     * Check if the code is valid (not expired and not verified yet).
     *
     * @return bool
     */
    public function isValid()
    {
        return !$this->isExpired() && !$this->verified;
    }
}

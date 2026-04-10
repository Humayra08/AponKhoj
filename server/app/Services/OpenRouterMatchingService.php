<?php

namespace App\Services;

use App\Models\FoundMatch;
use App\Models\FoundReport;
use App\Models\MissingReport;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenRouterMatchingService
{
    private string $apiKey;
    private string $baseUrl = 'https://openrouter.ai/api/v1';
    // Free, capable model on OpenRouter
    private string $model = 'meta-llama/llama-3.1-8b-instruct:free';

    public function __construct()
    {
        $this->apiKey = config('services.openrouter.api_key', '');
    }

    /**
     * Run AI matching for a found report against all published missing reports.
     * Saves results to found_matches table.
     * Returns top matches sorted by score descending.
     */
    public function runMatchingForFoundReport(FoundReport $foundReport): array
    {
        // Get all published missing reports
        $missingReports = MissingReport::where('approved', true)
            ->where('status', 'published')
            ->get();

        if ($missingReports->isEmpty()) {
            return [];
        }

        $matchResults = [];

        foreach ($missingReports as $missingReport) {
            try {
                $scoreData = $this->scoreMatch($foundReport, $missingReport);

                // Save or update match in DB
                FoundMatch::updateOrCreate(
                    [
                        'found_report_id' => $foundReport->id,
                        'missing_report_id' => $missingReport->id,
                    ],
                    [
                        'total_score' => $scoreData['total_score'],
                        'name_score' => $scoreData['name_score'],
                        'district_score' => $scoreData['district_score'],
                        'location_score' => $scoreData['location_score'],
                        'age_score' => $scoreData['age_score'],
                        'gender_score' => $scoreData['gender_score'],
                        'description_score' => $scoreData['description_score'],
                        'ai_reasoning' => $scoreData['reasoning'],
                        'match_level' => $this->getMatchLevel($scoreData['total_score']),
                    ]
                );

                $matchResults[] = array_merge($scoreData, [
                    'missing_report_id' => $missingReport->id,
                    'missing_report_name' => $missingReport->name,
                    'missing_photo_url' => $missingReport->photo_url,
                    'missing_district' => $missingReport->district,
                    'missing_age' => $missingReport->age,
                    'missing_gender' => $missingReport->gender,
                    'match_level' => $this->getMatchLevel($scoreData['total_score']),
                ]);
            } catch (\Exception $e) {
                Log::error("AI matching failed for found #{$foundReport->id} vs missing #{$missingReport->id}: " . $e->getMessage());
            }
        }

        // Sort by total_score descending
        usort($matchResults, fn ($a, $b) => $b['total_score'] <=> $a['total_score']);

        return $matchResults;
    }

    /**
     * Score a single found vs missing pair using OpenRouter AI.
     * Priority: Name(35) > District(25) > Location(20) > Age(10) > Gender(5) > Description(5)
     */
    private function scoreMatch(FoundReport $found, MissingReport $missing): array
    {
        // Build rule-based pre-scores for fast calculation
        // AI will refine these with reasoning
        $ruleScores = $this->ruleBasedScore($found, $missing);

        // Call AI only if rule-based score is above minimum threshold (optimization)
        // or if name/district match looks promising
        if ($ruleScores['total_score'] < 5 && empty($found->name) && empty($missing->name)) {
            // Both have no name - use rule-based only
            return $ruleScores;
        }

        $prompt = $this->buildMatchingPrompt($found, $missing, $ruleScores);

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $this->apiKey,
            'HTTP-Referer' => config('app.url', 'https://aponkhoj.com'),
            'X-Title' => 'AponKhoj Missing Person Matcher',
            'Content-Type' => 'application/json',
        ])->timeout(30)->post("{$this->baseUrl}/chat/completions", [
            'model' => $this->model,
            'max_tokens' => 300,
            'temperature' => 0.1, // Low temperature for consistent scoring
            'messages' => [
                [
                    'role' => 'system',
                    'content' => $this->getSystemPrompt(),
                ],
                [
                    'role' => 'user',
                    'content' => $prompt,
                ],
            ],
        ]);

        if (!$response->successful()) {
            Log::warning('OpenRouter API failed, using rule-based score. Status: ' . $response->status());
            return $ruleScores;
        }

        $content = $response->json('choices.0.message.content', '');
        return $this->parseAiResponse($content, $ruleScores);
    }

    private function getSystemPrompt(): string
    {
        return <<<'PROMPT'
You are an expert assistant for a missing person tracking system in Bangladesh called AponKhoj.
Your task is to score how likely a "found person" report matches a "missing person" report.

Score each category and respond ONLY in this exact JSON format (no extra text):
{
  "name_score": <0-35>,
  "district_score": <0-25>,
  "location_score": <0-20>,
  "age_score": <0-10>,
  "gender_score": <0-5>,
  "description_score": <0-5>,
  "reasoning": "<one sentence explanation in English>"
}

Scoring rules:
- name_score (max 35): Exact match=35, Phonetic/similar Bengali name=25, Partial=10, Unknown name=15, No match=0
- district_score (max 25): Same district=25, Adjacent district=10, Different=0
- location_score (max 20): Same area/thana=20, Same upazila=12, Same city=7, Different=0
- age_score (max 10): Within 2 years=10, Within 5 years=7, Within 10 years=4, Unknown age=5, No match=0
- gender_score (max 5): Same=5, Unknown=3, Different=0
- description_score (max 5): Strong physical match (clothing, height, marks)=5, Partial=3, No info=2, Mismatch=0
PROMPT;
    }

    private function buildMatchingPrompt(FoundReport $found, MissingReport $missing, array $ruleScores): string
    {
        $foundDate = $found->found_date ? $found->found_date->format('Y-m-d') : 'Unknown';
        $missingDate = $missing->last_seen_date ? $missing->last_seen_date->format('Y-m-d') : 'Unknown';

        return <<<PROMPT
Compare these two reports:

=== FOUND PERSON ===
Name (if known): {$found->name}
Approximate Age: {$found->approximate_age}
Gender: {$found->gender}
Health Status: {$found->health_status}
Found District: {$found->district}
Found Address: {$found->address}
Found Date: {$foundDate}
Physical Description: {$found->physical_description}
Additional Info: {$found->additional_info}

=== MISSING PERSON ===
Name: {$missing->name}
Age: {$missing->age}
Gender: {$missing->gender}
Last Seen District: {$missing->district}
Last Seen Address: {$missing->address}
Last Seen Date: {$missingDate}
Clothing Description: {$missing->clothing_description}
Additional Info: {$missing->additional_info}

Rule-based pre-scores for reference: Name={$ruleScores['name_score']}, District={$ruleScores['district_score']}, Location={$ruleScores['location_score']}

Score this match. Remember: respond ONLY with JSON.
PROMPT;
    }

    /**
     * Fast rule-based scoring as fallback and pre-filter
     */
    private function ruleBasedScore(FoundReport $found, MissingReport $missing): array
    {
        $nameScore = $this->scoreNameMatch($found->name, $missing->name);
        $districtScore = $this->scoreDistrictMatch($found->district, $missing->district);
        $locationScore = $this->scoreLocationMatch($found->address, $missing->address);
        $ageScore = $this->scoreAgeMatch($found->approximate_age, $missing->age);
        $genderScore = $this->scoreGenderMatch($found->gender, $missing->gender);
        $descriptionScore = $this->scoreDescriptionMatch($found->physical_description, $missing->clothing_description);

        $total = $nameScore + $districtScore + $locationScore + $ageScore + $genderScore + $descriptionScore;

        return [
            'name_score' => $nameScore,
            'district_score' => $districtScore,
            'location_score' => $locationScore,
            'age_score' => $ageScore,
            'gender_score' => $genderScore,
            'description_score' => $descriptionScore,
            'total_score' => round($total, 2),
            'reasoning' => '',
        ];
    }

    private function scoreNameMatch(?string $foundName, ?string $missingName): float
    {
        if (!$foundName || !$missingName) {
            return 15.0; // Unknown name - partial credit
        }

        $a = mb_strtolower(trim($foundName));
        $b = mb_strtolower(trim($missingName));

        if ($a === $b) {
            return 35.0;
        }

        // Check if one contains the other
        if (str_contains($a, $b) || str_contains($b, $a)) {
            return 25.0;
        }

        // Similar string distance
        similar_text($a, $b, $percent);
        if ($percent >= 80) {
            return 22.0;
        }
        if ($percent >= 60) {
            return 15.0;
        }
        if ($percent >= 40) {
            return 8.0;
        }

        return 0.0;
    }

    private function scoreDistrictMatch(?string $foundDistrict, ?string $missingDistrict): float
    {
        if (!$foundDistrict || !$missingDistrict) {
            return 0.0;
        }

        $a = mb_strtolower(trim($foundDistrict));
        $b = mb_strtolower(trim($missingDistrict));

        if ($a === $b) {
            return 25.0;
        }

        // Adjacent districts map (simplified)
        $adjacentDistricts = [
            'ঢাকা' => ['নারায়ণগঞ্জ', 'গাজীপুর', 'মানিকগঞ্জ', 'মুন্সিগঞ্জ'],
            'চট্টগ্রাম' => ['কক্সবাজার', 'ফেনী', 'রাঙ্গামাটি', 'খাগড়াছড়ি'],
            'রাজশাহী' => ['নাটোর', 'চাঁপাইনবাবগঞ্জ', 'নওগাঁ', 'পাবনা'],
            'খুলনা' => ['বাগেরহাট', 'সাতক্ষীরা', 'যশোর'],
            'সিলেট' => ['মৌলভীবাজার', 'হবিগঞ্জ', 'সুনামগঞ্জ'],
        ];

        foreach ($adjacentDistricts as $main => $neighbors) {
            $mainLower = mb_strtolower($main);
            $neighborLower = array_map(static fn ($value) => mb_strtolower($value), $neighbors);

            if (($a === $mainLower && in_array($b, $neighborLower, true)) ||
                ($b === $mainLower && in_array($a, $neighborLower, true))) {
                return 10.0;
            }
        }

        return 0.0;
    }

    private function scoreLocationMatch(?string $foundAddress, ?string $missingAddress): float
    {
        if (!$foundAddress || !$missingAddress) {
            return 2.0;
        }

        $a = mb_strtolower(trim($foundAddress));
        $b = mb_strtolower(trim($missingAddress));

        if ($a === $b) {
            return 20.0;
        }

        similar_text($a, $b, $percent);
        if ($percent >= 70) {
            return 15.0;
        }
        if ($percent >= 50) {
            return 8.0;
        }
        if ($percent >= 30) {
            return 4.0;
        }

        return 0.0;
    }

    private function scoreAgeMatch(?int $foundAge, ?int $missingAge): float
    {
        if ($foundAge === null || $missingAge === null) {
            return 5.0; // Unknown
        }

        $diff = abs($foundAge - $missingAge);
        if ($diff <= 2) {
            return 10.0;
        }
        if ($diff <= 5) {
            return 7.0;
        }
        if ($diff <= 10) {
            return 4.0;
        }

        return 0.0;
    }

    private function scoreGenderMatch(?string $foundGender, ?string $missingGender): float
    {
        if (!$foundGender || !$missingGender) {
            return 3.0;
        }
        return mb_strtolower($foundGender) === mb_strtolower($missingGender) ? 5.0 : 0.0;
    }

    private function scoreDescriptionMatch(?string $foundDesc, ?string $missingDesc): float
    {
        if (!$foundDesc || !$missingDesc) {
            return 2.0;
        }

        similar_text(mb_strtolower($foundDesc), mb_strtolower($missingDesc), $percent);
        if ($percent >= 60) {
            return 5.0;
        }
        if ($percent >= 40) {
            return 3.0;
        }

        return 1.0;
    }

    private function parseAiResponse(string $content, array $fallback): array
    {
        try {
            // Extract JSON from response
            preg_match('/\{[^}]+\}/s', $content, $matches);
            if (empty($matches)) {
                return $fallback;
            }

            $data = json_decode($matches[0], true);
            if (!$data) {
                return $fallback;
            }

            $nameScore = min((float) ($data['name_score'] ?? $fallback['name_score']), 35);
            $districtScore = min((float) ($data['district_score'] ?? $fallback['district_score']), 25);
            $locationScore = min((float) ($data['location_score'] ?? $fallback['location_score']), 20);
            $ageScore = min((float) ($data['age_score'] ?? $fallback['age_score']), 10);
            $genderScore = min((float) ($data['gender_score'] ?? $fallback['gender_score']), 5);
            $descriptionScore = min((float) ($data['description_score'] ?? $fallback['description_score']), 5);

            $total = $nameScore + $districtScore + $locationScore + $ageScore + $genderScore + $descriptionScore;

            return [
                'name_score' => $nameScore,
                'district_score' => $districtScore,
                'location_score' => $locationScore,
                'age_score' => $ageScore,
                'gender_score' => $genderScore,
                'description_score' => $descriptionScore,
                'total_score' => round(min($total, 100), 2),
                'reasoning' => $data['reasoning'] ?? 'AI analysis complete',
            ];
        } catch (\Exception $e) {
            return $fallback;
        }
    }

    private function getMatchLevel(float $score): string
    {
        if ($score >= 60) {
            return 'high';
        }
        if ($score >= 35) {
            return 'medium';
        }
        return 'low';
    }
}

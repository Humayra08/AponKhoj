<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SuccessStory;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Cloudinary\Cloudinary;

class SuccessStoryController extends Controller
{
    public function index(Request $request)
    {
        $query = SuccessStory::with('publisher:id,name,email')
            ->orderByDesc('created_at');

        if ($request->filled('search')) {
            $q = '%' . $request->search . '%';
            $query->where(function ($b) use ($q) {
                $b->where('title', 'like', $q)
                  ->orWhere('person_name', 'like', $q)
                  ->orWhere('division', 'like', $q);
            });
        }

        if ($request->filled('status')) {
            $query->where('is_published', $request->status === 'published' ? 1 : 0);
        }

        return response()->json($query->paginate(15));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'             => 'required|string|max:255',
            'excerpt'           => 'required|string|max:1000',
            'story'             => 'required|string',
            'person_name'       => 'required|string|max:100',
            'person_age'        => 'nullable|integer|min:0|max:120',
            'person_gender'     => 'required|in:male,female,other',
            'division'          => 'required|string|max:60',
            'district'          => 'nullable|string|max:60',
            'missing_date'      => 'nullable|date',
            'found_date'        => 'nullable|date',
            'missing_report_id' => 'nullable|integer|exists:missing_reports,id',
            'found_report_id'   => 'nullable|integer|exists:found_reports,id',
            'is_published'      => 'boolean',
            'featured'          => 'boolean',
            'tag'               => 'nullable|string|max:60',
            'cover_image'       => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        $coverImageUrl = null;
        $coverImagePublicId = null;

        if ($request->hasFile('cover_image')) {
            $result = $this->uploadToCloudinary($request->file('cover_image'), 'success_stories');
            $coverImageUrl      = $result['secure_url'];
            $coverImagePublicId = $result['public_id'];
        }

        $story = SuccessStory::create([
            'title'                 => $data['title'],
            'slug'                  => SuccessStory::generateSlug($data['title']),
            'excerpt'               => $data['excerpt'],
            'story'                 => $data['story'],
            'person_name'           => $data['person_name'],
            'person_age'            => $data['person_age'] ?? null,
            'person_gender'         => $data['person_gender'],
            'division'              => $data['division'],
            'district'              => $data['district'] ?? null,
            'missing_date'          => $data['missing_date'] ?? null,
            'found_date'            => $data['found_date'] ?? null,
            'cover_image_url'       => $coverImageUrl,
            'cover_image_public_id' => $coverImagePublicId,
            'missing_report_id'     => $data['missing_report_id'] ?? null,
            'found_report_id'       => $data['found_report_id'] ?? null,
            'published_by'          => $request->user()->id,
            'is_published'          => $data['is_published'] ?? false,
            'published_at'          => ($data['is_published'] ?? false) ? Carbon::now() : null,
            'featured'              => $data['featured'] ?? false,
            'tag'                   => $data['tag'] ?? 'পুনর্মিলিত',
        ]);

        return response()->json([
            'message' => 'Success story created successfully.',
            'story'   => $story->load('publisher:id,name'),
        ], 201);
    }

    public function show(int $id)
    {
        $story = SuccessStory::with('publisher:id,name')->findOrFail($id);
        return response()->json($story);
    }

    public function update(Request $request, int $id)
    {
        $story = SuccessStory::findOrFail($id);

        $data = $request->validate([
            'title'             => 'sometimes|required|string|max:255',
            'excerpt'           => 'sometimes|required|string|max:1000',
            'story'             => 'sometimes|required|string',
            'person_name'       => 'sometimes|required|string|max:100',
            'person_age'        => 'nullable|integer|min:0|max:120',
            'person_gender'     => 'sometimes|required|in:male,female,other',
            'division'          => 'sometimes|required|string|max:60',
            'district'          => 'nullable|string|max:60',
            'missing_date'      => 'nullable|date',
            'found_date'        => 'nullable|date',
            'missing_report_id' => 'nullable|integer|exists:missing_reports,id',
            'found_report_id'   => 'nullable|integer|exists:found_reports,id',
            'is_published'      => 'boolean',
            'featured'          => 'boolean',
            'tag'               => 'nullable|string|max:60',
            'cover_image'       => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        if ($request->hasFile('cover_image')) {
            if ($story->cover_image_public_id) {
                $this->deleteFromCloudinary($story->cover_image_public_id);
            }
            $result = $this->uploadToCloudinary($request->file('cover_image'), 'success_stories');
            $data['cover_image_url']       = $result['secure_url'];
            $data['cover_image_public_id'] = $result['public_id'];
        }

        if (isset($data['title']) && $data['title'] !== $story->title) {
            $data['slug'] = SuccessStory::generateSlug($data['title'], $story->id);
        }

        if (isset($data['is_published'])) {
            if ($data['is_published'] && !$story->is_published) {
                $data['published_at'] = Carbon::now();
            } elseif (!$data['is_published']) {
                $data['published_at'] = null;
            }
        }

        $story->update($data);

        return response()->json([
            'message' => 'Success story updated successfully.',
            'story'   => $story->fresh()->load('publisher:id,name'),
        ]);
    }

    public function destroy(int $id)
    {
        $story = SuccessStory::findOrFail($id);

        if ($story->cover_image_public_id) {
            $this->deleteFromCloudinary($story->cover_image_public_id);
        }

        $story->delete();

        return response()->json(['message' => 'Success story deleted successfully.']);
    }

    public function togglePublish(Request $request, int $id)
    {
        $story = SuccessStory::findOrFail($id);
        $story->is_published = !$story->is_published;
        $story->published_at = $story->is_published ? Carbon::now() : null;
        $story->save();

        return response()->json([
            'message'      => $story->is_published ? 'Story published.' : 'Story unpublished.',
            'is_published' => $story->is_published,
            'published_at' => $story->published_at,
        ]);
    }

    public function toggleFeatured(Request $request, int $id)
    {
        $story = SuccessStory::findOrFail($id);
        $story->featured = !$story->featured;
        $story->save();

        return response()->json([
            'message'  => $story->featured ? 'Story featured.' : 'Story unfeatured.',
            'featured' => $story->featured,
        ]);
    }

    public function publicIndex(Request $request)
    {
        $query = SuccessStory::published()
            ->select([
                'id', 'title', 'slug', 'excerpt', 'person_name',
                'person_age', 'person_gender', 'division', 'district',
                'missing_date', 'found_date', 'cover_image_url',
                'is_published', 'featured', 'views', 'tag', 'published_at',
            ])
            ->orderByDesc('featured')
            ->orderByDesc('published_at');

        if ($request->filled('division')) {
            $query->where('division', $request->division);
        }

        if ($request->filled('search')) {
            $q = '%' . $request->search . '%';
            $query->where(function ($b) use ($q) {
                $b->where('title', 'like', $q)
                  ->orWhere('person_name', 'like', $q)
                  ->orWhere('excerpt', 'like', $q);
            });
        }

        return response()->json($query->paginate(12));
    }

    public function publicShow(int $id)
    {
        $story = SuccessStory::published()->findOrFail($id);
        $story->increment('views');
        return response()->json($story);
    }

    private function uploadToCloudinary($file, string $folder): array
    {
        $cloudinary = new Cloudinary([
            'cloud' => [
                'cloud_name' => env('CLOUDINARY_CLOUD_NAME'),
                'api_key'    => env('CLOUDINARY_API_KEY'),
                'api_secret' => env('CLOUDINARY_API_SECRET'),
            ],
        ]);

        $result = $cloudinary->uploadApi()->upload(
            $file->getRealPath(),
            [
                'folder'         => $folder,
                'resource_type'  => 'image',
                'transformation' => [
                    ['width' => 800, 'height' => 500, 'crop' => 'fill', 'quality' => 'auto'],
                ],
            ]
        );

        return ['secure_url' => $result['secure_url'], 'public_id' => $result['public_id']];
    }

    private function deleteFromCloudinary(string $publicId): void
    {
        try {
            $cloudinary = new Cloudinary([
                'cloud' => [
                    'cloud_name' => env('CLOUDINARY_CLOUD_NAME'),
                    'api_key'    => env('CLOUDINARY_API_KEY'),
                    'api_secret' => env('CLOUDINARY_API_SECRET'),
                ],
            ]);
            $cloudinary->uploadApi()->destroy($publicId);
        } catch (\Throwable $e) {
            \Log::warning("Cloudinary delete failed for {$publicId}: " . $e->getMessage());
        }
    }
}
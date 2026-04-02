<?php

namespace App\Services;

use Cloudinary\Cloudinary;
use Exception;

class CloudinaryService
{
    protected $cloudinary;

    public function __construct()
    {
        $this->cloudinary = new Cloudinary([
            'cloud' => [
                'cloud_name' => config('cloudinary.cloud_name'),
                'api_key' => config('cloudinary.api_key'),
                'api_secret' => config('cloudinary.api_secret'),
            ],
            'url' => [
                'secure' => true,
            ],
        ]);
    }

    /**
     * Upload image to Cloudinary
     * 
     * @param \Illuminate\Http\UploadedFile $file
     * @param string $folder
     * @return array
     */
    public function uploadImage($file, $folder = 'missing-reports')
    {
        try {
            $response = $this->cloudinary->uploadApi()->upload(
                $file->getRealPath(),
                [
                    'folder' => $folder,
                    'resource_type' => 'auto',
                    'quality' => 'auto',
                    'fetch_format' => 'auto',
                    'width' => 800,
                    'height' => 600,
                    'crop' => 'limit',
                ]
            );

            return [
                'success' => true,
                'url' => $response['secure_url'],
                'public_id' => $response['public_id'],
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Delete image from Cloudinary
     * 
     * @param string $publicId
     * @return array
     */
    public function deleteImage($publicId)
    {
        try {
            $this->cloudinary->uploadApi()->destroy($publicId);
            return ['success' => true];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Get image URL with transformations
     * 
     * @param string $publicId
     * @param array $transformations
     * @return string
     */
    public function getImageUrl($publicId, $transformations = [])
    {
        try {
            $baseUrl = sprintf(
                'https://res.cloudinary.com/%s/image/upload',
                config('cloudinary.cloud_name')
            );

            $transforms = 'w_400,h_400,c_fill,g_auto,q_auto,f_auto';

            return sprintf(
                '%s/%s/%s',
                $baseUrl,
                $transforms,
                $publicId
            );
        } catch (Exception $e) {
            return '';
        }
    }
}

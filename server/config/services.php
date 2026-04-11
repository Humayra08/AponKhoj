<?php

return [

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],


    'google' => [
        'client_id'     => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect'      => env('GOOGLE_REDIRECT_URI'),
    ],


    'openrouter' => [
       'api_key' => env('OPENROUTER_API_KEY', ''),
   ],


   'giosms' => [
        'base_url' => env('GIOSMS_BASE_URL', 'https://api.giosms.com/api/v1'),
        'token'    => env('GIOSMS_TOKEN'),
       'sender_id' => env('GIOSMS_SENDER_ID', 'nonmasking'),
    ],
   

];

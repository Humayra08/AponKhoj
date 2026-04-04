<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class ContactController extends Controller
{
    public function sendContactForm(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:2000',
        ]);

        try {
            Log::info('Contact form submission', $validated);

            // SAME PATTERN AS VERIFICATION - rename message to contactMessage
            Mail::send('emails.contact-form', [
                'contactName' => $validated['name'],
                'contactEmail' => $validated['email'],
                'contactPhone' => $validated['phone'],
                'contactSubject' => $validated['subject'],
                'contactMessage' => $validated['message'],
            ], function ($message) {
                $message->to('musketeerst687175@gmail.com')
                    ->subject('নতুন যোগাযোগ ফর্ম প্রজেক্ট থেকে');
            });

            Log::info('Contact email sent successfully');

            return response()->json([
                'success' => true,
                'message' => 'আপনার বার্তা সফলভাবে পাঠানো হয়েছে। শীঘ্রই আমরা যোগাযোগ করব।',
            ], 200);

        } catch (\Exception $e) {
            Log::error('Contact email error: ' . $e->getMessage());
            Log::error('Stack: ' . $e->getTraceAsString());

            return response()->json([
                'success' => false,
                'message' => 'ইমেইল পাঠাতে ত্রুটি হয়েছে। দয়া করে পরে চেষ্টা করুন।',
            ], 500);
        }
    }
}
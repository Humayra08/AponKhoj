<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>পাসওয়ার্ড রিসেট - AponKhoj</title>
    <style>
        body {
            font-family: 'Arial', 'SolaimanLipi', sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .email-header {
            background: linear-gradient(135deg, #e85d04 0%, #f48c06 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .email-header h1 {
            margin: 0;
            font-size: 28px;
        }
        .email-body {
            padding: 40px 30px;
            color: #333;
        }
        .email-body h2 {
            color: #e85d04;
            margin-top: 0;
        }
        .verification-code {
            background-color: #fff5f0;
            border: 2px dashed #e85d04;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
        }
        .code {
            font-size: 52px;
            font-weight: bold;
            color: #e85d04;
            letter-spacing: 12px;
            font-family: 'Courier New', monospace;
        }
        .expiry-notice {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .security-notice {
            background-color: #f8d7da;
            border-left: 4px solid #dc3545;
            padding: 12px 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 14px;
        }
        .email-footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
        }
        .help-text {
            color: #6c757d;
            font-size: 14px;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <h1>🔍 AponKhoj</h1>
            <p style="margin: 5px 0 0 0;">পাসওয়ার্ড রিসেট অনুরোধ</p>
        </div>

        <div class="email-body">
            <h2>পাসওয়ার্ড রিসেট কোড</h2>

            <p>প্রিয় {{ $userName }},</p>

            <p>আমরা আপনার AponKhoj অ্যাকাউন্টের পাসওয়ার্ড রিসেটের একটি অনুরোধ পেয়েছি। নিচের কোডটি ব্যবহার করে আপনার পাসওয়ার্ড পরিবর্তন করুন:</p>

            <div class="verification-code">
                <div class="code">{{ $code }}</div>
                <p style="margin: 10px 0 0 0; color: #6c757d;">পাসওয়ার্ড রিসেট কোড</p>
            </div>

            <div class="expiry-notice">
                <strong>⏰ গুরুত্বপূর্ণ:</strong> এই কোডটি মাত্র <strong>১৫ মিনিটের</strong> জন্য বৈধ থাকবে।
            </div>

            <div class="security-notice">
                <strong>🔒 নিরাপত্তা সতর্কতা:</strong> যদি আপনি এই অনুরোধ না করে থাকেন, তাহলে অবিলম্বে আপনার অ্যাকাউন্টের নিরাপত্তা নিশ্চিত করুন এবং এই ইমেইলটি উপেক্ষা করুন।
            </div>

            <div class="help-text">
                <p><strong>সাহায্য প্রয়োজন?</strong></p>
                <p>যদি আপনার কোনো সমস্যা হয়, আমাদের সাথে যোগাযোগ করুন।</p>
            </div>
        </div>

        <div class="email-footer">
            <p><strong>AponKhoj</strong> - নিখোঁজ ব্যক্তিদের খোঁজার একটি নির্ভরযোগ্য প্ল্যাটফর্ম</p>
            <p style="margin: 10px 0;">© {{ date('Y') }} AponKhoj. সর্বস্বত্ব সংরক্ষিত।</p>
            <p style="font-size: 12px; color: #adb5bd;">
                এই ইমেইলটি স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে। অনুগ্রহ করে এই ইমেইলে উত্তর দেবেন না।
            </p>
        </div>
    </div>
</body>
</html>

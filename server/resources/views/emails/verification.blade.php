<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ইমেইল যাচাইকরণ - AponKhoj</title>
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
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
            color: #667eea;
            margin-top: 0;
        }
        .verification-code {
            background-color: #f8f9fa;
            border: 2px dashed #667eea;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
        }
        .code {
            font-size: 48px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 10px;
            font-family: 'Courier New', monospace;
        }
        .expiry-notice {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 12px 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .email-footer {
            background-color: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #6c757d;
            font-size: 14px;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background-color: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
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
            <p style="margin: 5px 0 0 0;">নিখোঁজ ব্যক্তি খোঁজার প্ল্যাটফর্ম</p>
        </div>
        
        <div class="email-body">
            <h2>আপনার ইমেইল যাচাই করুন</h2>
            
            <p>প্রিয় {{ $userName }},</p>
            
            <p>AponKhoj-এ আপনাকে স্বাগতম! আপনার অ্যাকাউন্ট সক্রিয় করতে নিচের যাচাইকরণ কোডটি ব্যবহার করুন:</p>
            
            <div class="verification-code">
                <div class="code">{{ $code }}</div>
                <p style="margin: 10px 0 0 0; color: #6c757d;">যাচাইকরণ কোড</p>
            </div>
            
            <div class="expiry-notice">
                <strong>⏰ গুরুত্বপূর্ণ:</strong> এই কোডটি ১৫ মিনিটের জন্য বৈধ থাকবে।
            </div>
            
            <p>যদি আপনি AponKhoj-এ নিবন্ধন না করে থাকেন, তাহলে এই ইমেইলটি উপেক্ষা করুন।</p>
            
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

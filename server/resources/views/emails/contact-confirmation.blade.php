<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <title>বার্তা পাওয়া গেছে</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, sans-serif;
            background-color: #f0f4f0;
            color: #333333;
            line-height: 1.7;
        }
        .email-wrap {
            max-width: 560px;
            margin: 32px auto;
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(31, 93, 61, 0.13), 0 2px 8px rgba(0,0,0,0.07);
        }
        /* Header */
        .header {
            background: linear-gradient(135deg, #1f5d3d 0%, #2e7d53 100%);
            padding: 36px 40px 28px;
            text-align: center;
        }
        .header .logo {
            font-size: 28px;
            font-weight: bold;
            color: #ffffff;
            letter-spacing: 0.5px;
        }
        .header .logo span {
            color: #a8d5b5;
        }
        .header .tagline {
            color: rgba(255,255,255,0.65);
            font-size: 13px;
            margin-top: 5px;
        }
        /* Body */
        .body {
            padding: 36px 40px 28px;
        }
        .greeting {
            font-size: 22px;
            font-weight: bold;
            color: #1f5d3d;
            margin-bottom: 14px;
        }
        .intro {
            font-size: 15px;
            color: #444;
            margin-bottom: 10px;
        }
        .intro-sub {
            font-size: 14px;
            color: #666;
            margin-bottom: 28px;
        }
        /* Message preview box */
        .message-box {
            background-color: #f5f8f5;
            border: 1px solid #d4e6d9;
            border-radius: 8px;
            padding: 18px 20px;
            margin-bottom: 28px;
        }
        .message-box-label {
            font-size: 11px;
            font-weight: 800;
            color: #1f5d3d;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 8px;
        }
        .message-box-text {
            font-size: 15px;
            font-style: italic;
            color: #1f5d3d;
            white-space: pre-wrap;
            line-height: 1.7;
        }
        /* Info line */
        .info-line {
            font-size: 14px;
            color: #555;
            margin-bottom: 10px;
        }
        .info-line strong {
            color: #222;
        }
        /* Divider */
        .divider {
            border: none;
            border-top: 1px solid #e8ede8;
            margin: 24px 0;
        }
        /* Sign off */
        .signoff {
            font-size: 14px;
            color: #555;
            margin-top: 20px;
        }
        .signoff strong {
            font-size: 15px;
            color: #1f5d3d;
            display: block;
            margin-top: 4px;
        }
        /* Footer */
        .footer {
            margin-top: 0;
            padding: 22px 40px;
            text-align: center;
            background: linear-gradient(135deg, #e8ede8 0%, #d4ddd4 100%);
            border-top: 1px solid #c8d4c8;
        }
        .footer p {
            font-size: 12px;
            color: #777;
        }
        .footer a {
            color: #1f5d3d;
            font-weight: bold;
            text-decoration: none;
        }
        .footer .copy {
            font-size: 11px;
            color: #aaa;
            margin-top: 6px;
        }
    </style>
</head>
<body>
    <div class="email-wrap">

        <div class="header">
            <div class="logo">🔍 <span>Apon</span>Khoj</div>
            <div class="tagline">আমাদের সাথে যোগাযোগ করার জন্য ধন্যবাদ</div>
        </div>

        <div class="body">
            <div class="greeting">প্রিয় {{ $contactName }},</div>
            <p class="intro">আপনার বার্তাটি আমরা সফলভাবে পেয়েছি। আমাদের টিম সাধারণত ২৪–৪৮ ঘণ্টার মধ্যে উত্তর দিয়ে থাকে।</p>
            <p class="intro-sub">আপনার পাঠানো বার্তার একটি কপি নিচে দেওয়া হলো:</p>

            <div class="message-box">
                <div class="message-box-label">আপনার বার্তা</div>
                <div class="message-box-text">"{{ $contactMessage }}"</div>
            </div>

            <div class="signoff">
                শুভেচ্ছায়,
                <strong>আপনখোঁজ টিম</strong>
            </div>
        </div>

        <div class="footer">
            <p>এই ইমেইলটি স্বয়ংক্রিয়ভাবে পাঠানো হয়েছে। অনুগ্রহ করে এই ইমেইলে উত্তর দেবেন না।</p>
            <p class="copy">© 2026 AponKhoj. সর্বস্বত্ব সংরক্ষিত।</p>
        </div>

    </div>
</body>
</html>

<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <title>নতুন যোগাযোগ</title>
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
            font-size: 26px;
            font-weight: bold;
            color: #ffffff;
            letter-spacing: 0.5px;
        }
        .header .logo span {
            color: #a8d5b5;
        }
        .header .tagline {
            color: rgba(255,255,255,0.65);
            font-size: 12px;
            margin-top: 4px;
        }
        /* Body */
        .body {
            padding: 32px 40px 28px;
        }
        .greeting {
            font-size: 20px;
            font-weight: bold;
            color: #1f5d3d;
            margin-bottom: 8px;
        }
        .subtitle {
            font-size: 14px;
            color: #666;
            margin-bottom: 28px;
        }
        /* Info rows — no boxes, just clean text */
        .info-item {
            margin-bottom: 18px;
        }
        .info-label {
            font-size: 13px;
            font-weight: 800;
            color: #1f5d3d;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 3px;
        }
        .info-value {
            font-size: 16px;
            color: #222;
        }
        .info-value a {
            color: #1f5d3d;
            text-decoration: none;
        }
        /* Message section */
        .message-section {
            margin-top: 18px;
        }
        .message-label {
            font-size: 13px;
            font-weight: 800;
            color: #1f5d3d;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            margin-bottom: 10px;
        }
        .message-text {
            font-size: 15px;
            color: #333;
            white-space: pre-wrap;
            line-height: 1.8;
        }
        /* Footer */
        .footer {
            margin-top: 32px;
            padding: 24px 40px 22px;
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
            <div class="tagline">নিখোঁজ ব্যক্তি খোঁজার প্ল্যাটফর্ম</div>
        </div>

        <div class="body">
            <div class="greeting">নতুন যোগাযোগ বার্তা</div>
            <div class="subtitle">কন্টাক্ট ফর্মের মাধ্যমে নিচের ব্যক্তি আপনাকে বার্তা পাঠিয়েছেন।</div>

            <div class="info-item">
                <div class="info-label">নাম</div>
                <div class="info-value">{{ $contactName }}</div>
            </div>

            <div class="info-item">
                <div class="info-label">ইমেইল</div>
                <div class="info-value"><a href="mailto:{{ $contactEmail }}">{{ $contactEmail }}</a></div>
            </div>

            <div class="info-item">
                <div class="info-label">ফোন</div>
                <div class="info-value"><a href="tel:{{ $contactPhone }}">{{ $contactPhone }}</a></div>
            </div>

            <div class="info-item">
                <div class="info-label">বিষয়</div>
                <div class="info-value">{{ $contactSubject }}</div>
            </div>

            <div class="message-section">
                <div class="message-label">বার্তা</div>
                <div class="message-text">{{ $contactMessage }}</div>
            </div>
        </div>

        <div class="footer">
            <p>এই বার্তাটি <a href="https://aponkhoj.com.bd">AponKhoj</a>-এর যোগাযোগ ফর্ম থেকে পাঠানো হয়েছে। অনুগ্রহ করে এই ইমেইলে সরাসরি উত্তর দেবেন না।</p>
            <p class="copy">© 2026 AponKhoj. সর্বস্বত্ব সংরক্ষিত।</p>
        </div>

    </div>
</body>
</html>
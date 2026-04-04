<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <title>নতুন যোগাযোগ</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background: white; padding: 20px; border-radius: 8px; }
        .header { background: #1f5d3d; color: white; padding: 20px; text-align: center; }
        .field { margin: 15px 0; padding: 10px; background: #f9f9f9; border-left: 4px solid #1f5d3d; }
        .label { font-weight: bold; color: #1f5d3d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>আপনখোঁজ - নতুন যোগাযোগ</h1>
        </div>
        
        <div class="field">
            <div class="label">নাম:</div>
            {{ $contactName }}
        </div>
        
        <div class="field">
            <div class="label">ইমেইল:</div>
            {{ $contactEmail }}
        </div>
        
        <div class="field">
            <div class="label">ফোন:</div>
            {{ $contactPhone }}
        </div>
        
        <div class="field">
            <div class="label">বিষয়:</div>
            {{ $contactSubject }}
        </div>
        
        <div class="field">
            <div class="label">বার্তা:</div>
            {{ $contactMessage }}
        </div>
    </div>
</body>
</html>
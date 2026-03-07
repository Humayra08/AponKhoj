import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle } from 'lucide-react';

const ContactPage = () => {
    const [submitted, setSubmitted] = useState(false);

    return (
        <div className="min-h-screen bg-background">
            {/* Hero */}
            <div className="bg-primary text-white py-16 px-4 text-center">
                <h1 className="text-4xl font-black mb-3">যোগাযোগ করুন</h1>
                <p className="text-white/80 max-w-md mx-auto text-sm">আমাদের সাথে যোগাযোগ করতে নিচের ফর্ম পূরণ করুন বা সরাসরি ফোন করুন</p>
            </div>

        </div>
    );
};

export default ContactPage;
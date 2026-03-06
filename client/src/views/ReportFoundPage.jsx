import { useState } from 'react';
import { Upload, MapPin, FileText, Zap } from 'lucide-react';

const ReportFoundPage = () => {
    const [photo, setPhoto] = useState(null);
    const [status, setStatus] = useState('healthy');

    return (
        <div className="min-h-screen bg-background py-10 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">উদ্ধারকৃত ব্যক্তির তথ্য যোগ করুন</h1>
                    <p className="text-gray-500 text-sm mt-1">AI ফেস রিকগনিশনের মাধ্যমে মিলিয়ে দেখা হবে</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">


                    <button className="w-full bg-accent-teal hover:bg-teal-800 text-white py-3 rounded-xl font-medium transition-colors">
                        তথ্য জমা দিন ও AI ম্যাচ খুঁজুন
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportFoundPage;
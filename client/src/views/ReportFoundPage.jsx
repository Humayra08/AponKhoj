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
                    {/* AI Photo Upload */}
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-base font-semibold text-gray-700">ছবি আপলোড করুন</h2>
                            <span className="bg-accent-teal/10 text-accent-teal text-xs px-2 py-0.5 rounded-full flex items-center gap-1"><Zap size={10} /> AI</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-3">ছবি আপলোড করলে AI স্বয়ংক্রিয়ভাবে মিল খুঁজবে</p>
                        <label className="border-2 border-dashed border-accent-teal/40 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-accent-teal/60 transition-colors bg-accent-teal/5">
                            <input type="file" accept="image/*" className="hidden" onChange={e => setPhoto(e.target.files[0])} />
                            {photo ? (
                                <p className="text-sm text-accent-teal font-medium">{photo.name}</p>
                            ) : (
                                <>
                                    <Upload size={32} className="text-accent-teal/40 mb-2" />
                                    <p className="text-sm text-gray-500">ছবি টেনে আনুন বা ক্লিক করুন</p>
                                    <p className="text-xs text-gray-400 mt-1">স্পষ্ট মুখের ছবি দিলে AI ভালো ফলাফল দেবে</p>
                                </>
                            )}
                        </label>
                    </div>

                    <button className="w-full bg-accent-teal hover:bg-teal-800 text-white py-3 rounded-xl font-medium transition-colors">
                        তথ্য জমা দিন ও AI ম্যাচ খুঁজুন
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportFoundPage;
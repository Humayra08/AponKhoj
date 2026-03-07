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

            <div className="max-w-6xl mx-auto px-4 py-14">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Contact Info */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-black text-gray-800 mb-6">আমাদের তথ্য</h2>
                            <div className="space-y-4">
                                {[
                                    { icon: Phone, label: 'জরুরি সহায়তা', value: '999 (পুলিশ)', sub: '১৬১২৩ (জাতীয় হেল্পলাইন)', color: 'text-accent-red bg-accent-red/10' },
                                    { icon: Phone, label: 'আপনখোঁজ হেল্পলাইন', value: '01712-345678', sub: 'সকাল ৮টা — রাত ১০টা', color: 'text-primary bg-primary/10' },
                                    { icon: Mail, label: 'ইমেইল', value: 'support@aponkhoj.com.bd', sub: 'সাধারণত ২৪ ঘণ্টার মধ্যে উত্তর', color: 'text-secondary bg-secondary/10' },
                                    { icon: MapPin, label: 'ঠিকানা', value: 'বাড়ি ১২, রোড ৫, ধানমন্ডি', sub: 'ঢাকা — ১২০৫, বাংলাদেশ', color: 'text-accent-teal bg-accent-teal/10' },
                                    { icon: Clock, label: 'অফিস সময়', value: 'রবি — বৃহস্পতিবার', sub: 'সকাল ৯টা — বিকাল ৬টা', color: 'text-gray-600 bg-gray-100' },
                                ].map(c => (
                                    <div key={c.label} className="flex items-start gap-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.color}`}>
                                            <c.icon size={18} />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 mb-0.5">{c.label}</p>
                                            <p className="font-bold text-gray-800 text-sm">{c.value}</p>
                                            <p className="text-xs text-gray-500">{c.sub}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Emergency Box */}
                        <div className="bg-accent-red/5 border border-accent-red/20 rounded-2xl p-5">
                            <h3 className="font-bold text-accent-red flex items-center gap-2 mb-2">
                                <Phone size={16} /> জরুরি পরিস্থিতিতে
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">নিখোঁজ হওয়ার ৪৮ ঘণ্টার মধ্যে পুলিশকে জানান।</p>
                            <a href="tel:999" className="text-3xl font-black text-accent-red">999</a>
                        </div>
                    </div>

                    
                        
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;
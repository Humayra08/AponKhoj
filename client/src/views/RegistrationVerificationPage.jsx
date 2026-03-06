import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, CheckCircle2 } from 'lucide-react';

export default function RegistrationVerificationPage() {
    const [step, setStep] = useState(1);
    const navigate = useNavigate();

    const handleVerify = (e) => {
        e.preventDefault();
        setStep(2);
        setTimeout(() => {
            navigate('/dashboard');
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
            <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">
                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 text-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
                            <Mail className="text-primary w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">ইমেইল যাচাই করুন</h1>
                        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                            আমরা আপনার ইমেইলে একটি 4-ডিজিটের ভেরিফিকেশন কোড পাঠিয়েছি। অনুগ্রহ করে কোডটি নিচে প্রবেশ করান।
                        </p>

                        <form onSubmit={handleVerify} className="space-y-6">
                            <div className="flex justify-center gap-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <input
                                        key={i}
                                        type="text"
                                        maxLength={1}
                                        required
                                        className="w-12 h-14 text-center text-xl font-bold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-gray-50 bg-white"
                                    />
                                ))}
                            </div>
                            <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white py-2.5 rounded-lg font-bold transition-all shadow-md shadow-primary/20">
                                যাচাই করুন
                            </button>
                        </form>

                        <div className="mt-6">
                            <p className="text-sm text-gray-500 mb-3">ইমেইল পাননি?</p>
                            <button className="text-sm font-bold text-primary hover:underline">
                                আবার কোড পাঠান
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-in fade-in zoom-in-95 duration-300 text-center py-6">
                        <div className="w-16 h-16 bg-accent-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="text-accent-teal w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">অভিনন্দন!</h1>
                        <p className="text-gray-500 text-sm leading-relaxed mb-6">
                            আপনার অ্যাকাউন্ট সফলভাবে যাচাই করা হয়েছে। আপনাকে ড্যাশবোর্ডে নিয়ে যাওয়া হচ্ছে...
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

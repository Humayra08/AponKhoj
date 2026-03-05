import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Phone, MapPin, Lock, Eye, EyeOff, Building2, Search } from 'lucide-react';

const RegistrationPage = () => {
    const [userType, setUserType] = useState('general');
    const [showPassword, setShowPassword] = useState(false);

    const districts = ['ঢাকা', 'চট্টগ্রাম', 'রাজশাহী', 'খুলনা', 'বরিশাল', 'সিলেট', 'রংপুর', 'ময়মনসিংহ'];

    return (
        <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
            <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center shadow-sm">
                            <Search size={16} className="text-white" />
                        </div>
                        <span className="font-bold text-lg text-primary tracking-tight">আপনখোঁজ</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">রেজিস্ট্রেশন করুন</h1>
                    <p className="text-gray-500 text-sm mt-1">নতুন অ্যাকাউন্ট তৈরি করুন</p>
                </div>

                {/* User Type Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                    <button
                        onClick={() => setUserType('general')}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${userType === 'general' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
                    >
                        সাধারণ ব্যবহারকারী
                    </button>
                    <button
                        onClick={() => setUserType('org')}
                        className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${userType === 'org' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}
                    >
                        অ্যাডমিন
                    </button>
                </div>

                <form className="space-y-4">
                    {/* পূর্ণ নাম — always shown */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">পূর্ণ নাম</label>
                        <div className="relative">
                            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="text" placeholder="আপনার পূর্ণ নাম লিখুন" className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                        </div>
                    </div>

                    {/* প্রতিষ্ঠানের নাম — only for admin */}
                    {userType === 'org' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">প্রতিষ্ঠানের নাম</label>
                            <div className="relative">
                                <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" placeholder="প্রতিষ্ঠান বা সংস্থার নাম" className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ফোন নম্বর</label>
                        <div className="relative">
                            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="tel" placeholder="01XXXXXXXXX" className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">জেলা</label>
                        <div className="relative">
                            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <select className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary appearance-none bg-white">
                                <option value="">জেলা নির্বাচন করুন</option>
                                {districts.map(d => <option key={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">পাসওয়ার্ড</label>
                        <div className="relative">
                            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white py-2.5 rounded-lg font-medium transition-colors mt-2">
                        রেজিস্ট্রেশন করুন
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-6">
                    ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
                    <Link to="/login" className="text-primary font-medium hover:underline">লগইন করুন</Link>
                </p>
            </div>
        </div>
    );
};

export default RegistrationPage;

import { useState } from 'react';
import { Upload, MapPin, FileText, Zap, User, Phone, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../api';
import { useAuth } from '../helpers/AuthContext';

const DISTRICTS = [
    'ঢাকা','চট্টগ্রাম','রাজশাহী','খুলনা','বরিশাল','সিলেট','রংপুর','ময়মনসিংহ',
    'নারায়ণগঞ্জ','গাজীপুর','কুমিল্লা','নোয়াখালী','ফেনী','লক্ষ্মীপুর','চাঁদপুর',
    'ব্রাহ্মণবাড়িয়া','হবিগঞ্জ','মৌলভীবাজার','সুনামগঞ্জ','কিশোরগঞ্জ','নেত্রকোনা',
    'ময়মনসিংহ','জামালপুর','শেরপুর','টাঙ্গাইল','মানিকগঞ্জ','মুন্সিগঞ্জ','নরসিংদী',
    'ফরিদপুর','গোপালগঞ্জ','মাদারীপুর','শরীয়তপুর','রাজবাড়ী','পাবনা','সিরাজগঞ্জ',
    'বগুড়া','নাটোর','চাঁপাইনবাবগঞ্জ','নওগাঁ','জয়পুরহাট','রাজশাহী','যশোর',
    'ঝিনাইদহ','মাগুরা','নড়াইল','সাতক্ষীরা','খুলনা','বাগেরহাট','ঝালকাঠি',
    'পিরোজপুর','বরগুনা','পটুয়াখালী','ভোলা','বরিশাল','লালমনিরহাট','কুড়িগ্রাম',
    'গাইবান্ধা','নীলফামারী','দিনাজপুর','ঠাকুরগাঁও','পঞ্চগড়','রংপুর',
    'কক্সবাজার','রাঙ্গামাটি','বান্দরবান','খাগড়াছড়ি',
];

const ReportFoundPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        approximate_age: '',
        gender: '',
        health_status: 'unknown',
        found_date: '',
        found_time: '',
        district: 'ঢাকা',
        address: '',
        physical_description: '',
        additional_info: '',
        contact_person_name: '',
        contact_phone: '',
    });

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => setPhotoPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            toast.error('রিপোর্ট জমা দিতে লগইন করুন');
            navigate('/login');
            return;
        }

        if (!formData.district.trim()) {
            toast.error('জেলা নির্বাচন করুন');
            return;
        }
        if (!formData.contact_person_name.trim()) {
            toast.error('যোগাযোগের নাম দিন');
            return;
        }
        if (!formData.contact_phone.trim()) {
            toast.error('ফোন নম্বর দিন');
            return;
        }

        setLoading(true);
        try {
            const fd = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== '') fd.append(key, formData[key]);
            });
            if (photo) fd.append('photo', photo);

            const response = await apiClient.post('/found-reports', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.success) {
                setSubmitted(true);
                toast.success('রিপোর্ট সফলভাবে জমা হয়েছে!');
            } else {
                toast.error(response.message || 'জমা দেওয়া ব্যর্থ হয়েছে');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'একটি সমস্যা হয়েছে');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl shadow-sm p-10 max-w-md w-full text-center">
                    <CheckCircle size={56} className="text-accent-teal mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">রিপোর্ট জমা হয়েছে!</h2>
                    <p className="text-gray-500 text-sm mb-2">আমাদের AI স্বয়ংক্রিয়ভাবে নিখোঁজ ব্যক্তিদের সাথে মিল খুঁজছে।</p>
                    <p className="text-gray-400 text-xs mb-6">অ্যাডমিন পর্যালোচনার পরে এটি প্রকাশিত হবে।</p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full bg-accent-teal text-white py-3 rounded-xl font-medium hover:bg-teal-800 transition-colors"
                    >
                        ড্যাশবোর্ডে যান
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-10 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-2xl font-bold text-gray-800">উদ্ধারকৃত ব্যক্তির তথ্য দিন</h1>
                        <span className="bg-accent-teal/10 text-accent-teal text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Zap size={10} /> AI Match
                        </span>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                        তথ্য জমা দিলে AI স্বয়ংক্রিয়ভাবে নিখোঁজ ব্যক্তিদের সাথে মিলিয়ে দেখবে
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
                    {/* Photo Upload */}
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h2 className="text-base font-semibold text-gray-700">ছবি আপলোড করুন</h2>
                            <span className="bg-accent-teal/10 text-accent-teal text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Zap size={10} /> AI
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mb-3">স্পষ্ট মুখের ছবি দিলে AI ভালো ফলাফল দেবে</p>
                        <label className="border-2 border-dashed border-accent-teal/40 rounded-xl p-6 flex flex-col items-center cursor-pointer hover:border-accent-teal/60 transition-colors bg-accent-teal/5">
                            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                            {photoPreview ? (
                                <img src={photoPreview} alt="preview" className="w-32 h-32 object-cover rounded-xl" />
                            ) : (
                                <>
                                    <Upload size={32} className="text-accent-teal/40 mb-2" />
                                    <p className="text-sm text-gray-500">ছবি টেনে আনুন বা ক্লিক করুন</p>
                                </>
                            )}
                        </label>
                    </div>

                    {/* Person Info */}
                    <div>
                        <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <User size={16} /> উদ্ধারকৃত ব্যক্তির তথ্য
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs text-gray-500 mb-1">নাম (যদি জানা থাকে)</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="নাম (ঐচ্ছিক)"
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">আনুমানিক বয়স</label>
                                <input
                                    type="number"
                                    name="approximate_age"
                                    value={formData.approximate_age}
                                    onChange={handleChange}
                                    placeholder="বয়স"
                                    min="0" max="150"
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">লিঙ্গ</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                                >
                                    <option value="">নির্বাচন করুন</option>
                                    <option value="male">পুরুষ</option>
                                    <option value="female">মহিলা</option>
                                    <option value="other">অন্যান্য</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Health Status */}
                    <div>
                        <h2 className="text-base font-semibold text-gray-700 mb-3">স্বাস্থ্য অবস্থা</h2>
                        <div className="flex gap-3">
                            {[
                                { val: 'healthy', label: 'সুস্থ' },
                                { val: 'sick', label: 'অসুস্থ' },
                                { val: 'unknown', label: 'অজানা' },
                            ].map(({ val, label }) => (
                                <button
                                    key={val}
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, health_status: val }))}
                                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                                        formData.health_status === val
                                            ? 'border-accent-teal bg-accent-teal/10 text-accent-teal'
                                            : 'border-gray-200 text-gray-500'
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Found Location */}
                    <div>
                        <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <MapPin size={16} /> উদ্ধারের স্থান ও সময়
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">তারিখ</label>
                                <input
                                    type="date"
                                    name="found_date"
                                    value={formData.found_date}
                                    onChange={handleChange}
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">সময়</label>
                                <input
                                    type="time"
                                    name="found_time"
                                    value={formData.found_time}
                                    onChange={handleChange}
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">জেলা *</label>
                                <select
                                    name="district"
                                    value={formData.district}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                                >
                                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">বিস্তারিত ঠিকানা</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    placeholder="এলাকা / থানা / স্থানের নাম"
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <FileText size={16} /> শারীরিক বিবরণ ও অতিরিক্ত তথ্য
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">শারীরিক বিবরণ (উচ্চতা, পোশাক, চিহ্ন)</label>
                                <textarea
                                    name="physical_description"
                                    value={formData.physical_description}
                                    onChange={handleChange}
                                    rows={2}
                                    placeholder="পোশাকের রং, উচ্চতা, বিশেষ চিহ্ন..."
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">অতিরিক্ত তথ্য</label>
                                <textarea
                                    name="additional_info"
                                    value={formData.additional_info}
                                    onChange={handleChange}
                                    rows={2}
                                    placeholder="অন্য যেকোনো গুরুত্বপূর্ণ তথ্য..."
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contact */}
                    <div>
                        <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <Phone size={16} /> যোগাযোগের তথ্য
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">নাম / প্রতিষ্ঠান *</label>
                                <input
                                    type="text"
                                    name="contact_person_name"
                                    value={formData.contact_person_name}
                                    onChange={handleChange}
                                    required
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">ফোন নম্বর *</label>
                                <input
                                    type="tel"
                                    name="contact_phone"
                                    value={formData.contact_phone}
                                    onChange={handleChange}
                                    required
                                    placeholder="01XXXXXXXXX"
                                    className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                        </div>
                    </div>

                    {!user && (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <AlertCircle size={16} className="text-amber-500 shrink-0" />
                            <p className="text-xs text-amber-700">রিপোর্ট জমা দিতে অনুগ্রহ করে <a href="/login" className="underline font-medium">লগইন করুন</a>।</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-accent-teal hover:bg-teal-800 disabled:opacity-60 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                জমা দেওয়া হচ্ছে ও AI ম্যাচ খোঁজা হচ্ছে...
                            </>
                        ) : (
                            <>
                                <Zap size={16} />
                                তথ্য জমা দিন ও AI ম্যাচ খুঁজুন
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ReportFoundPage;
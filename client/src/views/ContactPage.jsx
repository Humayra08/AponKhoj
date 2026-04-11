import { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle, AlertCircle } from 'lucide-react';
import apiClient from '../api';
import toast from 'react-hot-toast';

const ContactPage = () => {
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
    });

    const [fieldErrors, setFieldErrors] = useState({});

    const validateForm = () => {
        const errs = {};

        if (!formData.name.trim()) {
            errs.name = 'নাম প্রদান করুন।';
        }

        // Email: must match standard pattern
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email.trim()) {
            errs.email = 'ইমেইল প্রদান করুন।';
        } else if (!emailRegex.test(formData.email.trim())) {
            errs.email = 'সঠিক ইমেইল ঠিকানা দিন (যেমন: example@mail.com)';
        }

        // Phone: Bangladesh format — 01[3-9]XXXXXXXX (exactly 11 digits)
        const phoneRegex = /^01[3-9]\d{8}$/;
        if (!formData.phone.trim()) {
            errs.phone = 'ফোন নম্বর প্রদান করুন।';
        } else if (!phoneRegex.test(formData.phone.trim())) {
            errs.phone = 'সঠিক বাংলাদেশি নম্বর দিন (01XXXXXXXXX, ১১ সংখ্যা)';
        }

        if (!formData.subject) {
            errs.subject = 'বিষয় নির্বাচন করুন।';
        }

        if (!formData.message.trim()) {
            errs.message = 'বার্তা লিখুন।';
        }

        setFieldErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Restrict phone field to digits only
        if (name === 'phone' && value !== '' && !/^\d*$/.test(value)) return;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
        // Clear field error on change
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: '' }));
        }
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);
        setError('');

        try {
            const response = await apiClient.post('/contact', formData);

            if (response.success) {
                setSubmitted(true);
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    subject: '',
                    message: '',
                });
                toast.success('বার্তা সফলভাবে পাঠানো হয়েছে!');

                // Reset form after 3 seconds
                setTimeout(() => {
                    setSubmitted(false);
                }, 3000);
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || 'বার্তা পাঠাতে ত্রুটি হয়েছে। দয়া করে পরে চেষ্টা করুন।';
            setError(errorMsg);
            toast.error(errorMsg);
            console.error('Contact form error:', err);
        } finally {
            setLoading(false);
        }
    };

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
                                    { icon: Phone, label: 'আপনখোঁজ হেল্পলাইন', value: '01842-685725', sub: 'সকাল ৮টা — রাত ১০টা', color: 'text-primary bg-primary/10' },
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

                    {/* Contact Form */}
                    <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
                        {submitted ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-10">
                                <div className="w-16 h-16 bg-accent-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle size={32} className="text-accent-teal" />
                                </div>
                                <h2 className="text-xl font-black text-gray-800 mb-2">বার্তা পাঠানো হয়েছে!</h2>
                                <p className="text-gray-500 text-sm">আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।</p>
                            </div>
                        ) : (
                            <>
                                <h2 className="text-2xl font-black text-gray-800 mb-6">বার্তা পাঠান</h2>

                                {error && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                        <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-red-700">{error}</p>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">আপনার নাম</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="পূর্ণ নাম"
                                                className={`w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${fieldErrors.name ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                                            />
                                            {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">ফোন নম্বর</label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="01XXXXXXXXX"
                                                maxLength={11}
                                                className={`w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${fieldErrors.phone ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                                            />
                                            {fieldErrors.phone && <p className="text-xs text-red-500 mt-1">{fieldErrors.phone}</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">ইমেইল</label>
                                        <input
                                            type="text"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="email@example.com"
                                            className={`w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${fieldErrors.email ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                                        />
                                        {fieldErrors.email && <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">বিষয়</label>
                                        <select
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            className={`w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white ${fieldErrors.subject ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                                        >
                                            <option value="">বিষয় নির্বাচন করুন</option>
                                            <option value="নিখোঁজ রিপোর্ট সহায়তা">নিখোঁজ রিপোর্ট সহায়তা</option>
                                            <option value="প্রযুক্তিগত সমস্যা">প্রযুক্তিগত সমস্যা</option>
                                            <option value="অংশীদারিত্ব">অংশীদারিত্ব</option>
                                            <option value="সাধারণ জিজ্ঞাসা">সাধারণ জিজ্ঞাসা</option>
                                        </select>
                                        {fieldErrors.subject && <p className="text-xs text-red-500 mt-1">{fieldErrors.subject}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">বার্তা</label>
                                        <textarea
                                            name="message"
                                            value={formData.message}
                                            onChange={handleChange}
                                            rows={4}
                                            placeholder="আপনার বার্তা লিখুন..."
                                            className={`w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none ${fieldErrors.message ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
                                        />
                                        {fieldErrors.message && <p className="text-xs text-red-500 mt-1">{fieldErrors.message}</p>}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                পাঠানো হচ্ছে...
                                            </>
                                        ) : (
                                            <>
                                                <Send size={16} /> বার্তা পাঠান
                                            </>
                                        )}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;
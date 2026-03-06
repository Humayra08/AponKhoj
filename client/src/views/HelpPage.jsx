import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Search, Phone, Mail, FileText, Users, Shield,
    ChevronDown, ChevronUp, AlertTriangle, BookOpen,
    Zap, CheckCircle, ArrowRight
} from 'lucide-react';

const FAQS = [
    {
        q: 'কীভাবে নিখোঁজ ব্যক্তির রিপোর্ট করব?',
        a: 'উপরের মেনু থেকে "নিখোঁজ রিপোর্ট করুন" বাটনে ক্লিক করুন। প্রয়োজনীয় তথ্য যেমন নাম, বয়স, শেষ দেখার স্থান, ছবি ইত্যাদি পূরণ করে সাবমিট করুন। রিপোর্ট জমার পর আমাদের টিম ২৪ ঘণ্টার মধ্যে যাচাই করবে।'
    },
    {
        q: 'AI ফেস রিকগনিশন কীভাবে কাজ করে?',
        a: 'আপনি যখন ছবি আপলোড করেন, আমাদের AI সিস্টেম ডেটাবেজের সকল রিপোর্টের সাথে ফেস ম্যাচিং করে। মিল পাওয়া গেলে পরিবারকে তাৎক্ষণিক SMS ও ইমেইলে জানানো হয়। প্রযুক্তিটি সম্পূর্ণ গোপনীয় ও সুরক্ষিত।'
    },
    {
        q: 'রিপোর্ট করতে কি রেজিস্ট্রেশন বাধ্যতামূলক?',
        a: 'না। তবে রেজিস্ট্রেশন করলে আপনি আপনার জমা দেওয়া রিপোর্ট ট্র্যাক করতে পারবেন এবং যেকোনো আপডেট তাৎক্ষণিক পাবেন। এছাড়া রেজিস্ট্রেশন করলে আপনার তথ্য যাচাই দ্রুত হয়।'
    },
    {
        q: 'কত দিনের মধ্যে রিপোর্ট যাচাই করা হয়?',
        a: 'সাধারণত ২৪ ঘণ্টার মধ্যে। তবে জরুরি ক্ষেত্রে (যেমন শিশু নিখোঁজ) আমরা ১-২ ঘণ্টার মধ্যে যাচাই করি এবং অ্যালার্ট পাঠাই।'
    },
    {
        q: 'আমি কি একাধিক রিপোর্ট করতে পারি?',
        a: 'হ্যাঁ, আপনি একাধিক নিখোঁজ বা উদ্ধার রিপোর্ট করতে পারেন। প্রতিটি রিপোর্ট আলাদাভাবে যাচাই করা হয়।'
    },
    {
        q: 'যদি আমার রিপোর্ট ভুলভাবে তথ্য থাকে?',
        a: 'আপনার প্রোফাইলে গিয়ে "আমার রিপোর্ট" সেকশনে ক্লিক করুন এবং "সম্পাদনা করুন" অপশন ব্যবহার করে তথ্য আপডেট করুন। অথবা আমাদের support@aponkhoj.com.bd তে ইমেইল করুন।'
    },
    {
        q: 'আমি কি নিজের পরিচিত কাউকে খুঁজতে সাহায্য করতে পারি?',
        a: 'হ্যাঁ! আপনি নিখোঁজ রিপোর্টগুলো শেয়ার করতে পারেন এবং যদি কোনো নিখোঁজ ব্যক্তিকে দেখেন তাহলে রিপোর্টে ক্লিক করে "তথ্য দিন" বাটনে ক্লিক করুন।'
    },
    {
        q: 'আমার তথ্য কি নিরাপদ?',
        a: 'হ্যাঁ, আপনার সকল তথ্য এনক্রিপ্ট করা এবং সম্পূর্ণ গোপনীয়। আমরা শুধুমাত্র নিখোঁজ ব্যক্তি খোঁজার জন্য তথ্য ব্যবহার করি এবং তৃতীয় পক্ষের সাথে শেয়ার করি না।'
    },
];

const QUICK_ACTIONS = [
    { icon: FileText, label: 'নিখোঁজ রিপোর্ট করুন', link: '/report/missing', color: 'bg-primary text-white' },
    { icon: Users, label: 'উদ্ধার তথ্য দিন', link: '/report/found', color: 'bg-secondary text-white' },
    { icon: Search, label: 'অনুসন্ধান করুন', link: '/search', color: 'bg-accent-teal text-white' },
    { icon: Phone, label: 'জরুরি যোগাযোগ', link: '/contact', color: 'bg-accent-red text-white' },
];

const RESOURCES = [
    { icon: BookOpen, title: 'গাইড ডাউনলোড করুন', desc: 'নিখোঁজ ব্যক্তি খোঁজার সম্পূর্ণ গাইড (PDF)', link: '#' },
    { icon: Shield, title: 'আইনি সহায়তা', desc: 'পুলিশ ও আইনি প্রক্রিয়া সম্পর্কে জানুন', link: '#' },
    { icon: AlertTriangle, title: 'সতর্কতা টিপস', desc: 'নিখোঁজ প্রতিরোধে সচেতনতা', link: '#' },
];

const HelpPage = () => {
    const [openIndex, setOpenIndex] = useState(null);

    return (
        <div className="min-h-screen bg-background">
            {/* Hero */}
            <div className="bg-gradient-to-r from-primary to-secondary text-white py-16 px-4 text-center">
                <Zap size={48} className="mx-auto mb-4 opacity-90" />
                <h1 className="text-4xl font-black mb-3">সহায়তা কেন্দ্র</h1>
                <p className="text-white/80 max-w-xl mx-auto text-sm">
                    আপনার যেকোনো প্রশ্ন বা সমস্যার উত্তর খুঁজে পান
                </p>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-12">
                {/* Quick Actions */}
                <div className="mb-12">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">দ্রুত অ্যাকশন</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {QUICK_ACTIONS.map((action, i) => {
                            const Icon = action.icon;
                            return (
                                <Link
                                    key={i}
                                    to={action.link}
                                    className={`${action.color} rounded-xl p-6 flex flex-col items-center gap-3 hover:scale-105 transition-transform shadow-sm`}
                                >
                                    <Icon size={28} />
                                    <span className="text-sm font-semibold text-center">{action.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* FAQs */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">সচরাচর জিজ্ঞাসা (FAQ)</h2>
                    <div className="space-y-3">
                        {FAQS.map((faq, i) => (
                            <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                                <button
                                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                    className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                    <span className="font-semibold text-gray-800 text-sm pr-4">{faq.q}</span>
                                    {openIndex === i ? (
                                        <ChevronUp size={18} className="text-primary flex-shrink-0" />
                                    ) : (
                                        <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
                                    )}
                                </button>
                                {openIndex === i && (
                                    <div className="px-6 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Resources */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">সহায়ক সম্পদ</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {RESOURCES.map((res, i) => {
                            const Icon = res.icon;
                            return (
                                <a
                                    key={i}
                                    href={res.link}
                                    className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow border border-gray-100 group"
                                >
                                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                        <Icon size={24} className="text-primary" />
                                    </div>
                                    <h3 className="font-bold text-gray-800 mb-2 text-sm">{res.title}</h3>
                                    <p className="text-xs text-gray-500 mb-3">{res.desc}</p>
                                    <div className="flex items-center gap-1 text-primary text-xs font-medium">
                                        আরও জানুন <ArrowRight size={14} />
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                </div>

                {/* Contact CTA */}
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 text-center">
                    <CheckCircle size={40} className="mx-auto mb-4 text-primary" />
                    <h3 className="text-xl font-bold text-gray-800 mb-2">এখনও সমাধান পাননি?</h3>
                    <p className="text-gray-600 text-sm mb-6">
                        আমাদের সাপোর্ট টিম ২৪/৭ আপনাকে সাহায্য করতে প্রস্তুত
                    </p>
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <Link
                            to="/contact"
                            className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors inline-flex items-center gap-2"
                        >
                            <Mail size={16} />
                            আমাদের সাথে যোগাযোগ করুন
                        </Link>
                        <a
                            href="tel:999"
                            className="border border-primary text-primary px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/5 transition-colors inline-flex items-center gap-2"
                        >
                            <Phone size={16} />
                            জরুরি: 999
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpPage;
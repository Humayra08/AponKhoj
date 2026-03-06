import { FileText, CheckCircle, XCircle, AlertTriangle, Mail, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';

const TERMS = [
    {
        icon: CheckCircle,
        title: 'গ্রহণযোগ্য ব্যবহার',
        color: 'text-accent-teal bg-accent-teal/10',
        content: [
            'শুধুমাত্র প্রকৃত নিখোঁজ বা উদ্ধার হওয়া ব্যক্তির তথ্য জমা দিন।',
            'সঠিক ও যাচাইযোগ্য তথ্য প্রদান করুন।',
            'উদ্ধারকৃত ব্যক্তির পরিচয় নিশ্চিত হওয়ার পর দ্রুত আম���দের জানান।',
            'অন্য ব্যবহারকারীদের সাথে সম্মান ও সহযোগিতার মনোভাবে যোগাযোগ করুন।',
        ],
    },
    {
        icon: XCircle,
        title: 'নিষিদ্ধ কার্যক্রম',
        color: 'text-accent-red bg-accent-red/10',
        content: [
            'মিথ্যা বা বানোয়াট নিখোঁজ রিপোর্ট তৈরি করা।',
            'অন্যের ব্যক্তিগত তথ্য বা ছবি অনুমতি ছাড়া আপলোড করা।',
            'প্ল্যাটফর্মকে প্রতারণা, হয়রানি বা যেকোনো অবৈধ কাজে ব্যবহার করা।',
            'স্বয়ংক্রিয় বট বা স্ক্রিপট দিয়ে ডেটা সংগ্রহ বা স্প্যাম করা।',
            'অন্যের অ্যাকাউন্ট হ্যাক বা অনুপ্রবেশের চেষ্টা করা।',
        ],
    },
    {
        icon: AlertTriangle,
        title: 'দায়মুক্তি',
        color: 'text-yellow-600 bg-yellow-50',
        content: [
            'আপনখোঁজ একটি প্রযুক্তি প্ল্যাটফর্ম যা তথ্য সংগ্রহ ও প্রচারে সহায়তা করে। আমরা তথ্যের সত্যতা নিশ্চিত করতে চেষ্টা করি, কিন্তু ১০০% গ্যারান্টি দিতে পারি না।',
            'ব্যবহারকারীর জমা দেওয়া তথ্যের দায়ভার সম্পূর্ণভাবে ব্যবহারকারীর।',
            'AI ফেস ম্যাচিং একটি সহায়ক প্রযুক্তি, কিন্তু চূড়ান্ত সিদ্ধান্ত নেওয়ার আগে অবশ্যই যাচাই করুন।',
            'প্ল্যাটফর্ম ব্যবহারের কারণে সৃষ্ট যেকোনো ক্ষতির জন্য আপনখোঁজ দায়ী নয়।',
        ],
    },
    {
        icon: Scale,
        title: 'গোপনীয়তা নীতি',
        color: 'text-secondary bg-secondary/10',
        content: [
            'আপনার ব্যক্তিগত তথ্য সম্পূর্ণ গোপনীয় রাখা হবে এবং তৃতীয় পক্ষের সাথে শেয়ার করা হবে না।',
            'ছবি এবং তথ্য শুধুমাত্র নিখোঁজ ব্যক্তি খোঁজার উদ্দেশ্যে ব্যবহার করা হবে।',
            'আইন প্রয়োগকারী সংস্থার অনুরোধে প্রয়োজনে তথ্য শেয়ার করা হতে পারে।',
            'আপনার তথ্য যেকোনো সময় আপডেট বা মুছে ফেলার অধিকার আপনার আছে।',
        ],
    },
];

const TermsPage = () => (
    <div className="min-h-screen bg-background">
        {/* Hero */}
        <div className="bg-primary text-white py-16 px-4 text-center">
            <FileText size={48} className="mx-auto mb-4 opacity-90" />
            <h1 className="text-4xl font-black mb-3">ব্যবহারের শর্তাবলী</h1>
            <p className="text-white/80 max-w-xl mx-auto text-sm">
                আপনখোঁজ ব্যবহার করার আগে অনুগ্রহ করে নিচের নিয়ম ও শর্তাবলী মনোযোগ দিয়ে পড়ুন
            </p>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
            {/* Terms Sections */}
            {TERMS.map((section, i) => {
                const Icon = section.icon;
                return (
                    <div key={i} className="bg-white rounded-2xl shadow-sm p-8 border-l-4 border-primary/20">
                        <div className="flex items-start gap-4 mb-5">
                            <div className={`w-12 h-12 rounded-xl ${section.color} flex items-center justify-center flex-shrink-0`}>
                                <Icon size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">{section.title}</h2>
                            </div>
                        </div>
                        <ul className="space-y-3 ml-16">
                            {section.content.map((item, j) => (
                                <li key={j} className="flex items-start gap-3 text-gray-600 text-sm leading-relaxed">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            })}

            {/* Agreement Section */}
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-8 text-center">
                <h3 className="text-lg font-bold text-gray-800 mb-3">সম্মতি</h3>
                <p className="text-gray-600 text-sm mb-6 max-w-2xl mx-auto">
                    এই প্ল্যাটফর্ম ব্যবহার করার মাধ্যমে আপনি উপরের সকল শর্তাবলী মেনে নিতে সম্মত হচ্ছেন। যদি কোনো শর্ত মানতে অসম্মত থাকেন, অনুগ্রহ করে এই প্ল্যাটফর্ম ব্যবহার থেকে বিরত থাকুন।
                </p>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                    <Link
                        to="/"
                        className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
                    >
                        হোমপেজে ফিরে যান
                    </Link>
                    <Link
                        to="/contact"
                        className="flex items-center gap-2 text-primary text-sm font-medium hover:underline"
                    >
                        <Mail size={16} />
                        যোগাযোগ করুন
                    </Link>
                </div>
            </div>

            {/* Last Updated */}
            <p className="text-center text-xs text-gray-400">
                সর্বশেষ আপডেট: ৬ ���ার্চ, ২০২৬
            </p>
        </div>
    </div>
);

export default TermsPage;
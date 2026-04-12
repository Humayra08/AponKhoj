import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    Heart, MapPin, Calendar, ArrowLeft, BookOpen,
    Loader2, Star, Share2, User
} from 'lucide-react';
import apiClient from '../api';

function formatDate(dateStr) {
    if (!dateStr) return null;
    try {
        return new Intl.DateTimeFormat('bn-BD', {
            day: 'numeric', month: 'long', year: 'numeric',
        }).format(new Date(dateStr));
    } catch {
        return dateStr;
    }
}

export default function SuccessStoryDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [story, setStory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        (async () => {
            setLoading(true);
            setError(false);
            try {
                const data = await apiClient.get(`/success-stories/${id}`);
                setStory(data);
            } catch {
                setError(true);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={40} className="animate-spin text-primary mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">গল্প লোড হচ্ছে...</p>
                </div>
            </div>
        );
    }

    if (error || !story) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center px-4">
                    <BookOpen size={48} className="text-gray-200 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-700 mb-2">গল্পটি পাওয়া যায়নি</h2>
                    <p className="text-sm text-gray-400 mb-5">এই গল্পটি হয়তো মুছে ফেলা হয়েছে বা প্রকাশিত হয়নি।</p>
                    <Link to="/success-stories"
                        className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors">
                        <ArrowLeft size={14} /> সব গল্পে ফিরুন
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero image */}
            <div className="relative w-full bg-gray-900" style={{ height: '340px' }}>
                {story.cover_image_url ? (
                    <img
                        src={story.cover_image_url}
                        alt={story.title}
                        className="w-full h-full object-cover opacity-80"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/40">
                        <BookOpen size={64} className="text-primary/30" />
                    </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/30 to-transparent" />

                {/* Back button */}
                <div className="absolute top-4 left-4 sm:left-8">
                    <button onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur rounded-xl text-sm font-semibold text-gray-700 hover:bg-white transition-colors shadow">
                        <ArrowLeft size={14} /> ফিরুন
                    </button>
                </div>

                {/* Hero text */}
                <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-8">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            {story.featured && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-400 text-amber-900">
                                    <Star size={11} fill="currentColor" /> বৈশিষ্ট্যযুক্ত গল্প
                                </span>
                            )}
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-green-500 text-white">
                                {story.tag || 'পুনর্মিলিত'}
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                            {story.title}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8">

                {/* Meta info card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <User size={14} className="text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">ব্যক্তি</p>
                                <p className="font-bold text-gray-800">
                                    {story.person_name}
                                    {story.person_age && (
                                        <span className="font-normal text-gray-500 ml-1">({story.person_age} বছর)</span>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                                <MapPin size={14} className="text-blue-500" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">অবস্থান</p>
                                <p className="font-bold text-gray-800">
                                    {story.division}{story.district ? `, ${story.district}` : ''}
                                </p>
                            </div>
                        </div>

                        {story.found_date && (
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                                    <Heart size={14} className="text-green-500" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">পুনর্মিলন</p>
                                    <p className="font-bold text-gray-800">{formatDate(story.found_date)}</p>
                                </div>
                            </div>
                        )}

                        {story.missing_date && (
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                                    <Calendar size={14} className="text-red-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">নিখোঁজের তারিখ</p>
                                    <p className="font-bold text-gray-800">{formatDate(story.missing_date)}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Excerpt */}
                {story.excerpt && (
                    <p className="text-base text-gray-600 italic leading-relaxed mb-6 border-l-4 border-primary/30 pl-4">
                        {story.excerpt}
                    </p>
                )}

                {/* Full story */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
                    <h2 className="text-sm font-black text-gray-500 uppercase tracking-wider mb-4">সম্পূর্ণ গল্প</h2>
                    <div className="text-gray-700 leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
                        {story.story}
                    </div>
                </div>

                {/* Timeline summary */}
                {story.missing_date && story.found_date && (
                    <div className="bg-green-50 border border-green-100 rounded-2xl px-6 py-4 mb-6 flex items-start gap-3">
                        <span className="text-2xl flex-shrink-0">🎉</span>
                        <p className="text-green-800 font-medium text-sm leading-relaxed">
                            {formatDate(story.missing_date)} তারিখে নিখোঁজ হয়ে{' '}
                            {formatDate(story.found_date)} তারিখে সফলভাবে পরিবারের কাছে ফিরে এসেছেন।
                        </p>
                    </div>
                )}

                {/* Bottom nav */}
                <div className="flex items-center justify-between pt-2">
                    <Link to="/success-stories"
                        className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary transition-colors">
                        <ArrowLeft size={14} /> সব সাফল্যের গল্প
                    </Link>
                    <button
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({ title: story.title, url: window.location.href });
                            } else {
                                navigator.clipboard.writeText(window.location.href).then(() => {
                                    alert('লিংক কপি হয়েছে!');
                                });
                            }
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                        <Share2 size={14} /> শেয়ার করুন
                    </button>
                </div>
            </div>
        </div>
    );
}

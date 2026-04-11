import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    Heart, Search, MapPin, Calendar, ChevronRight,
    ArrowRight, Star, Filter, X, BookOpen, Loader2
} from 'lucide-react';
import apiClient from '../api';

const DIVISIONS = [
    'ঢাকা', 'চট্টগ্রাম', 'রাজশাহী', 'খুলনা',
    'বরিশাল', 'সিলেট', 'রংপুর', 'ময়মনসিংহ',
];

// ── Format Bangla date ───────────────────────────────────────────────
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

// ── Story Card ───────────────────────────────────────────────────────
function StoryCard({ story, featured = false }) {
    return (
        <Link to={`/success-stories/${story.id}`}
            className={`group block bg-white rounded-2xl border border-gray-100 overflow-hidden
                        hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200
                        ${featured ? 'ring-2 ring-amber-200' : ''}`}>
            {/* Image */}
            <div className="relative overflow-hidden bg-gray-100"
                style={{ height: featured ? '240px' : '180px' }}>
                {story.cover_image_url ? (
                    <img src={story.cover_image_url} alt={story.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                        <BookOpen size={40} className="text-primary/30" />
                    </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                    {featured && (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-400 text-amber-900">
                            <Star size={10} fill="currentColor" /> বৈশিষ্ট্যযুক্ত
                        </span>
                    )}
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-500 text-white">
                        {story.tag || 'পুনর্মিলিত'}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                    <MapPin size={11} />
                    <span>{story.division}{story.district ? `, ${story.district}` : ''}</span>
                    {story.found_date && (
                        <>
                            <span>•</span>
                            <Calendar size={11} />
                            <span>{formatDate(story.found_date)}</span>
                        </>
                    )}
                </div>

                <h3 className={`font-bold text-gray-800 leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-2
                    ${featured ? 'text-base' : 'text-sm'}`}>
                    {story.title}
                </h3>

                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-3">
                    {story.excerpt}
                </p>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <Heart size={11} className="text-primary" />
                        </div>
                        <span className="text-xs font-semibold text-gray-600">{story.person_name}</span>
                        {story.person_age && (
                            <span className="text-xs text-gray-400">· {story.person_age} বছর</span>
                        )}
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold text-primary group-hover:gap-2 transition-all">
                        পড়ুন <ArrowRight size={12} />
                    </span>
                </div>
            </div>
        </Link>
    );
}

// ── Story Detail Modal ───────────────────────────────────────────────
function StoryDetailModal({ storyId, onClose }) {
    const [story, setStory]   = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const data = await apiClient.get(`/success-stories/${storyId}`);
                setStory(data);
            } catch {
                onClose();
            } finally {
                setLoading(false);
            }
        })();
    }, [storyId]);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col">
                {loading || !story ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 size={28} className="animate-spin text-primary" />
                    </div>
                ) : (
                    <>
                        {/* Cover */}
                        <div className="relative h-56 bg-gray-100 flex-shrink-0 rounded-t-2xl overflow-hidden">
                            {story.cover_image_url ? (
                                <img src={story.cover_image_url} alt={story.title}
                                    className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                                    <BookOpen size={48} className="text-primary/20" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <button onClick={onClose}
                                className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors">
                                <X size={16} className="text-gray-600" />
                            </button>
                            <div className="absolute bottom-4 left-4 right-4">
                                <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-green-500 text-white mb-2">
                                    {story.tag}
                                </span>
                                <h2 className="text-white font-black text-lg leading-snug">{story.title}</h2>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="overflow-y-auto flex-1 px-6 py-5">
                            {/* Meta */}
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-5 pb-4 border-b border-gray-100">
                                <span className="flex items-center gap-1"><Heart size={12} className="text-primary" /> {story.person_name}</span>
                                {story.person_age && <span>{story.person_age} বছর</span>}
                                <span className="flex items-center gap-1"><MapPin size={12} /> {story.division}</span>
                                {story.found_date && (
                                    <span className="flex items-center gap-1">
                                        <Calendar size={12} /> {formatDate(story.found_date)}
                                    </span>
                                )}
                            </div>

                            {/* Story text */}
                            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">
                                {story.story}
                            </div>

                            {/* Duration */}
                            {story.missing_date && story.found_date && (
                                <div className="mt-5 bg-green-50 rounded-xl px-4 py-3 text-sm text-green-700 font-medium">
                                    🎉 {formatDate(story.missing_date)} থেকে {formatDate(story.found_date)} — সফলভাবে পুনর্মিলিত
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ── Main Page ────────────────────────────────────────────────────────
export default function SuccessStoriesPage() {
    const [stories, setStories]     = useState([]);
    const [meta, setMeta]           = useState({ total: 0, last_page: 1 });
    const [loading, setLoading]     = useState(true);
    const [page, setPage]           = useState(1);
    const [search, setSearch]       = useState('');
    const [division, setDivision]   = useState('');
    const [activeStoryId, setActiveStoryId] = useState(null);

    const fetchStories = useCallback(async (p = 1, q = search, div = division) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: p });
            if (q)   params.set('search', q);
            if (div) params.set('division', div);
            const data = await apiClient.get(`/success-stories?${params}`);
            setStories(data.data || []);
            setMeta({ total: data.total || 0, last_page: data.last_page || 1 });
            setPage(p);
        } catch {
            // toasted by apiClient
        } finally {
            setLoading(false);
        }
    }, [search, division]);

    useEffect(() => { fetchStories(1, search, division); }, [search, division]);

    const featured = stories.filter(s => s.featured);
    const regular  = stories.filter(s => !s.featured);

    return (
        <div className="min-h-screen bg-gray-50">

            {/* Hero Banner */}
            <div className="bg-gradient-to-br from-primary to-primary/80 text-white">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 text-center">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-1.5 rounded-full text-sm font-semibold mb-5">
                        <Heart size={14} fill="currentColor" /> পুনর্মিলনের অনুপ্রেরণামূলক গল্প
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black mb-4 leading-tight">
                        সাফল্যের গল্প
                    </h1>
                    <p className="text-base text-white/80 max-w-xl mx-auto mb-8">
                        আপনখোঁজের মাধ্যমে নিখোঁজ হওয়া প্রিয়জনদের পুনরায় পরিবারে ফিরে আসার সত্যিকারের গল্পগুলো পড়ুন।
                    </p>

                    {/* Search bar */}
                    <div className="max-w-md mx-auto relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="নাম বা গল্পের বিষয় খুঁজুন..."
                            className="w-full pl-11 pr-4 py-3 rounded-2xl text-sm text-gray-800 bg-white shadow-lg outline-none focus:ring-2 focus:ring-white/50 placeholder-gray-400" />
                        {search && (
                            <button onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

                {/* Division filter chips */}
                <div className="flex gap-2 flex-wrap mb-8">
                    <button onClick={() => setDivision('')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors border
                            ${!division ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'}`}>
                        সব বিভাগ
                    </button>
                    {DIVISIONS.map(d => (
                        <button key={d} onClick={() => setDivision(d === division ? '' : d)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors border
                                ${division === d ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary'}`}>
                            {d}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                                <div className="h-44 bg-gray-100" />
                                <div className="p-4 space-y-2">
                                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                                    <div className="h-4 bg-gray-100 rounded w-full" />
                                    <div className="h-3 bg-gray-100 rounded w-5/6" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : stories.length === 0 ? (
                    <div className="text-center py-20">
                        <BookOpen size={48} className="text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-500 font-semibold text-lg">কোনো গল্প পাওয়া যায়নি</p>
                        <p className="text-sm text-gray-400 mt-2">অনুসন্ধান পরিবর্তন করে আবার চেষ্টা করুন</p>
                        {(search || division) && (
                            <button onClick={() => { setSearch(''); setDivision(''); }}
                                className="mt-4 px-5 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors">
                                ফিল্টার সরান
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Featured stories */}
                        {featured.length > 0 && (
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <Star size={15} className="text-amber-500" fill="currentColor" />
                                    <h2 className="text-sm font-black text-gray-700 uppercase tracking-wider">বৈশিষ্ট্যযুক্ত গল্প</h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    {featured.map(s => (
                                        <div key={s.id} onClick={() => setActiveStoryId(s.id)} className="cursor-pointer">
                                            <StoryCard story={s} featured />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* All stories */}
                        {regular.length > 0 && (
                            <div>
                                {featured.length > 0 && (
                                    <h2 className="text-sm font-black text-gray-700 uppercase tracking-wider mb-4">সব গল্প</h2>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {regular.map(s => (
                                        <div key={s.id} onClick={() => setActiveStoryId(s.id)} className="cursor-pointer">
                                            <StoryCard story={s} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Pagination */}
                        {meta.last_page > 1 && (
                            <div className="flex items-center justify-center gap-3 mt-10">
                                <button onClick={() => fetchStories(page - 1)} disabled={page === 1}
                                    className="px-5 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600
                                               hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                    ← আগে
                                </button>
                                <span className="text-sm text-gray-500 font-medium">{page} / {meta.last_page}</span>
                                <button onClick={() => fetchStories(page + 1)} disabled={page === meta.last_page}
                                    className="px-5 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600
                                               hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                    পরে →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Story detail modal */}
            {activeStoryId && (
                <StoryDetailModal
                    storyId={activeStoryId}
                    onClose={() => setActiveStoryId(null)} />
            )}
        </div>
    );
}

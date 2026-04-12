import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    Plus, Search, Edit2, Trash2, Eye, EyeOff, Star,
    StarOff, ChevronLeft, ChevronRight, Upload, X,
    CheckCircle, AlertCircle, ImageIcon, Calendar,
    User, MapPin, BookOpen, FileText, Globe, Lock
} from 'lucide-react';
import AdminNavbar from '../Components/AdminNavbar';
import apiClient from '../api';
import toast from 'react-hot-toast';

// ── Bangladeshi Divisions ───────────────────────────────────────────
const DIVISIONS = [
    'ঢাকা', 'চট্টগ্রাম', 'রাজশাহী', 'খুলনা',
    'বরিশাল', 'সিলেট', 'রংপুর', 'ময়মনসিংহ',
];

const GENDERS = [
    { value: 'male',   label: 'পুরুষ' },
    { value: 'female', label: 'মহিলা' },
    { value: 'other',  label: 'অন্যান্য' },
];

const TAGS = ['পুনর্মিলিত', 'উদ্ধারকৃত', 'নিরাপদ', 'পরিবারে ফিরেছে'];

// ── Blank form state ────────────────────────────────────────────────
const BLANK_FORM = {
    title: '', excerpt: '', story: '',
    person_name: '', person_age: '', person_gender: 'male',
    division: '', district: '',
    missing_date: '', found_date: '',
    missing_report_id: '', found_report_id: '',
    is_published: false, featured: false,
    tag: 'পুনর্মিলিত',
};

// ── Story Card (in list) ────────────────────────────────────────────
function StoryCard({ story, onEdit, onDelete, onTogglePublish, onToggleFeatured }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            {/* Cover image */}
            <div className="relative h-40 bg-gray-100">
                {story.cover_image_url ? (
                    <img src={story.cover_image_url} alt={story.title}
                        className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={32} className="text-gray-300" />
                    </div>
                )}
                {/* Status badge */}
                <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold
                    ${story.is_published ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {story.is_published ? 'প্রকাশিত' : 'খসড়া'}
                </span>
                {story.featured && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                        ⭐ বৈশিষ্ট্যযুক্ত
                    </span>
                )}
            </div>

            <div className="p-4">
                <p className="text-xs text-gray-400 mb-1">{story.division} • {story.tag}</p>
                <h3 className="font-bold text-gray-800 text-sm leading-snug line-clamp-2 mb-2">
                    {story.title}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{story.excerpt}</p>

                <div className="flex items-center gap-1 flex-wrap">
                    <button onClick={() => onEdit(story)}
                        className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium">
                        <Edit2 size={11} /> সম্পাদনা
                    </button>
                    <button onClick={() => onTogglePublish(story)}
                        className={`flex items-center gap-1 px-2 py-1 text-xs rounded-lg font-medium transition-colors
                            ${story.is_published ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                        {story.is_published ? <><EyeOff size={11} /> লুকান</> : <><Eye size={11} /> প্রকাশ</>}
                    </button>
                    <button onClick={() => onToggleFeatured(story)}
                        className={`flex items-center gap-1 px-2 py-1 text-xs rounded-lg font-medium transition-colors
                            ${story.featured ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}>
                        {story.featured ? <><StarOff size={11} /> আনফিচার</> : <><Star size={11} /> ফিচার</>}
                    </button>
                    <button onClick={() => onDelete(story)}
                        className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors font-medium ml-auto">
                        <Trash2 size={11} /> মুছুন
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Story Form Modal ─────────────────────────────────────────────────
function StoryFormModal({ story, onClose, onSaved }) {
    const [form, setForm] = useState(story ? {
        title: story.title || '',
        excerpt: story.excerpt || '',
        story: story.story || '',
        person_name: story.person_name || '',
        person_age: story.person_age || '',
        person_gender: story.person_gender || 'male',
        division: story.division || '',
        district: story.district || '',
        missing_date: story.missing_date ? story.missing_date.split('T')[0] : '',
        found_date: story.found_date ? story.found_date.split('T')[0] : '',
        missing_report_id: story.missing_report_id || '',
        found_report_id: story.found_report_id || '',
        is_published: story.is_published || false,
        featured: story.featured || false,
        tag: story.tag || 'পুনর্মিলিত',
    } : { ...BLANK_FORM });

    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState(story?.cover_image_url || null);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const fileInputRef = useRef();
    const isEdit = Boolean(story?.id);

    const set = (field, value) => setForm(f => ({ ...f, [field]: value }));

    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setCoverFile(file);
        setCoverPreview(URL.createObjectURL(file));
    };

    const removeCover = () => {
        setCoverFile(null);
        setCoverPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const validate = () => {
        const e = {};
        if (!form.title.trim())       e.title = 'শিরোনাম প্রয়োজন';
        if (!form.excerpt.trim())     e.excerpt = 'সারাংশ প্রয়োজন';
        if (!form.story.trim())       e.story = 'সম্পূর্ণ গল্প প্রয়োজন';
        if (!form.person_name.trim()) e.person_name = 'ব্যক্তির নাম প্রয়োজন';
        if (!form.division)           e.division = 'বিভাগ নির্বাচন করুন';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            const fd = new FormData();
            Object.entries(form).forEach(([k, v]) => {
                if (v !== '' && v !== null && v !== undefined) {
                    fd.append(k, typeof v === 'boolean' ? (v ? '1' : '0') : v);
                }
            });
            if (coverFile) fd.append('cover_image', coverFile);

            const config = { headers: { 'Content-Type': 'multipart/form-data' } };

            if (isEdit) {
                // Use POST with the story id — backend handles it
                await apiClient.post(`/admin/success-stories/${story.id}`, fd, config);
                toast.success('গল্প আপডেট হয়েছে!');
            } else {
                await apiClient.post('/admin/success-stories', fd, config);
                toast.success('গল্প সংরক্ষিত হয়েছে!');
            }
            onSaved();
        } catch {
            // errors already toasted by apiClient
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="font-black text-gray-800 text-lg">
                            {isEdit ? 'গল্প সম্পাদনা' : 'নতুন সাফল্যের গল্প'}
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {isEdit ? 'বিদ্যমান গল্প আপডেট করুন' : 'নিখোঁজ ব্যক্তির পুনর্মিলনের গল্প প্রকাশ করুন'}
                        </p>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

                    {/* Cover Image */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">
                            কভার ছবি
                        </label>
                        {coverPreview ? (
                            <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200">
                                <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
                                <button onClick={removeCover}
                                    className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow hover:bg-white transition-colors">
                                    <X size={14} className="text-gray-600" />
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => fileInputRef.current?.click()}
                                className="w-full h-36 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center
                                           text-gray-400 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all">
                                <Upload size={24} className="mb-2" />
                                <span className="text-xs font-medium">ছবি আপলোড করুন (JPG, PNG, WebP — সর্বোচ্চ 5MB)</span>
                            </button>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            শিরোনাম <span className="text-red-500">*</span>
                        </label>
                        <input value={form.title} onChange={e => set('title', e.target.value)}
                            placeholder="যেমন: ১০ বছর পর মায়ের কোলে ফিরে এলো রাহিম"
                            className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition-colors
                                ${errors.title ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-primary'}`} />
                        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                    </div>

                    {/* Excerpt */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            সংক্ষিপ্ত বিবরণ <span className="text-red-500">*</span>
                            <span className="text-gray-400 font-normal ml-1">(তালিকায় দেখাবে)</span>
                        </label>
                        <textarea value={form.excerpt} onChange={e => set('excerpt', e.target.value)} rows={3}
                            placeholder="গল্পের সংক্ষিপ্ত সারাংশ..."
                            className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none resize-none transition-colors
                                ${errors.excerpt ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-primary'}`} />
                        {errors.excerpt && <p className="text-xs text-red-500 mt-1">{errors.excerpt}</p>}
                    </div>

                    {/* Full Story */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                            সম্পূর্ণ গল্প <span className="text-red-500">*</span>
                        </label>
                        <textarea value={form.story} onChange={e => set('story', e.target.value)} rows={8}
                            placeholder="পুনর্মিলনের সম্পূর্ণ বিস্তারিত গল্প লিখুন..."
                            className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none resize-y transition-colors
                                ${errors.story ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-primary'}`} />
                        {errors.story && <p className="text-xs text-red-500 mt-1">{errors.story}</p>}
                    </div>

                    {/* Person Details */}
                    <div>
                        <h3 className="text-xs font-black text-gray-600 uppercase tracking-wider mb-3">ব্যক্তির তথ্য</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    নাম <span className="text-red-500">*</span>
                                </label>
                                <input value={form.person_name} onChange={e => set('person_name', e.target.value)}
                                    placeholder="নিখোঁজ ব্যক্তির নাম"
                                    className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition-colors
                                        ${errors.person_name ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-primary'}`} />
                                {errors.person_name && <p className="text-xs text-red-500 mt-1">{errors.person_name}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">বয়স</label>
                                <input type="number" min="0" max="120" value={form.person_age}
                                    onChange={e => set('person_age', e.target.value)}
                                    placeholder="বয়স (বছর)"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">লিঙ্গ</label>
                                <select value={form.person_gender} onChange={e => set('person_gender', e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors bg-white">
                                    {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">ট্যাগ</label>
                                <select value={form.tag} onChange={e => set('tag', e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors bg-white">
                                    {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <h3 className="text-xs font-black text-gray-600 uppercase tracking-wider mb-3">অবস্থান</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">
                                    বিভাগ <span className="text-red-500">*</span>
                                </label>
                                <select value={form.division} onChange={e => set('division', e.target.value)}
                                    className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition-colors bg-white
                                        ${errors.division ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-primary'}`}>
                                    <option value="">বিভাগ নির্বাচন করুন</option>
                                    {DIVISIONS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                                {errors.division && <p className="text-xs text-red-500 mt-1">{errors.division}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">জেলা</label>
                                <input value={form.district} onChange={e => set('district', e.target.value)}
                                    placeholder="জেলার নাম"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors" />
                            </div>
                        </div>
                    </div>

                    {/* Dates */}
                    <div>
                        <h3 className="text-xs font-black text-gray-600 uppercase tracking-wider mb-3">তারিখ</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">নিখোঁজের তারিখ</label>
                                <input type="date" value={form.missing_date} onChange={e => set('missing_date', e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">পুনর্মিলনের তারিখ</label>
                                <input type="date" value={form.found_date} onChange={e => set('found_date', e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors" />
                            </div>
                        </div>
                    </div>

                    {/* Linked Reports */}
                    <div>
                        <h3 className="text-xs font-black text-gray-600 uppercase tracking-wider mb-3">সংযুক্ত রিপোর্ট (ঐচ্ছিক)</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">নিখোঁজ রিপোর্ট ID</label>
                                <input type="number" value={form.missing_report_id}
                                    onChange={e => set('missing_report_id', e.target.value)}
                                    placeholder="যেমন: 42"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">উদ্ধার রিপোর্ট ID</label>
                                <input type="number" value={form.found_report_id}
                                    onChange={e => set('found_report_id', e.target.value)}
                                    placeholder="যেমন: 17"
                                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors" />
                            </div>
                        </div>
                    </div>

                    {/* Publish Options */}
                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <h3 className="text-xs font-black text-gray-600 uppercase tracking-wider">প্রকাশনা সেটিংস</h3>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={form.is_published}
                                onChange={e => set('is_published', e.target.checked)}
                                className="w-4 h-4 rounded accent-primary" />
                            <div>
                                <span className="text-sm font-semibold text-gray-700">এখনই প্রকাশ করুন</span>
                                <p className="text-xs text-gray-400">অনির্বাচিত থাকলে খসড়া হিসেবে সংরক্ষিত হবে</p>
                            </div>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={form.featured}
                                onChange={e => set('featured', e.target.checked)}
                                className="w-4 h-4 rounded accent-primary" />
                            <div>
                                <span className="text-sm font-semibold text-gray-700">বৈশিষ্ট্যযুক্ত গল্প</span>
                                <p className="text-xs text-gray-400">হোমপেজে এবং তালিকার শীর্ষে দেখাবে</p>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                    <button onClick={onClose}
                        className="px-5 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
                        বাতিল
                    </button>
                    <button onClick={handleSubmit} disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
                        {saving ? (
                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> সংরক্ষণ...</>
                        ) : (
                            <><CheckCircle size={15} /> {isEdit ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Confirm Delete Modal ─────────────────────────────────────────────
function ConfirmDeleteModal({ story, onClose, onConfirm }) {
    const [deleting, setDeleting] = useState(false);
    const handleConfirm = async () => {
        setDeleting(true);
        await onConfirm();
        setDeleting(false);
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AlertCircle size={24} className="text-red-500" />
                </div>
                <h3 className="text-center font-black text-gray-800 mb-2">গল্পটি মুছবেন?</h3>
                <p className="text-center text-sm text-gray-500 mb-6">
                    <strong className="text-gray-700">"{story.title}"</strong> — এটি স্থায়ীভাবে মুছে যাবে।
                </p>
                <div className="flex gap-3">
                    <button onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                        বাতিল
                    </button>
                    <button onClick={handleConfirm} disabled={deleting}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 disabled:opacity-60 transition-colors">
                        {deleting ? 'মুছছে...' : 'হ্যাঁ, মুছুন'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main Page ────────────────────────────────────────────────────────
export default function AdminSuccessStoriesPage() {
    const [stories, setStories]     = useState([]);
    const [meta, setMeta]           = useState({ total: 0, last_page: 1 });
    const [loading, setLoading]     = useState(true);
    const [page, setPage]           = useState(1);
    const [search, setSearch]       = useState('');
    const [statusFilter, setStatus] = useState('');
    const [showForm, setShowForm]   = useState(false);
    const [editStory, setEditStory] = useState(null);
    const [deleteStory, setDeleteStory] = useState(null);

    const fetchStories = async (p = 1, q = search, s = statusFilter) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: p });
            if (q) params.set('search', q);
            if (s) params.set('status', s);
            const data = await apiClient.get(`/admin/success-stories?${params}`);
            setStories(data.data || []);
            setMeta({ total: data.total || 0, last_page: data.last_page || 1 });
            setPage(p);
        } catch {
            // error toasted by apiClient
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStories(1, search, statusFilter); }, [search, statusFilter]);

    const handleEdit   = (s) => { setEditStory(s); setShowForm(true); };
    const handleNew    = ()  => { setEditStory(null); setShowForm(true); };
    const handleSaved  = ()  => { setShowForm(false); fetchStories(page); };

    const handleTogglePublish = async (story) => {
        try {
            const res = await apiClient.patch(`/admin/success-stories/${story.id}/toggle-publish`);
            toast.success(res.message || (story.is_published ? 'গল্পটি লুকানো হয়েছে' : 'গল্পটি প্রকাশিত হয়েছে'));
            fetchStories(page);
        } catch { /* toasted */ }
    };

    const handleToggleFeatured = async (story) => {
        try {
            const res = await apiClient.patch(`/admin/success-stories/${story.id}/toggle-featured`);
            toast.success(res.message || (story.featured ? 'ফিচার সরানো হয়েছে' : 'ফিচার করা হয়েছে'));
            fetchStories(page);
        } catch { /* toasted */ }
    };

    const handleDelete = async () => {
        try {
            await apiClient.delete(`/admin/success-stories/${deleteStory.id}`);
            toast.success('গল্পটি মুছে ফেলা হয়েছে');
            setDeleteStory(null);
            fetchStories(page);
        } catch { /* toasted */ }
    };

    const published = stories.filter(s => s.is_published).length;
    const drafts    = stories.filter(s => !s.is_published).length;

    return (
        <div className="min-h-screen bg-gray-50">
            <AdminNavbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Link to="/admin/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">ড্যাশবোর্ড</Link>
                            <span className="text-gray-300">/</span>
                            <span className="text-sm text-gray-600 font-medium">সাফল্যের গল্প</span>
                        </div>
                        <h1 className="text-2xl font-black text-gray-800">সাফল্যের গল্প পরিচালনা</h1>
                        <p className="text-sm text-gray-500 mt-1">নিখোঁজ ব্যক্তির পুনর্মিলনের গল্প প্রকাশ ও পরিচালনা করুন</p>
                    </div>
                    <button onClick={handleNew}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-sm shrink-0">
                        <Plus size={16} /> নতুন গল্প যোগ করুন
                    </button>
                </div>

                {/* Stats strip */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                        { label: 'মোট গল্প', value: meta.total, color: 'text-gray-800' },
                        { label: 'প্রকাশিত', value: published, color: 'text-green-600' },
                        { label: 'খসড়া', value: drafts, color: 'text-yellow-600' },
                    ].map(stat => (
                        <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 px-5 py-4 shadow-sm">
                            <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
                            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="শিরোনাম, নাম বা বিভাগ দিয়ে খুঁজুন..."
                            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary transition-colors" />
                    </div>
                    <select value={statusFilter} onChange={e => setStatus(e.target.value)}
                        className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary bg-white transition-colors">
                        <option value="">সব অবস্থা</option>
                        <option value="published">প্রকাশিত</option>
                        <option value="draft">খসড়া</option>
                    </select>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                                <div className="h-40 bg-gray-100" />
                                <div className="p-4 space-y-2">
                                    <div className="h-3 bg-gray-100 rounded w-1/3" />
                                    <div className="h-4 bg-gray-100 rounded w-full" />
                                    <div className="h-3 bg-gray-100 rounded w-5/6" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : stories.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 py-20 text-center">
                        <BookOpen size={40} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500 font-semibold">কোনো গল্প পাওয়া যায়নি</p>
                        <p className="text-xs text-gray-400 mt-1 mb-5">প্রথম সাফল্যের গল্পটি যোগ করুন</p>
                        <button onClick={handleNew}
                            className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors">
                            <Plus size={14} /> গল্প যোগ করুন
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {stories.map(story => (
                                <StoryCard key={story.id} story={story}
                                    onEdit={handleEdit}
                                    onDelete={setDeleteStory}
                                    onTogglePublish={handleTogglePublish}
                                    onToggleFeatured={handleToggleFeatured} />
                            ))}
                        </div>

                        {/* Pagination */}
                        {meta.last_page > 1 && (
                            <div className="flex items-center justify-center gap-3 mt-8">
                                <button onClick={() => fetchStories(page - 1)} disabled={page === 1}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600
                                               hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                    <ChevronLeft size={15} /> আগে
                                </button>
                                <span className="text-sm text-gray-500 font-medium">{page} / {meta.last_page}</span>
                                <button onClick={() => fetchStories(page + 1)} disabled={page === meta.last_page}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600
                                               hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                    পরে <ChevronRight size={15} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            {showForm && (
                <StoryFormModal
                    story={editStory}
                    onClose={() => setShowForm(false)}
                    onSaved={handleSaved} />
            )}
            {deleteStory && (
                <ConfirmDeleteModal
                    story={deleteStory}
                    onClose={() => setDeleteStory(null)}
                    onConfirm={handleDelete} />
            )}
        </div>
    );
}

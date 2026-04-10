import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Flag, CheckCircle, AlertTriangle, Eye,
    Search, FileText, Shield,
    ChevronDown, X, Loader2,
    ThumbsUp, ThumbsDown,
    Menu, Inbox
} from 'lucide-react';
import { AdminSidebar } from './AdminDashboardPage';
import { useAuth } from '../helpers/AuthContext';
import AdminNavbar from '../Components/AdminNavbar';
import apiClient from '../api';
import {
    approveMissingReport,
    getPendingMissingReports,
    rejectMissingReport,
} from '../helpers/missingReportService';
import {
    approveFoundReport,
    getPendingFoundReports,
    rejectFoundReport,
} from '../helpers/foundReportService';

/* ══════════════════════════════════════════
   DATA HOOK — wire up API calls here
══════════════════════════════════════════ */
function useModerationData() {
    const [loading, setLoading] = useState(true);

    /* Stats strip */
    const [stats, setStats] = useState({
        pendingReviews: 0,
        resolvedToday: 0,
    });

    /*
     * Queue items shape:
     * {
    *   id, type: 'report'|'found'|'appeal',
     *   title, submittedBy, date,
     *   priority: 'high'|'medium'|'low',
     *   status: 'pending'|'under_review'|'escalated',
     *   description, division, age (for reports),
    *   reason (for found reports & appeals),
     *   notes,
     * }
     */
    const [pendingReports, setPendingReports] = useState([]);
    const [foundReports, setFoundReports] = useState([]);
    useEffect(() => {
        let mounted = true;

        const loadModerationData = async () => {
            try {
                const [statsRes, reportRes, foundRes] = await Promise.all([
                    apiClient.get('/admin/moderation/stats'),
                    getPendingMissingReports(),
                    getPendingFoundReports(),
                ]);

                if (!mounted) return;

                const pendingMissingReports = reportRes?.reports ?? [];
                const pendingFoundReports = foundRes?.reports ?? [];

                setStats({
                    ...(statsRes || {
                        pendingReviews: 0,
                        resolvedToday: 0,
                    }),
                    pendingReviews: pendingMissingReports.length + pendingFoundReports.length,
                });
                setPendingReports(pendingMissingReports);
                setFoundReports(pendingFoundReports);
            } catch {
                if (!mounted) return;
                setStats({ pendingReviews: 0, resolvedToday: 0 });
                setPendingReports([]);
                setFoundReports([]);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadModerationData();

        return () => {
            mounted = false;
        };
    }, []);

    return {
        loading,
        stats, setStats,
        pendingReports, setPendingReports,
        foundReports, setFoundReports,
    };
}

/* ══════════════════════════════════════════
   SHARED CONSTANTS
══════════════════════════════════════════ */
const PRIORITY_STYLE = {
    high: { cls: 'bg-red-50 text-red-600 border-red-200', dot: 'bg-red-500', label: 'উচ্চ' },
    medium: { cls: 'bg-amber-50 text-amber-600 border-amber-200', dot: 'bg-amber-500', label: 'মধ্যম' },
    low: { cls: 'bg-gray-50 text-gray-500 border-gray-200', dot: 'bg-gray-400', label: 'নিম্ন' },
};

const STATUS_STYLE = {
    pending: { cls: 'bg-amber-50 text-amber-700 border-amber-200', label: 'অপেক্ষমাণ' },
    under_review: { cls: 'bg-blue-50 text-blue-700 border-blue-200', label: 'পর্যালোচনাধীন' },
    escalated: { cls: 'bg-red-50 text-red-700 border-red-200', label: 'এস্কেলেটেড' },
};

/* ══════════════════════════════════════════
   STATS STRIP
══════════════════════════════════════════ */
function StatsStrip({ stats }) {
    const cards = [
        { label: 'অপেক্ষমাণ পর্যালোচনা', value: stats.pendingReviews, icon: Inbox, color: 'bg-amber-50 text-amber-500 border-amber-100' },
        { label: 'আজকে সমাধান করা হয়েছে', value: stats.resolvedToday, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-500 border-emerald-100' },
    ];

    return (
        <div className="grid grid-cols-2 xl:grid-cols-2 gap-3 mb-6">
            {cards.map((c, i) => (
                <div key={i} className={`flex items-center gap-3 p-4 rounded-2xl border ${c.color} bg-white shadow-sm`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${c.color}`}>
                        <c.icon size={16} />
                    </div>
                    <div>
                        <p className="text-xl font-black text-gray-800">{c.value}</p>
                        <p className="text-[10px] text-gray-400 leading-tight">{c.label}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ══════════════════════════════════════════
   FILTER BAR
══════════════════════════════════════════ */
function FilterBar({ search, setSearch, status, setStatus }) {
    return (
        <div className="flex flex-wrap items-center gap-3 mb-4">
            {/* Search */}
            <div className="relative flex-1 min-w-48">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="আইডি, নাম বা বিবরণ খুঁজুন..."
                    className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-xl
                               focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 bg-white" />
            </div>

            {/* Status filter */}
            <div className="relative">
                <select value={status} onChange={e => setStatus(e.target.value)}
                    className="pl-3 pr-8 py-2 text-xs border border-gray-200 rounded-xl bg-white
                               focus:outline-none focus:ring-2 focus:ring-red-200 appearance-none cursor-pointer">
                    <option value="">সব স্ট্যাটাস</option>
                    <option value="pending">অপেক্ষমাণ</option>
                    <option value="under_review">পর্যালোচনাধীন</option>
                    <option value="escalated">এস্কেলেটেড</option>
                </select>
                <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════
   EMPTY STATE
══════════════════════════════════════════ */
function EmptyQueue({ label = 'কোনো আইটেম নেই' }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-gray-300">
            <Inbox size={40} className="mb-3" />
            <p className="text-sm font-bold text-gray-400">{label}</p>
            <p className="text-xs text-gray-300 mt-1">ব্যাকএন্ড সংযুক্ত হলে এখানে তথ্য দেখাবে</p>
        </div>
    );
}

/* ══════════════════════════════════════════
   DETAIL SLIDE-IN PANEL
══════════════════════════════════════════ */
function DetailPanel({ item, onClose, onAction }) {
    const [note, setNote] = useState('');
    const [actioning, setActioning] = useState('');

    if (!item) return null;

    const stat = STATUS_STYLE[item.status] ?? STATUS_STYLE.pending;
    const isFoundReport = item.type === 'found' || item.type === 'found_report';
    const aiMatches = Array.isArray(item.ai_matches) ? item.ai_matches : [];
    const visibleAiMatches = aiMatches.filter(match => Number(match.total_score) >= 60);

    const handleAction = async (action) => {
        setActioning(action);
        await new Promise(r => setTimeout(r, 700));
        onAction(item.id, action, note);
        setActioning('');
    };

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose} />

            {/* Panel */}
            <aside className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50
                              flex flex-col border-l border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
                    <div>
                        <p className="text-xs text-gray-400 font-medium">পর্যালোচনা</p>
                        <h3 className="font-black text-gray-800 text-sm leading-tight mt-0.5">{item.title}</h3>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-gray-400
                                                         hover:bg-gray-200 rounded-lg transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {isFoundReport ? (
                        <>
                            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4">
                                <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider mb-2">উদ্ধার রিপোর্টের পূর্ণ তথ্য</p>
                                {item.photo_url ? (
                                    <img
                                        src={item.photo_url}
                                        alt={item.title}
                                        className="w-full h-48 object-cover rounded-xl mb-4 border border-white shadow-sm"
                                    />
                                ) : null}
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="bg-white rounded-xl p-3">
                                        <p className="text-[10px] text-gray-400 mb-0.5">নাম</p>
                                        <p className="text-xs font-bold text-gray-700">{item.name || item.title?.replace('উদ্ধার রিপোর্ট: ', '') || '—'}</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-3">
                                        <p className="text-[10px] text-gray-400 mb-0.5">জেলা</p>
                                        <p className="text-xs font-bold text-gray-700">{item.district ?? '—'}</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-3">
                                        <p className="text-[10px] text-gray-400 mb-0.5">বয়স</p>
                                        <p className="text-xs font-bold text-gray-700">{item.age ?? item.approximate_age ?? '—'}</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-3">
                                        <p className="text-[10px] text-gray-400 mb-0.5">লিঙ্গ</p>
                                        <p className="text-xs font-bold text-gray-700">{item.gender ?? '—'}</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-3">
                                        <p className="text-[10px] text-gray-400 mb-0.5">পাওয়ার তারিখ</p>
                                        <p className="text-xs font-bold text-gray-700">{item.found_date ?? item.date ?? '—'}</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-3">
                                        <p className="text-[10px] text-gray-400 mb-0.5">পাওয়ার সময়</p>
                                        <p className="text-xs font-bold text-gray-700">{item.found_time ?? '—'}</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-3 col-span-2">
                                        <p className="text-[10px] text-gray-400 mb-0.5">ঠিকানা</p>
                                        <p className="text-xs font-bold text-gray-700">{item.address ?? '—'}</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-3 col-span-2">
                                        <p className="text-[10px] text-gray-400 mb-0.5">শারীরিক বিবরণ</p>
                                        <p className="text-xs font-bold text-gray-700">{item.physical_description ?? '—'}</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-3 col-span-2">
                                        <p className="text-[10px] text-gray-400 mb-0.5">অতিরিক্ত তথ্য</p>
                                        <p className="text-xs font-bold text-gray-700">{item.additional_info ?? '—'}</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-3">
                                        <p className="text-[10px] text-gray-400 mb-0.5">যোগাযোগের নাম</p>
                                        <p className="text-xs font-bold text-gray-700">{item.contact_person_name ?? '—'}</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-3">
                                        <p className="text-[10px] text-gray-400 mb-0.5">যোগাযোগের ফোন</p>
                                        <p className="text-xs font-bold text-gray-700">{item.contact_phone ?? '—'}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-3">AI ম্যাচ ফলাফল</p>
                                <div className="space-y-3">
                                    {visibleAiMatches.length === 0 ? (
                                        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-500 text-center">
                                            কোনো AI মিল পাওয়া যায়নি
                                        </div>
                                    ) : (
                                        visibleAiMatches.map(match => (
                                            <div key={`${match.missing_report_id}-${match.total_score}`} className="border rounded-xl p-4 bg-gray-50/60">
                                                <div className="flex items-start justify-between gap-3 mb-2">
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-800">{match.missing_name || 'অজানা'}</p>
                                                        <p className="text-xs text-gray-500">{match.missing_district || '—'} থেকে নিখোঁজ</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-black text-gray-800">{match.total_score}%</p>
                                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${match.match_level === 'high' ? 'bg-emerald-100 text-emerald-700' : match.match_level === 'medium' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'}`}>
                                                            {match.match_level === 'high' ? 'উচ্চ' : match.match_level === 'medium' ? 'মধ্যম' : 'নিম্ন'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5 text-xs text-gray-600">
                                                    <div className="flex justify-between"><span>নাম</span><span className="font-semibold">{match.name_score}/35</span></div>
                                                    <div className="flex justify-between"><span>জেলা</span><span className="font-semibold">{match.district_score}/25</span></div>
                                                    <div className="flex justify-between"><span>অবস্থান</span><span className="font-semibold">{match.location_score}/20</span></div>
                                                    <div className="flex justify-between"><span>বয়স</span><span className="font-semibold">{match.age_score}/10</span></div>
                                                    <div className="flex justify-between"><span>লিঙ্গ</span><span className="font-semibold">{match.gender_score}/5</span></div>
                                                    <div className="flex justify-between"><span>বিবরণ</span><span className="font-semibold">{match.description_score}/5</span></div>
                                                </div>
                                                {match.ai_reasoning && match.ai_reasoning !== 'Rule-based score' && (
                                                    <p className="text-xs text-gray-600 italic mt-2 border-t border-gray-200 pt-2">{match.ai_reasoning}</p>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    ) : null}

                    {/* Meta */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] text-gray-400 mb-0.5">জমা দিয়েছেন</p>
                            <p className="text-xs font-bold text-gray-700">{item.submittedBy ?? '—'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] text-gray-400 mb-0.5">তারিখ</p>
                            <p className="text-xs font-bold text-gray-700">{item.date ?? '—'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] text-gray-400 mb-0.5">স্ট্যাটাস</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${stat.cls}`}>{stat.label}</span>
                        </div>
                    </div>

                    {/* Description / Reason */}
                    <div className="bg-white border border-gray-100 rounded-xl p-4">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">বিবরণ / কারণ</p>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            {item.description ?? item.reason ?? 'কোনো বিবরণ নেই'}
                        </p>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">মডারেটর নোট</label>
                        <textarea
                            value={note} onChange={e => setNote(e.target.value)}
                            rows={3}
                            placeholder="এখানে নোট লিখুন (ঐচ্ছিক)..."
                            className="w-full px-3 py-2.5 text-xs border border-gray-200 rounded-xl resize-none
                                       focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400" />
                    </div>
                </div>

                {/* Action buttons */}
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-3">অ্যাকশন নিন</p>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { id: 'approve', label: 'অনুমোদন', icon: ThumbsUp, cls: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
                            { id: 'reject', label: 'প্রত্যাখ্যান', icon: ThumbsDown, cls: 'bg-red-500 hover:bg-red-600 text-white' },
                        ].map(a => (
                            <button key={a.id} onClick={() => handleAction(a.id)} disabled={!!actioning}
                                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold
                                            transition-all disabled:opacity-60 ${a.cls}`}>
                                {actioning === a.id
                                    ? <Loader2 size={12} className="animate-spin" />
                                    : <a.icon size={12} />}
                                {a.label}
                            </button>
                        ))}
                    </div>
                </div>
            </aside>
        </>
    );
}

/* ══════════════════════════════════════════
   QUEUE TABLE (shared by all 3 tabs)
══════════════════════════════════════════ */
function QueueTable({ items, onReview, loading, emptyLabel }) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 size={28} className="animate-spin text-gray-200" />
            </div>
        );
    }
    if (!items.length) return <EmptyQueue label={emptyLabel} />;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-gray-50">
                        {['আইডি', 'শিরোনাম', 'জমাকারী', 'স্ট্যাটাস', 'তারিখ', 'অ্যাকশন'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {items.map(item => {
                        const stat = STATUS_STYLE[item.status] ?? STATUS_STYLE.pending;
                        return (
                            <tr key={item.id} className="hover:bg-gray-50/60 transition-colors group">
                                <td className="px-4 py-3.5 text-xs text-gray-400 font-mono">#{item.id}</td>
                                <td className="px-4 py-3.5">
                                    <div className="min-w-0 max-w-xs">
                                        <p className="text-xs font-bold text-gray-700 truncate">{item.title}</p>
                                        <p className="text-[10px] text-gray-400 truncate mt-0.5">{item.description?.slice(0, 60) ?? '—'}</p>
                                    </div>
                                </td>
                                <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{item.submittedBy ?? '—'}</td>
                                <td className="px-4 py-3.5">
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${stat.cls}`}>{stat.label}</span>
                                </td>
                                <td className="px-4 py-3.5 text-xs text-gray-400 whitespace-nowrap">{item.date ?? '—'}</td>
                                <td className="px-4 py-3.5">
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => onReview(item)}
                                            className="flex items-center gap-1 text-[10px] font-bold text-white bg-red-500
                                                       hover:bg-red-600 px-3 py-1.5 rounded-lg transition-colors">
                                            <Eye size={11} /> পর্যালোচনা
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

/* ══════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════ */
const TABS = [
    { id: 'reports', label: 'মিসিং রিপোর্ট', icon: FileText, emptyLabel: 'কোনো অপেক্ষমাণ মিসিং রিপোর্ট নেই' },
    { id: 'found', label: 'উদ্ধার রিপোর্ট', icon: Shield, emptyLabel: 'কোনো অপেক্ষমাণ উদ্ধার রিপোর্ট নেই' },
];

export default function AdminModerationPage() {
    const navigate = useNavigate();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('reports');
    const [selectedItem, setSelectedItem] = useState(null);

    /* filters */
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const data = useModerationData();
    const { loading, stats, pendingReports, setPendingReports, foundReports, setFoundReports } = data;

    /* derive current queue based on active tab */
    const queueMap = { reports: pendingReports, found: foundReports };
    const rawQueue = queueMap[activeTab] ?? [];

    /* apply filters */
    const filtered = rawQueue.filter(item => {
        const searchText = `${item.title ?? ''} ${item.submittedBy ?? ''} ${item.address ?? ''} ${item.district ?? ''}`.toLowerCase();
        const matchSearch = !search || searchText.includes(search.toLowerCase()) || String(item.id).includes(search);
        const matchStatus = !status || item.status === status;
        return matchSearch && matchStatus;
    });

    /* handle moderation action */
    const handleAction = async (id, action, note) => {
        setActionLoading(true);

        if (activeTab === 'found') {
            try {
                const result = action === 'approve'
                    ? await approveFoundReport(id)
                    : await rejectFoundReport(id, note);

                if (result.success) {
                    setFoundReports(prev => prev.filter(item => item.id !== id));
                    setSelectedItem(null);
                }
            } finally {
                setActionLoading(false);
            }
            return;
        }

        if (action === 'reject' && !note.trim()) {
            return;
        }

        try {
            const result = action === 'approve'
                ? await approveMissingReport(id)
                : await rejectMissingReport(id, note);

            if (result.success) {
                setPendingReports(prev => prev.filter(item => item.id !== id));
                setStats(prev => ({
                    ...prev,
                    pendingReviews: Math.max((prev.pendingReviews || 0) - 1, 0),
                }));
                setSelectedItem(null);
            }
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">

            {/* Desktop sidebar */}
            <div className="hidden lg:flex">
                <AdminSidebar active="moderation"
                    onNav={id => navigate(`/admin/dashboard`)}
                    collapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(p => !p)} />
            </div>

            {/* Mobile sidebar overlay */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    <div className="flex-shrink-0">
                        <AdminSidebar active="moderation"
                            onNav={() => setMobileOpen(false)}
                            collapsed={false}
                            onToggle={() => setMobileOpen(false)} />
                    </div>
                    <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
                </div>
            )}

            {/* Main area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <AdminNavbar breadcrumb="মডারেশন প্যানেল" onMobileMenu={() => setMobileOpen(true)} />

                {/* Scrollable content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-6">

                    {/* Page heading */}
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <h1 className="text-xl font-black text-gray-800">মডারেশন প্যানেল</h1>
                            <p className="text-xs text-gray-400 mt-0.5">মিসিং রিপোর্ট এবং উদ্ধার রিপোর্ট পর্যালোচনা করুন</p>
                        </div>
                        <button onClick={() => navigate('/admin/dashboard')}
                            className="text-xs text-gray-500 hover:text-red-500 font-semibold transition-colors hidden lg:block">
                            ← ড্যাশবোর্ড
                        </button>
                    </div>

                    {/* Stats strip */}
                    <StatsStrip stats={stats} />

                    {/* Tab bar */}
                    <div className="flex gap-1 bg-white border border-gray-100 rounded-2xl p-1 mb-4 shadow-sm w-fit">
                        {TABS.map(tab => {
                            const count = queueMap[tab.id]?.length ?? 0;
                            return (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold
                                                transition-all whitespace-nowrap
                                                ${activeTab === tab.id
                                            ? 'bg-red-500 text-white shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                                    <tab.icon size={13} />
                                    {tab.label}
                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full
                                                      ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Main card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* Filter bar */}
                        <div className="px-5 pt-5 pb-0">
                            <FilterBar search={search} setSearch={setSearch}
                                status={status} setStatus={setStatus} />
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-50 mx-5 mb-0" />

                        {/* Queue table */}
                        <QueueTable
                            items={filtered}
                            onReview={setSelectedItem}
                            loading={loading || actionLoading}
                            emptyLabel={TABS.find(t => t.id === activeTab)?.emptyLabel} />
                    </div>
                </main>
            </div>

            {/* Detail slide-in panel */}
            {selectedItem && (
                <DetailPanel
                    item={selectedItem}
                    onClose={() => setSelectedItem(null)}
                    onAction={handleAction} />
            )}
        </div>
    );
}
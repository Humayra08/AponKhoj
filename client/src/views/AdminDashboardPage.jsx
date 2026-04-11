import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, FileText, Users, BarChart2, Settings, LogOut,
    TrendingUp, TrendingDown, ArrowRight, CheckCircle,
    AlertTriangle, Eye, Shield, Bell, Zap,
    ChevronRight, Menu, X, UserCheck, RefreshCw, Loader2, Search, Flag, Heart
} from 'lucide-react';

import { useAuth } from '../helpers/AuthContext';
import AdminNavbar from '../Components/AdminNavbar';
import apiClient from '../api';
import { getPendingMissingReports } from '../helpers/missingReportService';
import { getPendingFoundReports, approveFoundReport, rejectFoundReport } from '../helpers/foundReportService';
import FoundReportMatchModal from '../Components/FoundReportMatchModal';
import toast from 'react-hot-toast';

const toBnNumber = (value) => Number(value || 0).toLocaleString('bn-BD');
const toBnDigits = (value) => String(value ?? '').replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);
const toBnMonthLabel = (label) => {
    const map = {
        Jan: 'জান',
        Feb: 'ফেব',
        Mar: 'মার্চ',
        Apr: 'এপ্রি',
        May: 'মে',
        Jun: 'জুন',
        Jul: 'জুল',
        Aug: 'আগ',
        Sep: 'সেপ',
        Oct: 'অক্টো',
        Nov: 'নভে',
        Dec: 'ডিসে',
    };
    return map[label] || label;
};

/* ─────────────────────────────────────────────────────────────
   DATA HOOK
   Replace the contents of `useEffect` with real API calls
   when the backend is ready.  All consumers of this hook
   will automatically re-render with live data.
───────────────────────────────────────────────────────────── */
function useAdminData() {
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        totalReports: 0,
        activeMissing: 0,
        users: 0,
        newUsersWeek: 0,
        successRate: 0,
    });

    const [monthlyData, setMonthlyData] = useState([]);
    const [statusData, setStatusData] = useState([]);
    const [divisions, setDivisions] = useState([]);
    const [reports, setReports] = useState([]);
    const [recentUsers, setRecentUsers] = useState([]);
    const [activity, setActivity] = useState([]);
    const [pendingFoundReports, setPendingFoundReports] = useState([]);

    useEffect(() => {
        let mounted = true;

        const statusLabelBn = {
            pending: 'অপেক্ষমাণ',
            resolved: 'সমাধান',
            verified: 'যাচাইকৃত',
            matched: 'ম্যাচ পাওয়া',
            closed: 'বন্ধ',
            active: 'সক্রিয়',
            published: 'প্রকাশিত',
            rejected: 'প্রত্যাখ্যাত',
            found: 'সফল',
            other: 'অন্যান্য',
        };

        const normalizeStatusData = (rawStatusData) => {
            const safeRaw = Array.isArray(rawStatusData) ? rawStatusData : [];
            if (!safeRaw.length) return [];

            const total = safeRaw.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

            return safeRaw.map((item) => {
                const key = String(item?.key || item?.status || item?.label || '').toLowerCase();
                const value = Number(item?.value) || 0;
                const pct = total > 0 ? Number(((value / total) * 100).toFixed(1)) : 0;

                return {
                    ...item,
                    value,
                    pct: Number.isFinite(Number(item?.pct)) ? Number(item.pct) : pct,
                    label: statusLabelBn[key] || item?.label || '—',
                    key,
                };
            });
        };

        const loadAdminData = async () => {
            try {
                // Fetch stats and recent reports in parallel 
                const [statsRes, reportsRes, pendingRes, pendingFoundRes] = await Promise.all([
                    apiClient.get('/admin/stats'),
                    apiClient.get('/admin/reports/recent'),
                    getPendingMissingReports(),
                    getPendingFoundReports(),
                ]);

                if (!mounted) return;

                // Extract stats from nested structure
                const statsData = statsRes?.stats || {
                    totalReports: 0,
                    activeMissing: 0,
                    users: 0,
                    newUsersWeek: 0,
                    successRate: 0,
                };

                // Get total reports count - use length of all reports if available
                const allReportsData = Array.isArray(reportsRes) ? reportsRes : (reportsRes?.reports ?? []);
                const pendingReportsArray = pendingRes?.reports ?? [];
                const pendingFoundReportsArray = pendingFoundRes?.reports ?? [];
                const pendingTotal = pendingReportsArray.length + pendingFoundReportsArray.length;
                const normalizedStatusData = normalizeStatusData(statsRes?.statusData || []);

                // Override counts with real data from API calls
                const finalStats = {
                    ...statsData,
                    totalReports: statsData.totalReports || allReportsData.length,
                    activeMissing: pendingTotal,
                };

                setStats(finalStats);
                setMonthlyData(statsRes?.monthlyData || []);
                setStatusData(normalizedStatusData);
                setDivisions(statsRes?.divisions || []);
                setRecentUsers(statsRes?.recentUsers || []);
                setActivity(statsRes?.activity || []);
                setReports(allReportsData);
                setPendingFoundReports(pendingFoundReportsArray);

                if (mounted) setLoading(false);
            } catch {
                if (!mounted) return;
                
                setStats({ 
                    totalReports: 0, 
                    activeMissing: 0, 
                    users: 0, 
                    newUsersWeek: 0,
                    successRate: 0,
                });
                setMonthlyData([]);
                setStatusData([]);
                setDivisions([]);
                setReports([]);
                setRecentUsers([]);
                setActivity([]);
                setPendingFoundReports([]);
                setLoading(false);
            }
        };

        loadAdminData();

        return () => {
            mounted = false;
        };
    }, []);

    return {
        loading,
        stats, setStats,
        monthlyData, setMonthlyData,
        statusData, setStatusData,
        divisions, setDivisions,
        reports, setReports,
        recentUsers, setRecentUsers,
        activity, setActivity,
        pendingFoundReports, setPendingFoundReports,
    };
}

/* ─────────────────────────────────────────────────────────────
   STATUS CONFIG (display labels & colours — not data)
───────────────────────────────────────────────────────────── */
const STATUS_STYLE = {
    pending: { cls: 'bg-amber-50 text-amber-700 border-amber-200', label: 'অপেক্ষমাণ' },
    verified: { cls: 'bg-blue-50 text-blue-700 border-blue-200', label: 'যাচাইকৃত' },
    matched: { cls: 'bg-purple-50 text-purple-700 border-purple-200', label: 'ম্যাচ পাওয়া' },
    closed: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'সফল' },
    found: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'সফল' },
    published: { cls: 'bg-teal-50 text-teal-700 border-teal-200', label: 'প্রকাশিত' },
    approved: { cls: 'bg-blue-50 text-blue-700 border-blue-200', label: 'অনুমোদিত' },
    rejected: { cls: 'bg-red-50 text-red-700 border-red-200', label: 'প্রত্যাখ্যাত' },
};

const ACTIVITY_ICON = { verify: CheckCircle, user: UserCheck, close: AlertTriangle, ai: Zap, system: RefreshCw };
const ACTIVITY_COLOR = { verify: 'text-emerald-500', user: 'text-blue-500', close: 'text-amber-500', ai: 'text-purple-500', system: 'text-gray-400' };

/* ─────────────────────────────────────────────────────────────
   SMALL SHARED COMPONENTS
───────────────────────────────────────────────────────────── */
function EmptyState({ message = 'কোনো তথ্য নেই' }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-gray-300">
            <AlertTriangle size={32} className="mb-2" />
            <p className="text-sm font-semibold">{message}</p>
        </div>
    );
}

/* SVG donut — tolerates empty data array */
function DonutChart({ data, total }) {
    const R = 56, cx = 70, cy = 70, circ = 2 * Math.PI * R;

    if (!data.length) {
        return (
            <div className="flex flex-col items-center gap-4">
                <svg width="140" height="140" viewBox="0 0 140 140">
                    <circle cx={cx} cy={cy} r={R} fill="none" stroke="#f3f4f6" strokeWidth="18" />
                    <text x={cx} y={cy + 5} textAnchor="middle" fontSize="11" fill="#d1d5db">কোনো তথ্য নেই</text>
                </svg>
            </div>
        );
    }

    let offset = 0;
    const segments = data.map(d => {
        const arc = (d.pct / 100) * circ;
        const seg = { ...d, arc, offset: -offset };
        offset += arc;
        return seg;
    });

    return (
        <div className="flex flex-col items-center gap-4">
            <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx={cx} cy={cy} r={R} fill="none" stroke="#f3f4f6" strokeWidth="18" />
                {segments.map((s, i) => (
                    <circle key={i} cx={cx} cy={cy} r={R} fill="none"
                        stroke={s.color} strokeWidth="18"
                        strokeDasharray={`${s.arc} ${circ}`}
                        strokeDashoffset={s.offset}
                        transform={`rotate(-90 ${cx} ${cy})`} />
                ))}
                <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="800" fill="#1f2937">{toBnNumber(total ?? data.reduce((a, d) => a + d.value, 0))}</text>
                <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#9ca3af">মোট</text>
            </svg>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full">
                {data.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        <span className="text-gray-500 truncate">{d.label}</span>
                        <span className="ml-auto font-bold text-gray-700">{toBnDigits(d.pct)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* KPI card */
function KpiCard({ title, value, sub, trend, trendUp, color, icon: Icon }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</span>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon size={16} />
                </div>
            </div>
            <div>
                <p className="text-2xl font-black text-gray-800">{value.toLocaleString('bn-BD')}</p>
                <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
            {trend && (
                <div className={`flex items-center gap-1 text-xs font-semibold ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
                    {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {trend}
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────
   ADMIN SIDEBAR (exported so AdminProfilePage can reuse it)
───────────────────────────────────────────────────────────── */
export function AdminSidebar({ active, onNav, collapsed, onToggle }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const NAV = [
        { id: 'overview', label: 'ওভারভিউ', icon: LayoutDashboard },
        { id: 'analytics', label: 'বিশ্লেষণ', icon: BarChart2 },
    ];

    const initials = user?.name
        ? user.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
        : 'A';

    return (
        <aside className={`flex flex-col bg-gray-900 text-white transition-all duration-300 flex-shrink-0
                           ${collapsed ? 'w-16' : 'w-60'} min-h-screen`}>

            {/* Logo */}
            <div className="flex items-center justify-between px-4 py-5 border-b border-gray-800">
                {!collapsed && (
                    <div>
                        <p className="font-black text-sm text-white leading-tight">আপনখোঁজ</p>
                        <p className="text-[10px] text-red-400 font-bold tracking-widest uppercase mt-0.5">Admin Panel</p>
                    </div>
                )}
                <button onClick={onToggle}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                    {collapsed ? <Menu size={16} /> : <X size={16} />}
                </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 py-4 px-2 space-y-1">
                {NAV.map(item => (
                    <button key={item.id} onClick={() => onNav(item.id)}
                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                                    ${active === item.id
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                        <item.icon size={16} className="flex-shrink-0" />
                        {!collapsed && <span>{item.label}</span>}
                        {!collapsed && active === item.id && <ChevronRight size={12} className="ml-auto" />}
                    </button>
                ))}

                <div className="border-t border-gray-800 my-2 pt-2">
                    <Link to="/admin/moderation">
                        <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm
                                           font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-all">
                            <Flag size={16} className="flex-shrink-0" />
                            {!collapsed && 'মডারেশন'}
                        </button>
                    </Link>
                    <Link to="/admin/success-stories">
    <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm
                       font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-all">
        <Heart size={16} className="flex-shrink-0" />
        {!collapsed && 'সাফল্যের গল্প'}
    </button>
</Link>
                    <Link to="/admin/profile">
                        <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm
                                           font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-all">
                            <Settings size={16} className="flex-shrink-0" />
                            {!collapsed && 'অ্যাডমিন প্রোফাইল'}
                        </button>
                    </Link>
                </div>
            </nav>

            {/* Admin info + logout */}
            <div className="border-t border-gray-800 p-3">
                {!collapsed && (
                    <div className="flex items-center gap-2.5 mb-3 px-1">
                        <div className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30
                                        flex items-center justify-center text-red-400 font-black text-xs flex-shrink-0">
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{user?.name || 'Admin'}</p>
                            <p className="text-[10px] text-gray-500 truncate">{user?.email || ''}</p>
                        </div>
                    </div>
                )}
                <button onClick={() => { logout(); navigate('/'); }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                    <LogOut size={14} className="flex-shrink-0" />
                    {!collapsed && 'লগআউট'}
                </button>
            </div>
        </aside>
    );
}

/* ─────────────────────────────────────────────────────────────
   SECTIONS
───────────────────────────────────────────────────────────── */
function OverviewSection({ data }) {
    const {
        stats,
        setStats,
        monthlyData,
        statusData,
        setStatusData,
        divisions,
        reports,
        recentUsers,
        activity,
        pendingFoundReports,
        setPendingFoundReports,
        loading,
    } = data;
    const { user } = useAuth();
    const today = new Date().toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' });
    const barMax = monthlyData.length ? Math.max(...monthlyData.map(d => d.value)) : 1;
    const [selectedFoundReport, setSelectedFoundReport] = useState(null);
    const [showAllRecentReports, setShowAllRecentReports] = useState(false);
    const visibleRecentReports = showAllRecentReports ? reports : reports.slice(0, 5);

    const applyModerationCountUpdate = () => {
        setStats(prev => ({
            ...prev,
            activeMissing: Math.max((prev.activeMissing || 0) - 1, 0),
        }));

        setStatusData(prev => {
            if (!Array.isArray(prev) || prev.length === 0) return prev;

            const updated = prev.map(item => {
                const key = String(item?.key || item?.status || item?.label || '').toLowerCase();
                const value = Number(item?.value) || 0;

                if (key === 'pending' || key === 'অপেক্ষমাণ') {
                    return { ...item, value: Math.max(value - 1, 0) };
                }
                if (key === 'resolved' || key === 'closed' || key === 'সমাধান' || key === 'বন্ধ') {
                    return { ...item, value: value + 1 };
                }
                return item;
            });

            const total = updated.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
            return updated.map(item => ({
                ...item,
                pct: total > 0 ? Number((((Number(item.value) || 0) / total) * 100).toFixed(1)) : 0,
            }));
        });
    };

    const handleApproveFound = async (id) => {
        try {
            const result = await approveFoundReport(id);
            if (result.success) {
                toast.success('Found report approved!');
                setPendingFoundReports(prev => prev.filter(r => r.id !== id));
                applyModerationCountUpdate();
                setSelectedFoundReport(null);
            }
        } catch (error) {
            toast.error('Failed to approve report');
        }
    };

    const handleRejectFound = async (id, reason) => {
        try {
            const result = await rejectFoundReport(id, reason);
            if (result.success) {
                toast.success('Found report rejected');
                setPendingFoundReports(prev => prev.filter(r => r.id !== id));
                applyModerationCountUpdate();
                setSelectedFoundReport(null);
            }
        } catch (error) {
            toast.error('Failed to reject report');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 size={28} className="animate-spin text-gray-300" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Welcome */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-black text-gray-800">
                        স্বাগতম, {user?.name?.split(' ')[0] || 'অ্যাডমিন'} 👋
                    </h1>
                    <p className="text-sm text-gray-400 mt-0.5">{today}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600
                                     bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        সিস্টেম সচল
                    </span>
                </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 xl:grid-cols-2 gap-4">
                <KpiCard title="মোট রিপোর্ট" value={stats.totalReports} sub="সর্বকালীন" color="bg-blue-50 text-blue-500" icon={FileText} />
                <KpiCard title="সক্রিয় নিখোঁজ" value={stats.activeMissing} sub={stats.totalReports ? `মোটের ${toBnDigits(((stats.activeMissing / stats.totalReports) * 100).toFixed(1))}%` : '—'} color="bg-amber-50 text-amber-500" icon={AlertTriangle} />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Bar chart */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="mb-5">
                        <h3 className="font-black text-gray-800 text-sm">মাসিক রিপোর্ট</h3>
                        <p className="text-xs text-gray-400 mt-0.5">সর্বশেষ মাসগুলো</p>
                    </div>
                    {monthlyData.length === 0 ? (
                        <EmptyState message="মাসিক তথ্য পাওয়া যায়নি" />
                    ) : (
                        <div className="flex items-end gap-3 h-36">
                            {monthlyData.map((d, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                                    <span className="text-[10px] font-bold text-gray-500">{toBnNumber(d.value)}</span>
                                    <div className="w-full rounded-t-lg bg-red-100 relative overflow-hidden"
                                        style={{ height: `${(d.value / barMax) * 120}px` }}>
                                        <div className="absolute inset-0 bg-gradient-to-t from-red-500 to-red-400 rounded-t-lg" />
                                    </div>
                                    <span className="text-[9px] text-gray-400">{toBnMonthLabel(d.label)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Donut */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="mb-4">
                        <h3 className="font-black text-gray-800 text-sm">স্ট্যাটাস বিভাজন</h3>
                        <p className="text-xs text-gray-400 mt-0.5">বর্তমান অবস্থা</p>
                    </div>
                    <DonutChart data={statusData} total={stats.totalReports} />
                </div>
            </div>

            {/* Division breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-black text-gray-800 text-sm mb-4">বিভাগভিত্তিক রিপোর্ট</h3>
                {divisions.length === 0 ? (
                    <EmptyState message="বিভাগ তথ্য পাওয়া যায়নি" />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {divisions.map((d, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="text-xs text-gray-500 w-20 text-right flex-shrink-0">{d.name}</span>
                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full"
                                        style={{ width: `${d.max > 0 ? (d.count / d.max) * 100 : 0}%` }} />
                                </div>
                                <span className="text-xs font-bold text-gray-700 w-8 flex-shrink-0">{d.count}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent reports table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                    <h3 className="font-black text-gray-800 text-sm">সাম্প্রতিক রিপোর্ট</h3>
                    <button
                        onClick={() => setShowAllRecentReports(prev => !prev)}
                        className="flex items-center gap-1 text-xs text-red-500 font-semibold hover:underline"
                    >
                        {showAllRecentReports ? 'কম দেখুন' : 'সব দেখুন'} <ArrowRight size={12} />
                    </button>
                </div>
                {reports.length === 0 ? (
                    <EmptyState message="কোনো রিপোর্ট নেই" />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-left">
                                    {['#', 'নাম', 'বয়স', 'বিভাগ', 'অবস্থা', 'তারিখ', 'অ্যাকশন'].map(h => (
                                        <th key={h} className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wide">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {visibleRecentReports.map(r => {
                                    const s = STATUS_STYLE[r.status] ?? STATUS_STYLE.pending;
                                    return (
                                        <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-5 py-3.5 text-xs text-gray-400 font-mono">#{toBnDigits(r.id)}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-black text-gray-500 flex-shrink-0">
                                                        {r.name?.[0] ?? '?'}
                                                    </div>
                                                    <span className="font-semibold text-gray-700 text-xs">{r.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-gray-500">{typeof r.age === 'number' || /^\d+(\.\d+)?$/.test(String(r.age ?? '')) ? toBnDigits(r.age) : (r.age ?? '—')}</td>
                                            <td className="px-5 py-3.5 text-xs text-gray-500">{r.division}</td>
                                            <td className="px-5 py-3.5">
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${s.cls}`}>{s.label}</span>
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-gray-400">{r.date ? toBnDigits(r.date) : '—'}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-1">
                                                    <button className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="দেখুন"><Eye size={13} /></button>
                                                    <button className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors" title="যাচাই করুন"><CheckCircle size={13} /></button>
                                                    <button className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="বন্ধ করুন"><AlertTriangle size={13} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pending Found Reports */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                    <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
                        <Zap size={14} className="text-purple-500" /> পাওয়া ব্যক্তির পেন্ডিং রিপোর্ট
                    </h3>
                    <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        {pendingFoundReports.length}
                    </span>
                </div>
                {pendingFoundReports.length === 0 ? (
                    <EmptyState message="কোনো পেন্ডিং রিপোর্ট নেই" />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-left">
                                    {['#', 'নাম', 'বিভাগ', 'খোঁজে পাওয়া', 'AI ম্যাচ', 'অ্যাকশন'].map(h => (
                                        <th key={h} className="px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wide">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {pendingFoundReports.map(r => {
                                    const matchCount = r.ai_matches?.length || 0;
                                    const highMatches = r.ai_matches?.filter(m => m.match_level === 'high')?.length || 0;
                                    return (
                                        <tr
                                            key={r.id}
                                            className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                                            onClick={() => setSelectedFoundReport(r)}
                                        >
                                            <td className="px-5 py-3.5 text-xs text-gray-400 font-mono">#{toBnDigits(r.id)}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-black text-gray-500 flex-shrink-0">
                                                        {r.name?.[0] ?? '?'}
                                                    </div>
                                                    <span className="font-semibold text-gray-700 text-xs">{r.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-gray-500">{r.district}</td>
                                            <td className="px-5 py-3.5 text-xs text-gray-500">{r.found_date ? toBnDigits(r.found_date) : '—'}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-1.5">
                                                    {highMatches > 0 && (
                                                        <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full">
                                                            {highMatches.toLocaleString('bn-BD')} উচ্চ
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-gray-500">মোট {matchCount.toLocaleString('bn-BD')}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedFoundReport(r);
                                                    }}
                                                    className="text-xs font-bold bg-purple-100 text-purple-600 px-3 py-1.5 rounded-lg hover:bg-purple-200 transition-colors"
                                                >
                                                    পর্যালোচনা
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Bottom row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Recent users */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-black text-gray-800 text-sm">সাম্প্রতিক ব্যবহারকারী</h3>
                        <button className="text-xs text-red-500 font-semibold hover:underline">সব দেখুন</button>
                    </div>
                    {recentUsers.length === 0 ? (
                        <EmptyState message="কোনো ব্যবহারকারী নেই" />
                    ) : (
                        <div className="space-y-3">
                            {recentUsers.map((u, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-400 flex-shrink-0">
                                        {u.name?.[0] ?? '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-gray-700 truncate">{u.name}</p>
                                        <p className="text-[10px] text-gray-400 truncate">{u.email}</p>
                                    </div>
                                    <span className="text-[10px] text-gray-400 flex-shrink-0">{u.joined}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Activity feed */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="font-black text-gray-800 text-sm mb-4">সিস্টেম কার্যক্রম</h3>
                    {activity.length === 0 ? (
                        <EmptyState message="কোনো কার্যক্রম নেই" />
                    ) : (
                        <div className="space-y-3">
                            {activity.map((a, i) => {
                                const Icon = ACTIVITY_ICON[a.type] ?? CheckCircle;
                                const clr = ACTIVITY_COLOR[a.type] ?? 'text-gray-400';
                                return (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className={`mt-0.5 flex-shrink-0 ${clr}`}><Icon size={13} /></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-gray-600 leading-snug">{a.text}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">{a.time}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {selectedFoundReport && (
                <FoundReportMatchModal
                    report={selectedFoundReport}
                    onClose={() => setSelectedFoundReport(null)}
                    onApprove={handleApproveFound}
                    onReject={handleRejectFound}
                />
            )}
        </div>
    );
}

function ReportsSection({ data }) {
    const { reports, loading } = data;
    const [filter, setFilter] = useState('all');

    const FILTERS = [
        { id: 'all', label: 'সব' },
        { id: 'pending', label: 'অপেক্ষমাণ' },
        { id: 'verified', label: 'যাচাইকৃত' },
        { id: 'matched', label: 'ম্যাচ পাওয়া' },
        { id: 'closed', label: 'বন্ধ' },
    ];

    const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter);

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-gray-800">রিপোর্ট ব্যবস্থাপনা</h2>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
                {FILTERS.map(f => {
                    const cnt = f.id === 'all' ? reports.length : reports.filter(r => r.status === f.id).length;
                    return (
                        <button key={f.id} onClick={() => setFilter(f.id)}
                            className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl whitespace-nowrap transition-all
                                        ${filter === f.id ? 'bg-red-500 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:border-red-300'}`}>
                            {f.label}
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full
                                              ${filter === f.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{cnt}</span>
                        </button>
                    );
                })}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-gray-300" /></div>
                ) : filtered.length === 0 ? (
                    <EmptyState message="কোনো রিপোর্ট নেই" />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50">
                                    {['#', 'নাম', 'বয়স', 'বিভাগ', 'অবস্থা', 'তারিখ', 'অ্যাকশন'].map(h => (
                                        <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map(r => {
                                    const s = STATUS_STYLE[r.status] ?? STATUS_STYLE.pending;
                                    return (
                                        <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-5 py-3.5 text-xs text-gray-400 font-mono">#{r.id}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-black text-gray-500">{r.name?.[0] ?? '?'}</div>
                                                    <span className="font-semibold text-gray-700 text-xs">{r.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-gray-500">{r.age}</td>
                                            <td className="px-5 py-3.5 text-xs text-gray-500">{r.division}</td>
                                            <td className="px-5 py-3.5"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${s.cls}`}>{s.label}</span></td>
                                            <td className="px-5 py-3.5 text-xs text-gray-400">{r.date}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-1">
                                                    <button className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Eye size={13} /></button>
                                                    <button className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg"><CheckCircle size={13} /></button>
                                                    <button className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg"><AlertTriangle size={13} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

function UsersSection({ data }) {
    const { recentUsers, loading } = data;
    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-gray-800">ব্যবহারকারী ব্যবস্থাপনা</h2>
                <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input placeholder="ইমেইল বা নাম খুঁজুন..." className="pl-8 pr-4 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 w-52" />
                </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20"><Loader2 size={24} className="animate-spin text-gray-300" /></div>
                ) : recentUsers.length === 0 ? (
                    <EmptyState message="কোনো ব্যবহারকারী নেই" />
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50">
                                {['ব্যবহারকারী', 'যোগদান', 'রিপোর্ট', 'অবস্থা', 'অ্যাকশন'].map(h => (
                                    <th key={h} className="px-5 py-3 text-left text-[11px] font-bold text-gray-400 uppercase">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {recentUsers.map((u, i) => (
                                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-black text-gray-500">{u.name?.[0] ?? '?'}</div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-700">{u.name}</p>
                                                <p className="text-[10px] text-gray-400">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-3.5 text-xs text-gray-400">{u.joined}</td>
                                    <td className="px-5 py-3.5 text-xs font-semibold text-gray-700">{u.reportCount ?? 0}</td>
                                    <td className="px-5 py-3.5">
                                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">সক্রিয়</span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-1">
                                            <button className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Eye size={13} /></button>
                                            <button className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg"><Shield size={13} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function AnalyticsSection({ data }) {
    const { stats, monthlyData, statusData, divisions } = data;
    const barMax = monthlyData.length ? Math.max(...monthlyData.map(d => d.value)) : 1;

    return (
        <div className="space-y-5">
            <h2 className="text-xl font-black text-gray-800">বিশ্লেষণ</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="font-black text-gray-800 text-sm mb-4">মাসিক রিপোর্ট ট্রেন্ড</h3>
                    {monthlyData.length === 0 ? (
                        <EmptyState message="তথ্য নেই" />
                    ) : (
                        <div className="flex items-end gap-3 h-44">
                            {monthlyData.map((d, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                                    <span className="text-[10px] font-bold text-gray-500">{toBnNumber(d.value)}</span>
                                    <div className="w-full rounded-t-lg relative overflow-hidden bg-red-50"
                                        style={{ height: `${(d.value / barMax) * 150}px` }}>
                                        <div className="absolute inset-0 bg-gradient-to-t from-red-500 to-red-400 rounded-t-lg" />
                                    </div>
                                    <span className="text-[9px] text-gray-400">{toBnMonthLabel(d.label)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
                    <h3 className="font-black text-gray-800 text-sm mb-4">স্ট্যাটাস বিভাজন</h3>
                    <div className="flex-1 flex items-center justify-center">
                        <DonutChart data={statusData} total={stats.totalReports} />
                    </div>
                </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-black text-gray-800 text-sm mb-4">বিভাগভিত্তিক বিশ্লেষণ</h3>
                {divisions.length === 0 ? (
                    <EmptyState message="বিভাগ তথ্য নেই" />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {divisions.map((d, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="text-xs text-gray-500 w-24 text-right">{d.name}</span>
                                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full"
                                        style={{ width: `${d.max > 0 ? (d.count / d.max) * 100 : 0}%` }} />
                                </div>
                                <span className="text-xs font-bold text-gray-700 w-10">{toBnNumber(d.count)}</span>
                                <span className="text-[10px] text-gray-400">
                                    {stats.totalReports > 0 ? toBnDigits(((d.count / stats.totalReports) * 100).toFixed(1)) : toBnDigits(0)}%
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────────── */
const SECTIONS = {
    overview: OverviewSection,
    reports: ReportsSection,
    users: UsersSection,
    analytics: AnalyticsSection,
};

export default function AdminDashboardPage() {
    const [activeSection, setActiveSection] = useState('overview');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    /* All live data is managed here — wire up via useAdminData() hook */
    const adminData = useAdminData();

    const Section = SECTIONS[activeSection] ?? OverviewSection;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Desktop sidebar */}
            <div className="hidden lg:flex">
                <AdminSidebar active={activeSection} onNav={setActiveSection}
                    collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(p => !p)} />
            </div>

            {/* Mobile sidebar overlay */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex">
                    <div className="flex-shrink-0">
                        <AdminSidebar active={activeSection}
                            onNav={id => { setActiveSection(id); setMobileOpen(false); }}
                            collapsed={false} onToggle={() => setMobileOpen(false)} />
                    </div>
                    <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
                </div>
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <AdminNavbar
                    breadcrumb={activeSection === 'overview' ? 'ওভারভিউ'
                        : activeSection === 'reports' ? 'রিপোর্ট ব্যবস্থাপনা'
                            : activeSection === 'users' ? 'ব্যবহারকারী'
                                : 'বিশ্লেষণ'}
                    onMobileMenu={() => setMobileOpen(true)} />

                {/* Scrollable content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                    <Section data={adminData} />
                </main>
            </div>
        </div>
    );
}
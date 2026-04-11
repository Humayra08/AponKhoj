import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    FileText, Bell, Users, Clock,
    Search, MapPin, ChevronRight, ChevronLeft, Zap, Eye, X,
    UserCircle2, AlertTriangle, Settings
} from 'lucide-react';
import { useAuth } from '../helpers/AuthContext';
import apiClient from '../api';
import { getMyMissingReports } from '../helpers/missingReportService';
import { getMyFoundReports, getMyFoundAiMatchReports, getMyFoundAiMatchDetails } from '../helpers/foundReportService';

const formatDateBN = (dateStr) => {
    if (!dateStr) return '—';

    const normalized = String(dateStr).replace(' ', 'T');
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
};

const formatBnNumber = (value) => new Intl.NumberFormat('bn-BD').format(Number(value || 0));

const formatReportStatusBN = (status) => {
    const labels = {
        pending: 'অপেক্ষমাণ',
        published: 'প্রকাশিত',
        rejected: 'প্রত্যাখ্যাত',
    };
    return labels[status] || status;
};

const getReportTypeLabelBN = (reportType) => reportType === 'found' ? 'উদ্ধার রিপোর্ট' : 'নিখোঁজ রিপোর্ট';

const getReportAge = (report) => {
    if (report?.age != null) return report.age;
    if (report?.approximate_age != null) return report.approximate_age;
    return null;
};

const getReportEventDate = (report) => report?.last_seen_date || report?.found_date || null;
const getReportEventTime = (report) => report?.last_seen_time || report?.found_time || null;
const getReportAppearance = (report) => report?.clothing_description || report?.physical_description || null;
const sanitizeAiReasoning = (reasoning) => {
    if (!reasoning) return '';
    return String(reasoning)
        .split('\n')
        .filter(line => !/rule\s*[- ]?based|score\s*breakdown|name_score|district_score|location_score|age_score|gender_score|description_score/i.test(line))
        .join('\n')
        .trim();
};

// Status Badge 
const StatusBadge = ({ status }) => {
    const styles = {
        pending: 'bg-yellow-50 text-yellow-600 border-yellow-200',
        published: 'bg-teal-50 text-teal-600 border-teal-200',
        rejected: 'bg-red-50 text-red-600 border-red-200',
        closed: 'bg-gray-50 text-gray-500 border-gray-200',
    };
    const labels = {
        pending: 'অপেক্ষমাণ',
        published: 'প্রকাশিত',
        rejected: 'প্রত্যাখ্যাত',
        closed: 'বন্ধ',
    };
    return (
        <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${styles[status] || styles.pending}`}>
            {labels[status] || status}
        </span>
    );
};

// Skeleton Loader 
const Skeleton = ({ className = '' }) => (
    <div className={`animate-pulse bg-gray-100 rounded-lg ${className}`} />
);

// Main Component
export default function UserDashboardPage() {
    const { user } = useAuth();                          // real user from AuthContext
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [stats, setStats] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);
    const [aiMatchReports, setAiMatchReports] = useState([]);
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [aiDetailsLoading, setAiDetailsLoading] = useState(false);
    const [selectedAiMatchDetails, setSelectedAiMatchDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    const closeAiModal = () => {
        setAiModalOpen(false);
        setSelectedAiMatchDetails(null);
        setAiDetailsLoading(false);
    };

    const openAiMatchList = () => {
        setAiModalOpen(true);
        setSelectedAiMatchDetails(null);
    };

    const openAiMatchDetails = async (reportId) => {
        setAiDetailsLoading(true);
        const result = await getMyFoundAiMatchDetails(reportId);
        if (result.success) {
            setSelectedAiMatchDetails({
                foundReport: result.foundReport,
                matches: result.matches,
                total: result.total,
            });
        } else {
            setSelectedAiMatchDetails({
                foundReport: null,
                matches: [],
                total: 0,
                message: result.message || 'AI match তথ্য পাওয়া যায়নি',
            });
        }
        setAiDetailsLoading(false);
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsData, myMissingReportsData, myFoundReportsData, aiMatchReportsData] = await Promise.all([
                    apiClient.getUserStats(),
                    getMyMissingReports(),
                    getMyFoundReports(),
                    getMyFoundAiMatchReports(),
                ]);

                setStats(statsData);

                const missingReports = myMissingReportsData.success
                    ? (myMissingReportsData.reports || []).map(r => ({ ...r, report_type: 'missing' }))
                    : [];

                const foundReports = myFoundReportsData.success
                    ? (myFoundReportsData.reports || []).map(r => ({ ...r, report_type: 'found' }))
                    : [];

                const mergedReports = [...missingReports, ...foundReports].sort((a, b) => {
                    const aTime = new Date((a?.created_at || '').replace(' ', 'T')).getTime() || 0;
                    const bTime = new Date((b?.created_at || '').replace(' ', 'T')).getTime() || 0;
                    return bTime - aTime;
                });

                setReports(mergedReports);
                setAiMatchReports(aiMatchReportsData.success ? (aiMatchReportsData.reports || []) : []);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
                setStats(null);
                setReports([]);
                setAiMatchReports([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
                    <Skeleton className="w-48 h-7" />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-3">
                            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-2xl" />)}
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-48 rounded-2xl" />
                            <Skeleton className="h-32 rounded-2xl" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

                {/* ── Welcome ── */}
                <div className="mb-6">
                    <h1 className="text-2xl font-black text-gray-800">
                        স্বাগতম{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! 👋
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">আপনার ড্যাশবোর্ড থেকে সব কার্যক্রম পরিচালনা করুন</p>
                </div>

                {/* ── AI Match Alert Banner (only shown if a match exists) ── */}
                {/* TODO: show when stats?.hasMatch === true */}
                {/* {stats?.hasMatch && ( */}
                {/*   <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl p-4 mb-6 ..."> ... </div> */}
                {/* )} */}

                {/* ── Stats ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-secondary/10 text-secondary">
                            <FileText size={20} />
                        </div>
                        <div>
                            <p className="text-xl font-black text-gray-800">{stats?.totalReports != null ? formatBnNumber(stats.totalReports) : '—'}</p>
                            <p className="text-[11px] text-gray-400 leading-tight">আমার রিপোর্ট</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary/10 text-primary">
                            <Bell size={20} />
                        </div>
                        <div>
                            <p className="text-xl font-black text-gray-800">{stats?.activeAlerts != null ? formatBnNumber(stats.activeAlerts) : '—'}</p>
                            <p className="text-[11px] text-gray-400 leading-tight">সক্রিয় আলার্ট</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-teal-100 text-teal-600">
                            <Users size={20} />
                        </div>
                        <div>
                            <p className="text-xl font-black text-gray-800">{stats?.successCount != null ? formatBnNumber(stats.successCount) : '—'}</p>
                            <p className="text-[11px] text-gray-400 leading-tight">সফল পুনর্মিলন</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={openAiMatchList}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3 text-left transition-colors hover:bg-purple-50/50 hover:border-purple-200"
                    >
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-purple-100 text-purple-600">
                            <Zap size={20} />
                        </div>
                        <div>
                            <p className="text-xl font-black text-gray-800">
                                {formatBnNumber(aiMatchReports.length)}
                            </p>
                            <p className="text-[11px] text-gray-400 leading-tight">AI ম্যাচ পরীক্ষা</p>
                        </div>
                    </button>
                </div>

                {/* ── Main Grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── Left: Reports + Quick Actions ── */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* My Reports */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                                <h2 className="font-bold text-gray-800">আমার রিপোর্টসমূহ</h2>
                                <span className="text-xs text-primary flex items-center gap-1">
                                    {formatBnNumber(reports.length)} টি <ChevronRight size={12} />
                                </span>
                            </div>

                            {reports.length === 0 ? (
                                <div className="text-center py-12 px-4">
                                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                        <FileText size={22} className="text-gray-300" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-500">এখনো কোনো রিপোর্ট জমা নেই</p>
                                    <p className="text-xs text-gray-400 mt-1">নিচের বাটন থেকে একটি নতুন রিপোর্ট তৈরি করুন</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {reports.map(r => (
                                        <button
                                            key={`${r.report_type || 'missing'}-${r.id}`}
                                            type="button"
                                            onClick={() => setSelectedReport(r)}
                                            className="w-full text-left flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors group"
                                        >
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black ${r.status === 'rejected' ? 'bg-red-50 text-red-600' : r.status === 'pending' ? 'bg-yellow-50 text-yellow-600' : 'bg-teal-50 text-teal-600'}`}>
                                                {r.name?.[0] || '?'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-baseline gap-2">
                                                    <p className="text-sm font-bold text-gray-800 truncate">{r.name}</p>
                                                    <span className="text-xs text-gray-400 flex-shrink-0">{getReportAge(r) != null ? `~${formatBnNumber(getReportAge(r))} বছর` : 'বয়স অজানা'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <MapPin size={10} className="text-gray-300 flex-shrink-0" />
                                                    <span className="text-xs text-gray-400 truncate">{r.district}</span>
                                                    <span className="text-gray-200 text-xs">•</span>
                                                    <Clock size={10} className="text-gray-300 flex-shrink-0" />
                                                    <span className="text-xs text-gray-400 flex-shrink-0">{formatDateBN(r.created_at)}</span>
                                                    <span className="text-gray-200 text-xs">•</span>
                                                    <span className="text-[10px] text-gray-400 flex-shrink-0">{getReportTypeLabelBN(r.report_type)}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <StatusBadge status={r.status} />
                                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors">
                                                        <Eye size={13} />
                                                    </span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="px-5 py-3 border-t border-gray-50 flex gap-3">
                                <Link to="/report-missing" className="flex-1 text-center text-xs font-bold py-2 rounded-xl bg-secondary/5 text-secondary hover:bg-secondary/10 transition-colors">
                                    + নিখোঁজ রিপোর্ট
                                </Link>
                                <Link to="/report-found" className="flex-1 text-center text-xs font-bold py-2 rounded-xl bg-teal-50 text-teal-600 hover:bg-teal-100 transition-colors">
                                    + উদ্ধার তথ্য
                                </Link>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { to: '/search', label: 'তালিকায় অনুসন্ধান', desc: 'নিখোঁজ তালিকা দেখুন', icon: Search, bg: 'bg-primary/5 border-primary/20', text: 'text-primary' },
                                { to: '/alerts', label: 'আলার্ট সাবস্ক্রাইব', desc: 'এলাকা-ভিত্তিক আলার্ট', icon: Bell, bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-600' },
                                { to: '/ai-match', label: 'AI ম্যাচ দেখুন', desc: 'মুখ শনাক্তকরণ ফলাফল', icon: Zap, bg: 'bg-purple-50 border-purple-200', text: 'text-purple-600' },
                                { to: '/profile', label: 'প্রোফাইল সম্পাদনা', desc: 'তথ্য আপডেট করুন', icon: UserCircle2, bg: 'bg-gray-50 border-gray-200', text: 'text-gray-600' },
                            ].map(a => (
                                <Link key={a.to} to={a.to} className={`flex items-start gap-3 border rounded-2xl p-4 hover:shadow-sm transition-all ${a.bg}`}>
                                    <a.icon size={18} className={`mt-0.5 flex-shrink-0 ${a.text}`} />
                                    <div>
                                        <p className={`text-sm font-bold ${a.text}`}>{a.label}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{a.desc}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* ── Right Sidebar ── */}
                    <div className="space-y-5">

                        {/* Notifications */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                                <h2 className="font-bold text-gray-800">বিজ্ঞপ্তি</h2>
                                {notifications.filter(n => n.urgent).length > 0 && (
                                    <span className="bg-secondary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                        {notifications.filter(n => n.urgent).length}
                                    </span>
                                )}
                            </div>
                            {notifications.length === 0 ? (
                                <div className="text-center py-8 px-4">
                                    <Bell size={22} className="text-gray-200 mx-auto mb-2" />
                                    <p className="text-xs text-gray-400">কোনো বিজ্ঞপ্তি নেই</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {/* TODO: notifications will come from API */}
                                    {notifications.map((n, i) => (
                                        <div key={n.id || i} className={`flex items-start gap-3 px-4 py-3 ${n.urgent ? 'bg-purple-50/40' : ''}`}>
                                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.urgent ? 'bg-purple-500' : 'bg-gray-200'}`} />
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-700 leading-relaxed">{n.text}</p>
                                                <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Profile Card */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <h2 className="font-bold text-gray-800 text-sm mb-4">আমার তথ্য</h2>
                            <div className="space-y-2.5 text-xs text-gray-500 mb-4">
                                <div className="flex items-center gap-2">
                                    <UserCircle2 size={13} className="text-gray-300 flex-shrink-0" />
                                    <span>{user?.name || '—'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={13} className="text-gray-300 flex-shrink-0" />
                                    <span>{user?.district || '—'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-300 text-[11px]">☎</span>
                                    <span>{user?.phone || '—'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-300 text-[11px]">📅</span>
                                    <span>যোগদান: {formatDateBN(user?.created_at)}</span>
                                </div>
                            </div>
                            <Link to="/profile" className="flex items-center justify-center gap-2 w-full border border-gray-200 text-gray-600 text-xs py-2 rounded-xl hover:border-primary hover:text-primary transition-colors font-medium">
                                <Settings size={12} /> প্রোফাইল সম্পাদনা
                            </Link>
                        </div>

                        {/* Emergency */}
                        <div className="bg-secondary/5 border border-secondary/20 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle size={16} className="text-secondary" />
                                <p className="text-sm font-bold text-secondary">জরুরি সহায়তা</p>
                            </div>
                            <p className="text-xs text-gray-500 mb-3">পুলিশ নিয়ন্ত্রণ কক্ষ বা জরুরি সেবা</p>
                            <a href="tel:999" className="text-2xl font-black text-secondary hover:scale-105 transition-transform inline-flex">
                                📞 999
                            </a>
                        </div>

                    </div>
                </div>
            </div>

            {aiModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
                            <div className="flex items-center gap-2">
                                {selectedAiMatchDetails && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedAiMatchDetails(null)}
                                        className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 flex items-center justify-center"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                )}
                                <h3 className="text-lg font-black text-gray-800">
                                    {selectedAiMatchDetails ? 'AI ম্যাচ বিস্তারিত' : 'আমার AI ম্যাচ রিপোর্ট'}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={closeAiModal}
                                className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 flex items-center justify-center"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {!selectedAiMatchDetails && (
                            <div className="p-5">
                                {aiMatchReports.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Zap size={30} className="text-purple-200 mx-auto mb-3" />
                                        <p className="text-sm font-medium text-gray-500">এখনো কোনো AI ম্যাচ পাওয়া যায়নি</p>
                                        <p className="text-xs text-gray-400 mt-1">অ্যাডমিন অনুমোদনের পর প্রকাশিত রিপোর্টে AI ম্যাচ দেখা যাবে</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {aiMatchReports.map((r) => (
                                            <button
                                                key={`ai-${r.id}`}
                                                type="button"
                                                onClick={() => openAiMatchDetails(r.id)}
                                                className="w-full text-left border border-gray-100 rounded-xl p-4 hover:border-purple-200 hover:bg-purple-50/20 transition-colors"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-gray-800 truncate">{r.name || 'অজ্ঞাত ব্যক্তি'}</p>
                                                        <p className="text-xs text-gray-400 mt-1">{r.district || '—'} • {formatDateBN(r.created_at)}</p>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-sm font-bold text-purple-600">{formatBnNumber(r.ai_match_count || 0)} টি</p>
                                                        <p className="text-[10px] text-gray-400">ম্যাচ পাওয়া গেছে</p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedAiMatchDetails && (
                            <div className="p-5 space-y-5">
                                {aiDetailsLoading && (
                                    <div className="space-y-3">
                                        <Skeleton className="h-20 rounded-xl" />
                                        <Skeleton className="h-24 rounded-xl" />
                                    </div>
                                )}

                                {!aiDetailsLoading && selectedAiMatchDetails.foundReport && (
                                    <>
                                        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                                            <p className="text-xs text-purple-500 mb-1">উদ্ধার রিপোর্ট</p>
                                            <p className="text-sm font-bold text-gray-800">{selectedAiMatchDetails.foundReport.name || 'অজ্ঞাত ব্যক্তি'}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {selectedAiMatchDetails.foundReport.district || '—'} • {formatDateBN(selectedAiMatchDetails.foundReport.created_at)}
                                            </p>
                                        </div>

                                        {selectedAiMatchDetails.matches.length === 0 ? (
                                            <div className="text-center py-8 text-sm text-gray-500">এই রিপোর্টে এখনো AI ম্যাচ পাওয়া যায়নি</div>
                                        ) : (
                                            <div className="space-y-3">
                                                {selectedAiMatchDetails.matches.map((m, idx) => (
                                                    <button
                                                        key={`m-${m.missing_report_id || idx}`}
                                                        type="button"
                                                        onClick={() => {
                                                            if (!m.missing_report_id) return;
                                                            closeAiModal();
                                                            navigate(`/emergency/${m.missing_report_id}`);
                                                        }}
                                                        className="w-full text-left border border-gray-100 rounded-xl p-4 transition-colors hover:bg-purple-50/30 hover:border-purple-200"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-800">{m.missing_name || 'অজ্ঞাত ব্যক্তি'}</p>
                                                                <p className="text-xs text-gray-500 mt-1">{m.missing_district || '—'} • {m.missing_last_seen ? formatDateBN(m.missing_last_seen) : '—'}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-bold text-teal-600">{Math.round(Number(m.total_score || 0))}%</p>
                                                                <p className="text-[10px] text-gray-400">ম্যাচ স্কোর</p>
                                                            </div>
                                                        </div>
                                                        {sanitizeAiReasoning(m.ai_reasoning) && (
                                                            <p className="text-xs text-gray-600 mt-3 leading-relaxed">{sanitizeAiReasoning(m.ai_reasoning)}</p>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}

                                {!aiDetailsLoading && !selectedAiMatchDetails.foundReport && (
                                    <div className="text-center py-8 text-sm text-gray-500">
                                        {selectedAiMatchDetails.message || 'AI match তথ্য পাওয়া যায়নি'}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {selectedReport && (
                <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                    <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
                            <h3 className="text-lg font-black text-gray-800">রিপোর্ট বিস্তারিত</h3>
                            <button
                                type="button"
                                onClick={() => setSelectedReport(null)}
                                className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 flex items-center justify-center"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-5 space-y-5">
                            {selectedReport.photo_url && (
                                <div>
                                    <p className="text-xs text-gray-400 mb-2">রিপোর্টের ছবি</p>
                                    <img
                                        src={selectedReport.photo_url}
                                        alt={selectedReport.name || 'Report photo'}
                                        className="w-full max-h-80 object-cover rounded-xl border border-gray-100"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">রিপোর্টের ধরন</p>
                                    <p className="text-sm font-semibold text-gray-700">{getReportTypeLabelBN(selectedReport.report_type)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">নাম</p>
                                    <p className="text-sm font-bold text-gray-800">{selectedReport.name || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">স্ট্যাটাস</p>
                                    <p className="text-sm font-semibold text-gray-700">{formatReportStatusBN(selectedReport.status)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">বয়স</p>
                                    <p className="text-sm font-semibold text-gray-700">{getReportAge(selectedReport) != null ? `${formatBnNumber(getReportAge(selectedReport))} বছর` : '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">লিঙ্গ</p>
                                    <p className="text-sm font-semibold text-gray-700">{selectedReport.gender || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">উচ্চতা</p>
                                    <p className="text-sm font-semibold text-gray-700">{selectedReport.height || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">জমাদানের তারিখ</p>
                                    <p className="text-sm font-semibold text-gray-700">{formatDateBN(selectedReport.created_at)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">{selectedReport.report_type === 'found' ? 'উদ্ধারের তারিখ' : 'সর্বশেষ দেখা'}</p>
                                    <p className="text-sm font-semibold text-gray-700">{getReportEventDate(selectedReport) ? formatDateBN(getReportEventDate(selectedReport)) : '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">{selectedReport.report_type === 'found' ? 'উদ্ধারের সময়' : 'সর্বশেষ দেখা সময়'}</p>
                                    <p className="text-sm font-semibold text-gray-700">{getReportEventTime(selectedReport) || '—'}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-gray-400 mb-1">জেলা</p>
                                <p className="text-sm text-gray-700">{selectedReport.district || '—'}</p>
                            </div>

                            <div>
                                <p className="text-xs text-gray-400 mb-1">ঠিকানা</p>
                                <p className="text-sm text-gray-700">{selectedReport.address || '—'}</p>
                            </div>

                            <div>
                                <p className="text-xs text-gray-400 mb-1">{selectedReport.report_type === 'found' ? 'শারীরিক বিবরণ' : 'পোশাকের বিবরণ'}</p>
                                <p className="text-sm text-gray-700">{getReportAppearance(selectedReport) || '—'}</p>
                            </div>

                            <div>
                                <p className="text-xs text-gray-400 mb-1">অতিরিক্ত তথ্য</p>
                                <p className="text-sm text-gray-700">{selectedReport.additional_info || '—'}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">যোগাযোগের ব্যক্তি</p>
                                    <p className="text-sm text-gray-700">{selectedReport.contact_person_name || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 mb-1">যোগাযোগ নম্বর</p>
                                    <p className="text-sm text-gray-700">{selectedReport.contact_phone || '—'}</p>
                                </div>
                            </div>

                            {selectedReport.status === 'rejected' && selectedReport.rejection_reason && (
                                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                                    <p className="text-xs text-red-500 mb-1">প্রত্যাখ্যানের কারণ</p>
                                    <p className="text-sm text-red-700">{selectedReport.rejection_reason}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
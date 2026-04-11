import { useEffect, useState } from 'react';
import { X, Zap, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { getFoundReportMatches } from '../helpers/foundReportService';

const FoundReportMatchModal = ({ report, onClose, onApprove, onReject }) => {
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [matches, setMatches] = useState(report.ai_matches || []);
    const [loadingMatches, setLoadingMatches] = useState(false);
    const visibleMatches = matches.filter((match) => Number(match.total_score) >= 60);

    useEffect(() => {
        let mounted = true;

        const loadMatches = async () => {
            setLoadingMatches(true);
            const result = await getFoundReportMatches(report.id);

            if (!mounted) return;

            if (result.success && Array.isArray(result.matches)) {
                setMatches(result.matches);
            } else {
                setMatches(report.ai_matches || []);
            }

            setLoadingMatches(false);
        };

        loadMatches();

        return () => {
            mounted = false;
        };
    }, [report.id, report.ai_matches]);

    const handleApprove = async () => {
        setLoading(true);
        await onApprove(report.id);
        setLoading(false);
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) {
            toast.error('প্রত্যাখ্যানের কারণ প্রদান করুন');
            return;
        }
        setLoading(true);
        await onReject(report.id, rejectReason);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">
                            উদ্ধার রিপোর্ট #{report.id} — {report.name || 'অজানা'}
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                            {report.district} এলাকায় পাওয়া গেছে {report.found_date || '—'} তারিখে
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Found Report Summary */}
                    <div className="bg-accent-teal/5 border border-accent-teal/20 rounded-xl p-4">
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <User size={16} className="text-accent-teal" /> উদ্ধারকৃত পোস্টের পূর্ণ তথ্য
                        </h3>

                        {report.photo_url ? (
                            <div className="mb-4">
                                <img
                                    src={report.photo_url}
                                    alt={report.name || 'উদ্ধারকৃত ব্যক্তি'}
                                    className="w-full max-h-56 object-cover rounded-xl border border-white shadow-sm"
                                />
                            </div>
                        ) : null}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                                <span className="text-xs text-gray-500">নাম</span>
                                <p className="font-medium">{report.name || '—'}</p>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500">বয়স</span>
                                <p className="font-medium">{report.approximate_age || '—'}</p>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500">লিঙ্গ</span>
                                <p className="font-medium">{report.gender || '—'}</p>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500">স্বাস্থ্য অবস্থা</span>
                                <p className="font-medium">{report.health_status || 'unknown'}</p>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500">পাওয়ার তারিখ</span>
                                <p className="font-medium">{report.found_date || '—'}</p>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500">পাওয়ার সময়</span>
                                <p className="font-medium">{report.found_time || '—'}</p>
                            </div>
                            <div className="md:col-span-2">
                                <span className="text-xs text-gray-500">জেলা</span>
                                <p className="font-medium">{report.district || '—'}</p>
                            </div>
                            <div className="md:col-span-2">
                                <span className="text-xs text-gray-500">ঠিকানা</span>
                                <p className="font-medium">{report.address || '—'}</p>
                            </div>
                            <div className="md:col-span-2">
                                <span className="text-xs text-gray-500">শারীরিক বিবরণ</span>
                                <p className="font-medium text-sm">{report.physical_description || '—'}</p>
                            </div>
                            <div className="md:col-span-2">
                                <span className="text-xs text-gray-500">অতিরিক্ত তথ্য</span>
                                <p className="font-medium text-sm">{report.additional_info || '—'}</p>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500">যোগাযোগের নাম</span>
                                <p className="font-medium">{report.contact_person_name || '—'}</p>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500">যোগাযোগের ফোন</span>
                                <p className="font-medium">{report.contact_phone || '—'}</p>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500">রিপোর্টের স্ট্যাটাস</span>
                                <p className="font-medium">{report.status || 'pending'}</p>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500">জমা দেওয়ার সময়</span>
                                <p className="font-medium">{report.created_at || '—'}</p>
                            </div>
                        </div>
                    </div>

                    {/* AI Matches */}
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <Zap size={16} className="text-purple-500" />
                            AI মিল ({visibleMatches.length})
                        </h3>

                        {loadingMatches && matches.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500">মিল খোঁজা হচ্ছে...</p>
                            </div>
                        ) : visibleMatches.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500">কোনো AI মিল পাওয়া যায়নি</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {visibleMatches.map((match, i) => (
                                    <div
                                        key={i}
                                        className={`border rounded-lg p-4 ${
                                            match.match_level === 'high'
                                                ? 'border-green-200 bg-green-50'
                                                : match.match_level === 'medium'
                                                ? 'border-blue-200 bg-blue-50'
                                                : 'border-gray-200 bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <p className="font-semibold text-gray-800">{match.missing_name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {match.missing_district} থেকে নিখোঁজ
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-black text-gray-800">
                                                    {match.total_score}%
                                                </div>
                                                <span
                                                    className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                                                        match.match_level === 'high'
                                                            ? 'bg-green-200 text-green-700'
                                                            : match.match_level === 'medium'
                                                            ? 'bg-blue-200 text-blue-700'
                                                            : 'bg-gray-200 text-gray-700'
                                                    }`}
                                                >
                                                    {match.match_level.toUpperCase()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Score Breakdown */}
                                        <div className="text-xs text-gray-600 space-y-1 mt-2 pt-2 border-t border-gray-200">
                                            <div className="flex justify-between">
                                                <span>নাম:</span>
                                                <span className="font-medium">{match.name_score}/35</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>জেলা:</span>
                                                <span className="font-medium">{match.district_score}/25</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>অবস্থান:</span>
                                                <span className="font-medium">{match.location_score}/20</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>বয়স:</span>
                                                <span className="font-medium">{match.age_score}/10</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>লিঙ্গ:</span>
                                                <span className="font-medium">{match.gender_score}/5</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>বিবরণ:</span>
                                                <span className="font-medium">{match.description_score}/5</span>
                                            </div>
                                        </div>

                                        {match.ai_reasoning && match.ai_reasoning !== 'Rule-based score' && (
                                            <div className="mt-2 pt-2 border-t border-gray-200">
                                                <p className="text-xs italic text-gray-600">
                                                    "{match.ai_reasoning}"
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Rejection Form */}
                    {showRejectForm && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <h4 className="font-semibold text-red-900 mb-2">প্রত্যাখ্যান ও অপসারণ</h4>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="প্রত্যাখ্যানের কারণ লিখুন..."
                                rows={3}
                                className="w-full border border-red-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                            />
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                        বন্ধ করুন
                    </button>

                    {!showRejectForm ? (
                        <>
                            <button
                                onClick={() => setShowRejectForm(true)}
                                className="px-4 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200 font-medium hover:bg-red-100 transition-colors"
                            >
                                প্রত্যাখ্যান
                            </button>
                            <button
                                onClick={handleApprove}
                                disabled={loading}
                                className="px-4 py-2 rounded-lg bg-accent-teal text-white font-medium hover:bg-teal-800 disabled:opacity-60 transition-colors flex items-center gap-2"
                            >
                                {loading ? '...' : '✓ অনুমোদন ও প্রকাশ'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => {
                                    setShowRejectForm(false);
                                    setRejectReason('');
                                }}
                                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                            >
                                বাতিল
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={loading || !rejectReason.trim()}
                                className="px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-60 transition-colors"
                            >
                                {loading ? '...' : 'প্রত্যাখ্যান নিশ্চিত করুন'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FoundReportMatchModal;

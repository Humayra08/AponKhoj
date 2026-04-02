import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Shirt, ArrowRight, SlidersHorizontal, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { getPublishedReports } from '../helpers/missingReportService';

// ── Avatar helper: DiceBear cartoon/sketch style by gender + seed ──
const avatar = (seed, gender, age) => {
    if (!seed) return `https://api.dicebear.com/7.x/shapes/png?seed=unknown&size=200&backgroundColor=e8e0d5`;
    const isChild = age < 12;
    const style = gender === 'female'
        ? (isChild ? 'lorelei' : 'lorelei')
        : (isChild ? 'adventurer' : 'adventurer');
    const bg = gender === 'female' ? 'f7ede2' : 'd6e8f7';
    return `https://api.dicebear.com/7.x/${style}/png?seed=${encodeURIComponent(seed)}&size=300&backgroundColor=${bg}`;
};

const DIVISIONS = ['পুরো বাংলাদেশ', 'ঢাকা', 'চট্টগ্রাম', 'সিলেট', 'রাজশাহী', 'খুলনা', 'বরিশাল', 'রংপুর', 'ময়মনসিংহ'];
const SORT_OPTIONS = ['সর্বশেষ আগে', 'সবচেয়ে পুরনো', 'বয়স (কম-বেশি)'];
const COLORS = ['লাল', 'নীল', 'হলুদ', 'সাদা', 'কালো', 'সবুজ'];
const PER_PAGE = 6;

const StatusBadge = () => (
    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white">
        অনুমোদিত
    </span>
);

const normalizeReport = (report) => ({
    id: report.id,
    name: report.name || 'অজ্ঞাত ব্যক্তি',
    age: report.age ?? null,
    gender: report.gender || 'other',
    division: report.district || 'অজানা',
    district: report.address ? `${report.address}, ${report.district}` : (report.district || 'অজানা'),
    clothing: report.clothing_description || 'উল্লেখ নেই',
    status: 'approved',
    date: report.last_seen_date || report.created_at || '—',
    seed: `report-${report.id}`,
    photo_url: report.photo_url || '',
    last_seen_date: report.last_seen_date,
    contact_person_name: report.contact_person_name,
    contact_phone: report.contact_phone,
    address: report.address,
    additional_info: report.additional_info,
    height: report.height,
});

export default function SearchPage() {
    const [activeDiv, setActiveDiv] = useState('পুরো বাংলাদেশ');
    const [ageRange, setAgeRange] = useState(100);
    const [selectedColors, setSelectedColors] = useState([]);
    const [sortBy, setSortBy] = useState('সর্বশেষ আগে');
    const [page, setPage] = useState(1);
    const [nearbyOnly, setNearbyOnly] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let mounted = true;

        const loadReports = async () => {
            setLoading(true);
            setError('');

            const result = await getPublishedReports();

            if (!mounted) return;

            if (result.success) {
                setReports((result.reports || []).map(normalizeReport));
            } else {
                setReports([]);
                setError(result.message || 'অনুমোদিত রিপোর্ট লোড করা যায়নি');
            }

            setLoading(false);
        };

        loadReports();

        return () => {
            mounted = false;
        };
    }, []);

    const toggleColor = (c) =>
        setSelectedColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

    const clearAll = () => {
        setActiveDiv('পুরো বাংলাদেশ');
        setAgeRange(100);
        setSelectedColors([]);
        setNearbyOnly(false);
        setPage(1);
    };

    const filtered = useMemo(() => {
        return reports.filter(r => {
            if (activeDiv !== 'পুরো বাংলাদেশ' && r.division !== activeDiv) return false;
            if (r.age !== null && r.age > ageRange) return false;
            return true;
        });
    }, [activeDiv, ageRange, reports]);

    const sorted = useMemo(() => {
        const items = [...filtered];

        if (sortBy === 'বয়স (কম-বেশি)') {
            items.sort((a, b) => (a.age ?? 999) - (b.age ?? 999));
        } else if (sortBy === 'সবচেয়ে পুরনো') {
            items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        } else {
            items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }

        return items;
    }, [filtered, sortBy]);

    const totalPages = Math.ceil(sorted.length / PER_PAGE);
    const paginated = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    // Group into local vs other
    const localReports = paginated.filter(r => r.division === 'ঢাকা');
    const otherReports = paginated.filter(r => r.division !== 'ঢাকা');

    const Card = ({ r }) => (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
            {/* Image */}
            <div className="relative bg-[#f5ede2] h-52 overflow-hidden flex items-center justify-center">
                <img
                    src={r.photo_url || avatar(r.seed, r.gender, r.age)}
                    alt={r.name}
                    className="h-full w-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                    onError={e => { e.target.src = avatar(r.id, r.gender, r.age); }}
                />
                <div className="absolute top-2 left-2">
                    <StatusBadge />
                </div>
                <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm text-xs text-gray-500 px-2 py-0.5 rounded-full">
                    {r.date}
                </div>
            </div>

            {/* Info */}
            <div className="p-4">
                <div className="flex items-baseline gap-2 mb-2">
                    <h3 className="font-black text-gray-800 text-base">{r.name}</h3>
                    <span className="text-xs text-gray-400">~{r.age} বছর</span>
                </div>
                <div className="space-y-1.5 text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-secondary flex-shrink-0" />
                        <span>{r.district}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Shirt size={12} className="text-primary flex-shrink-0" />
                        <span>{r.clothing}</span>
                    </div>
                    {r.contact_person_name && (
                        <div className="text-[11px] text-gray-400">
                            যোগাযোগ: {r.contact_person_name}
                        </div>
                    )}
                </div>
                <Link to={`/emergency/${r.id}`}
                    className="flex items-center justify-center gap-1.5 w-full border border-primary text-primary text-xs py-2 rounded-xl hover:bg-primary hover:text-white transition-colors font-medium">
                    বিস্তারিত দেখুন <ArrowRight size={12} />
                </Link>
            </div>
        </div>
    );

    return (
        <div className="bg-background min-h-screen">
            <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">

                {/* ── Left Sidebar Filter ── */}
                <aside
                    className={`flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${sidebarOpen ? 'w-52' : 'w-10'
                        }`}
                >
                    <div className="relative">
                        {/* ── Toggle Button (always visible) ── */}
                        <button
                            onClick={() => setSidebarOpen(o => !o)}
                            title={sidebarOpen ? 'ফিল্টার লুকান' : 'ফিল্টার দেখুন'}
                            className={`flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-gray-200 shadow-sm text-primary hover:bg-primary hover:text-white transition-all mb-3 ${sidebarOpen ? 'ml-auto mr-0' : 'mx-auto'
                                }`}
                        >
                            {sidebarOpen
                                ? <PanelLeftClose size={15} />
                                : <PanelLeftOpen size={15} />}
                        </button>

                        {/* ── Collapsed mini strip (icon hints) ── */}
                        {!sidebarOpen && (
                            <div className="flex flex-col items-center gap-3 pt-1">
                                <button onClick={() => setSidebarOpen(true)} title="ফিল্টার" className="text-gray-400 hover:text-primary transition-colors">
                                    <SlidersHorizontal size={16} />
                                </button>
                                <button onClick={() => setSidebarOpen(true)} title="অবস্থা" className="text-gray-400 hover:text-primary transition-colors">
                                    <span className="block w-4 h-4 rounded-full border-2 border-current" />
                                </button>
                                <button onClick={() => setSidebarOpen(true)} title="বয়স" className="text-[10px] font-bold text-gray-400 hover:text-primary transition-colors">বয়স</button>
                            </div>
                        )}

                        {/* ── Expanded full filter panel ── */}
                        {sidebarOpen && (
                            <div className="space-y-5 w-52">
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5 font-black text-gray-800">
                                        <SlidersHorizontal size={16} className="text-primary" />
                                        ফিল্টার
                                    </div>
                                    <button onClick={clearAll} className="text-xs text-secondary hover:underline">সব মুছুন</button>
                                </div>

                                {/* Nearby Toggle */}
                                <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                                    <div className="flex items-start gap-2 mb-1">
                                        <div className="w-4 h-4 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <div className="w-2 h-2 rounded-full bg-secondary" />
                                        </div>
                                        <p className="text-xs font-bold text-gray-700">কাছাকাছি এলাকা</p>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mb-2 leading-relaxed">আপনার অবস্থানের কাছাকাছি রিপোর্ট দেখুন</p>
                                    <button
                                        onClick={() => setNearbyOnly(!nearbyOnly)}
                                        className={`relative w-10 h-5 rounded-full transition-colors ${nearbyOnly ? 'bg-secondary' : 'bg-gray-200'}`}
                                    >
                                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${nearbyOnly ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                    </button>
                                </div>

                                {/* Division Dropdown */}
                                <div>
                                    <p className="text-xs font-bold text-gray-600 mb-2">বিভাগ/জেলা</p>
                                    <select
                                        value={activeDiv}
                                        onChange={e => { setActiveDiv(e.target.value); setPage(1); }}
                                        className="w-full border border-gray-200 rounded-xl p-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                                    >
                                        {DIVISIONS.map(d => <option key={d}>{d}</option>)}
                                    </select>
                                </div>

                                {/* Age Range Slider */}
                                <div>
                                    <p className="text-xs font-bold text-gray-600 mb-1">বয়সসীমা</p>
                                    <div className="flex justify-between text-[10px] text-gray-400 mb-2">
                                        <span>০ বছর</span><span>{ageRange} বছর</span>
                                    </div>
                                    <input
                                        type="range" min="0" max="100" value={ageRange}
                                        onChange={e => { setAgeRange(+e.target.value); setPage(1); }}
                                        className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-secondary"
                                    />
                                </div>

                                {/* Clothing Color */}
                                <div>
                                    <p className="text-xs font-bold text-gray-600 mb-2">পোশাকের রঙ</p>
                                    <div className="flex flex-wrap gap-1">
                                        {COLORS.map(c => (
                                            <button key={c} onClick={() => toggleColor(c)}
                                                className={`text-[10px] px-2 py-1 rounded-full border transition-all ${selectedColors.includes(c) ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary'}`}>
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>

                {/* ── Main Content ── */}
                <main className="flex-1 min-w-0">
                    {/* Division Pills */}
                    <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
                        {DIVISIONS.map(d => (
                            <button key={d}
                                onClick={() => { setActiveDiv(d); setPage(1); }}
                                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${activeDiv === d ? 'bg-secondary text-white border-secondary shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-secondary hover:text-secondary'}`}>
                                {d}
                            </button>
                        ))}
                    </div>

                    {/* Title + Sort */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div>
                            <h1 className="text-xl font-black text-gray-800">অনুমোদিত নিখোঁজ রিপোর্ট</h1>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {loading ? 'রিপোর্ট লোড হচ্ছে...' : `${filtered.length}টি অনুমোদিত রিপোর্ট পাওয়া গেছে`}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-gray-400 whitespace-nowrap">সর্ট করুন:</span>
                            <select
                                value={sortBy} onChange={e => setSortBy(e.target.value)}
                                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none bg-white text-gray-700">
                                {SORT_OPTIONS.map(o => <option key={o}>{o}</option>)}
                            </select>
                        </div>
                    </div>

                    {error && !loading && (
                        <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Local Reports */}
                    {localReports.length > 0 && (
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-1 h-5 bg-secondary rounded-full" />
                                <h2 className="text-sm font-bold text-gray-700">ঢাকার অনুমোদিত রিপোর্ট</h2>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                {localReports.map(r => <Card key={r.id} r={r} />)}
                            </div>
                        </div>
                    )}

                    {/* Other Reports */}
                    {otherReports.length > 0 && (
                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-1 h-5 bg-primary rounded-full" />
                                <h2 className="text-sm font-bold text-gray-700">
                                    {localReports.length > 0 ? 'অন্যান্য বিভাগ' : 'সকল অনুমোদিত রিপোর্ট'}
                                </h2>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                {otherReports.map(r => <Card key={r.id} r={r} />)}
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && filtered.length === 0 && (
                        <div className="text-center py-20">
                            <div className="text-4xl mb-3">🔍</div>
                            <p className="text-gray-500 font-medium">কোনো অনুমোদিত রিপোর্ট পাওয়া যায়নি</p>
                            <button onClick={clearAll} className="mt-3 text-sm text-primary hover:underline">ফিল্টার সাফ করুন</button>
                        </div>
                    )}

                    {/* ── Pagination ── */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-1 mt-8">
                            <button
                                onClick={() => {
                                    setPage(p => Math.max(1, p - 1));
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                disabled={page === 1}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-primary hover:text-primary disabled:opacity-30 transition-colors">
                                <ChevronLeft size={14} />
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => {
                                const show = n === 1 || n === totalPages || Math.abs(n - page) <= 1;
                                const isDot = !show && (n === 2 && page > 4) || (!show && n === totalPages - 1 && page < totalPages - 3);
                                if (!show && !isDot) return null;
                                if (isDot) return <span key={n} className="w-8 text-center text-gray-400 text-sm">…</span>;
                                return (
                                    <button key={n} onClick={() => {
                                        setPage(n);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${page === n ? 'bg-primary text-white shadow-sm' : 'border border-gray-200 text-gray-600 hover:border-primary hover:text-primary'}`}>
                                        {n}
                                    </button>
                                );
                            })}

                            <button
                                onClick={() => {
                                    setPage(p => Math.min(totalPages, p + 1));
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                disabled={page === totalPages}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-primary hover:text-primary disabled:opacity-30 transition-colors">
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
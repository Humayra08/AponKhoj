import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';

const avatar = (seed, gender) => {
    if (!seed) return `https://api.dicebear.com/7.x/shapes/png?seed=unknown&size=200&backgroundColor=e8e0d5`;
    const style = gender === 'female' ? 'lorelei' : 'adventurer';
    return `https://api.dicebear.com/7.x/${style}/png?seed=${encodeURIComponent(seed)}&size=200`;
};

/**
 * Compact report-preview card used inline in chat message bubbles.
 * Reuses the same visual language as the SearchPage/FoundListPage cards, at chat-bubble scale.
 */
const ChatReportCard = ({ report }) => {
    const isMissing = report.type === 'missing';
    const to = isMissing ? `/emergency/${report.id}` : `/found-report/${report.id}`;
    const label = isMissing ? 'নিখোঁজ' : 'উদ্ধার হওয়া';
    const labelColor = isMissing ? 'bg-secondary text-white' : 'bg-accent-teal text-white';

    return (
        <Link
            to={to}
            className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-2.5 hover:shadow-sm hover:border-primary/30 transition-all"
        >
            <img
                src={report.photo_url || avatar(report.id, report.gender)}
                alt={report.name || 'অজ্ঞাত'}
                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                onError={(e) => { e.target.src = avatar(report.id, report.gender); }}
            />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${labelColor}`}>{label}</span>
                    <p className="text-xs font-bold text-gray-800 truncate">{report.name || 'অজ্ঞাত পরিচয়'}</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                    <MapPin size={9} className="flex-shrink-0" />
                    <span className="truncate">{report.district || 'অজানা'}{report.age ? ` · ${report.age} বছর` : ''}</span>
                </div>
            </div>
            <ArrowRight size={14} className="text-gray-300 flex-shrink-0" />
        </Link>
    );
};

export default ChatReportCard;

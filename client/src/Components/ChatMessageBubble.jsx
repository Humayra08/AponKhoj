import { Bot, Check } from 'lucide-react';
import ChatReportCard from './ChatReportCard';

const formatTime = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Groq's replies often use **bold** markdown for emphasis. Rendered as plain
 * text this shows literal asterisks, which looks broken — this renders just
 * that one construct as real bold text without pulling in a markdown library.
 */
const renderContent = (text) => {
    const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        return <span key={i}>{part}</span>;
    });
};

const ChatMessageBubble = ({ message }) => {
    const isUser = message.role === 'user';
    const time = formatTime(message.created_at) || (message.pending ? null : formatTime(Date.now()));

    return (
        <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && (
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Bot size={14} className="text-white" />
                </div>
            )}

            <div className={`max-w-[85%] ${isUser ? '' : 'w-full'}`}>
                <div
                    className={`text-sm rounded-2xl px-3.5 py-2.5 whitespace-pre-wrap break-words ${
                        isUser
                            ? 'bg-primary text-white rounded-br-sm'
                            : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm shadow-sm'
                    }`}
                >
                    {renderContent(message.content)}
                </div>

                {time && (
                    <div className={`flex items-center gap-1 mt-1 text-[10px] text-gray-400 ${isUser ? 'justify-end' : 'justify-start pl-0.5'}`}>
                        <span>{time}</span>
                        {isUser && <Check size={11} className="text-primary" />}
                    </div>
                )}

                {!isUser && Array.isArray(message.matched_reports) && message.matched_reports.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                        {message.matched_reports.map((r) => (
                            <ChatReportCard key={`${r.type}-${r.id}`} report={r} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatMessageBubble;

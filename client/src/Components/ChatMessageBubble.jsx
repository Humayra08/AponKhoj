import ChatReportCard from './ChatReportCard';

const ChatMessageBubble = ({ message }) => {
    const isUser = message.role === 'user';

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${isUser ? '' : 'w-full'}`}>
                <div
                    className={`text-sm rounded-2xl px-3.5 py-2.5 whitespace-pre-wrap break-words ${
                        isUser
                            ? 'bg-primary text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    }`}
                >
                    {message.content}
                </div>

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

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, X, Send, Loader2, Maximize2, MessageCircleMore } from 'lucide-react';
import { sendChatMessage, getConversationHistory } from '../helpers/chatService';
import { QUICK_REPLIES } from '../helpers/chatQuickReplies';
import ChatMessageBubble from './ChatMessageBubble';

const WELCOME_MESSAGE = {
    role: 'assistant',
    content: 'আমি আপন সহায়ক। কিভাবে আপনাকে সাহায্য করতে পারি?',
};

const ChatWidget = () => {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([WELCOME_MESSAGE]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [loadedHistory, setLoadedHistory] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (open && !loadedHistory) {
            setLoadedHistory(true);
            getConversationHistory().then((res) => {
                if (res.success && res.messages?.length) {
                    setMessages(res.messages);
                }
            });
        }
    }, [open, loadedHistory]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, sending]);

    const sendText = async (text) => {
        if (!text || sending) return;

        setMessages((prev) => [...prev, { role: 'user', content: text }]);
        setInput('');
        setSending(true);

        const res = await sendChatMessage(text);

        if (res.success) {
            setMessages((prev) => [...prev, { role: 'assistant', content: res.reply, matched_reports: res.matched_reports }]);
        } else {
            setMessages((prev) => [...prev, { role: 'assistant', content: res.message || 'দুঃখিত, একটি সমস্যা হয়েছে।' }]);
        }

        setSending(false);
    };

    const handleSend = (e) => {
        e.preventDefault();
        sendText(input.trim());
    };

    const showQuickReplies = messages.length <= 1 && !sending;

    return (
        <div className="fixed bottom-6 right-14 z-50">
            {open && (
                <div className="mb-3 w-[88vw] max-w-[340px] h-[64vh] max-h-[540px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="bg-primary text-white px-5 py-4 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                                <Bot size={30} className="text-primary" strokeWidth={1.75} />
                            </div>
                            <div>
                                <p className="font-bold text-base leading-tight">আপন সহায়ক</p>
                                <p className="text-xs text-white/70 flex items-center gap-1.5 mt-0.5">
                                    <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                                    এখনই অনলাইন
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Link
                                to="/assistant"
                                title="পূর্ণ পৃষ্ঠায় খুলুন"
                                className="text-white/70 hover:text-white p-1"
                                onClick={() => setOpen(false)}
                            >
                                <Maximize2 size={16} />
                            </Link>
                            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white p-1">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-background">
                        {messages.map((m, i) => (
                            <ChatMessageBubble key={i} message={m} />
                        ))}

                        {showQuickReplies && (
                            <div className="flex flex-col gap-2">
                                {QUICK_REPLIES.map((q) => (
                                    <button
                                        key={q.text}
                                        onClick={() => sendText(q.text)}
                                        className="w-full text-center text-sm font-medium bg-white border border-gray-200 text-gray-700 py-2.5 rounded-full hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors shadow-sm"
                                    >
                                        {q.text}
                                    </button>
                                ))}
                            </div>
                        )}

                        {sending && (
                            <div className="flex items-end gap-2 justify-start">
                                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                    <Bot size={14} className="text-white" />
                                </div>
                                <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                                    <Loader2 size={14} className="animate-spin text-gray-400" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSend} className="p-3 border-t border-gray-100 flex items-center gap-2 flex-shrink-0">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="আপনার বার্তা লিখুন..."
                            className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                        />
                        <button
                            type="submit"
                            disabled={sending || !input.trim()}
                            className="w-9 h-9 flex-shrink-0 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-40 hover:bg-primary-dark transition-colors"
                        >
                            <Send size={15} />
                        </button>
                    </form>

                    <p className="text-center text-[10px] text-gray-400 pb-2">
                        Powered by <span className="text-secondary font-bold">আপনখোঁজ</span>
                    </p>
                </div>
            )}

            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    className="relative w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors"
                    style={{ boxShadow: '0 0 0 8px rgba(232,83,10,0.18), 0 0 0 16px rgba(232,83,10,0.10)' }}
                    aria-label="চ্যাট খুলুন"
                >
                    <MessageCircleMore size={24} />
                </button>
            )}
        </div>
    );
};

export default ChatWidget;

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Bot, X, Send, Loader2, MessageCircle, Headset,
    Phone, Mail, Clock, ShieldCheck, ChevronRight, Paperclip,
} from 'lucide-react';
import {
    sendChatMessage, getConversationHistory, listConversations,
    startNewConversation, setActiveConversationId, getStoredConversationId,
} from '../helpers/chatService';
import { QUICK_REPLIES } from '../helpers/chatQuickReplies';
import ChatMessageBubble from '../Components/ChatMessageBubble';

const WELCOME_MESSAGE = {
    role: 'assistant',
    content: 'হারিয়ে যাওয়া প্রিয়জনকে খুঁজতে আমি আপনাকে কীভাবে সহায়তা করতে পারি?',
};

const relativeTime = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const days = Math.floor((Date.now() - date.getTime()) / 86400000);
    if (days <= 0) return date.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
};

const ChatPage = () => {
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [activeId, setActiveId] = useState(getStoredConversationId());
    const [messages, setMessages] = useState([WELCOME_MESSAGE]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const scrollRef = useRef(null);

    const refreshConversations = async () => {
        const res = await listConversations();
        if (res.success) setConversations(res.conversations);
    };

    useEffect(() => {
        refreshConversations();
        if (activeId) {
            getConversationHistory(activeId).then((res) => {
                if (res.success && res.messages?.length) setMessages(res.messages);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

        const wasNewConversation = !getStoredConversationId();
        const res = await sendChatMessage(text);

        if (res.success) {
            setMessages((prev) => [...prev, { role: 'assistant', content: res.reply, matched_reports: res.matched_reports }]);
            setActiveId(res.conversation_id);
            if (wasNewConversation) refreshConversations();
        } else {
            setMessages((prev) => [...prev, { role: 'assistant', content: res.message || 'দুঃখিত, একটি সমস্যা হয়েছে।' }]);
        }

        setSending(false);
    };

    const handleSend = (e) => {
        e.preventDefault();
        sendText(input.trim());
    };

    const handleNewConversation = () => {
        startNewConversation();
        setActiveId(null);
        setMessages([WELCOME_MESSAGE]);
    };

    const handleSwitchConversation = async (id) => {
        if (id === activeId) return;
        setActiveConversationId(id);
        setActiveId(id);
        setMessages([]);
        const res = await getConversationHistory(id);
        if (res.success) setMessages(res.messages?.length ? res.messages : [WELCOME_MESSAGE]);
    };

    const showQuickReplies = messages.length <= 1 && !sending;

    return (
        <div className="min-h-screen bg-background flex">
            {/* ── Left Sidebar: conversation history ── */}
            <aside className="hidden lg:flex w-72 flex-shrink-0 flex-col bg-white border-r border-gray-100">
                <Link to="/" className="flex items-center gap-2 px-4 py-4 border-b border-gray-100">
                    <img src="/logo.png" alt="আপনখোঁজ" className="h-8 w-auto" />
                    <span className="font-bold text-gray-800 text-sm">আপনখোঁজ</span>
                </Link>
                <div className="p-4 border-b border-gray-100">
                    <button
                        onClick={handleNewConversation}
                        className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
                    >
                        <MessageCircle size={15} /> নতুন আলাপ শুরু করুন
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    <p className="text-xs font-bold text-gray-400 mb-2">সাম্প্রতিক আলাপ</p>
                    <div className="space-y-1">
                        {conversations.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => handleSwitchConversation(c.id)}
                                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-colors ${
                                    String(c.id) === String(activeId) ? 'bg-primary/5 border border-primary/20' : 'hover:bg-gray-50 border border-transparent'
                                }`}
                            >
                                <MessageCircle size={14} className="text-gray-400 flex-shrink-0" />
                                <span className="flex-1 min-w-0 text-xs font-medium text-gray-700 truncate">
                                    {c.title || 'নতুন আলাপ'}
                                </span>
                                <span className="text-[10px] text-gray-400 flex-shrink-0">{relativeTime(c.updated_at)}</span>
                            </button>
                        ))}
                        {conversations.length === 0 && (
                            <p className="text-xs text-gray-400 px-3 py-2">এখনো কোনো আলাপ নেই</p>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100">
                    <div className="bg-gray-50 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Headset size={16} className="text-primary" />
                            <p className="text-xs font-bold text-gray-700">কোনো মানব সহায়তা প্রয়োজন?</p>
                        </div>
                        <p className="text-[11px] text-gray-500 mb-3">আমাদের সাপোর্ট টিমের সাথে কথা বলুন</p>
                        <Link
                            to="/contact"
                            className="flex items-center justify-center gap-1 text-xs font-bold text-primary border border-primary/30 rounded-lg py-2 hover:bg-primary/5 transition-colors"
                        >
                            সাপোর্টে যোগাযোগ করুন <ChevronRight size={13} />
                        </Link>
                    </div>
                </div>
            </aside>

            {/* ── Center: chat ── */}
            <div className="flex-1 flex flex-col min-w-0">
                <div className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
                            <Bot size={18} className="text-white" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-gray-800 leading-tight">আপন সহায়ক</p>
                            <p className="text-[11px] text-gray-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> অনলাইন
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors"
                    >
                        <X size={14} /> চ্যাট বন্ধ করুন
                    </button>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                    {messages.map((m, i) => (
                        <ChatMessageBubble key={i} message={m} />
                    ))}

                    {showQuickReplies && (
                        <div className="flex flex-wrap gap-2 pl-9">
                            {QUICK_REPLIES.map((q) => (
                                <button
                                    key={q.text}
                                    onClick={() => sendText(q.text)}
                                    className="text-xs bg-white border border-gray-200 text-gray-700 px-3.5 py-2 rounded-full hover:border-primary hover:text-primary transition-colors shadow-sm"
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

                <form onSubmit={handleSend} className="bg-white border-t border-gray-100 p-4 flex items-center gap-2 flex-shrink-0">
                    <button
                        type="button"
                        disabled
                        title="ছবি সংযুক্তি শীঘ্রই আসছে"
                        className="w-10 h-10 flex-shrink-0 rounded-xl border border-gray-200 text-gray-300 flex items-center justify-center cursor-not-allowed"
                    >
                        <Paperclip size={16} />
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="আপনার বার্তা লিখুন..."
                        className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                    <button
                        type="submit"
                        disabled={sending || !input.trim()}
                        className="w-10 h-10 flex-shrink-0 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-40 hover:bg-primary-dark transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </form>
            </div>

            {/* ── Right Sidebar: quick help + contact ── */}
            <aside className="hidden xl:flex w-80 flex-shrink-0 flex-col bg-white border-l border-gray-100 p-5 overflow-y-auto">
                <p className="text-sm font-bold text-gray-800 mb-3">দ্রুত সহায়তা</p>
                <div className="space-y-2 mb-6">
                    {QUICK_REPLIES.map((q) => (
                        <button
                            key={q.text}
                            onClick={() => sendText(q.text)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-colors text-left"
                        >
                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                                <q.icon size={15} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-800 truncate">{q.text}</p>
                                <p className="text-[11px] text-gray-400 truncate">{q.desc}</p>
                            </div>
                            <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                        </button>
                    ))}
                </div>

                <p className="text-sm font-bold text-gray-800 mb-3">যোগাযোগ করুন</p>
                <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2.5">
                        <Phone size={14} className="text-secondary flex-shrink-0" />
                        <div>
                            <a href="tel:999" className="text-sm font-bold text-gray-800">999</a>
                            <p className="text-[10px] text-gray-400">হটলাইন নাম্বার</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <Mail size={14} className="text-secondary flex-shrink-0" />
                        <a href="mailto:support@aponkhoj.com.bd" className="text-xs text-gray-600 hover:text-primary">
                            support@aponkhoj.com.bd
                        </a>
                    </div>
                    <div className="flex items-center gap-2.5">
                        <Clock size={14} className="text-secondary flex-shrink-0" />
                        <p className="text-xs text-gray-600">প্রতিদিন: সকাল ৮টা - রাত ১০টা</p>
                    </div>
                </div>

                <div className="mt-auto bg-primary/5 border border-primary/20 rounded-xl p-3.5 flex items-start gap-2.5">
                    <ShieldCheck size={16} className="text-primary flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-bold text-primary">আপনার তথ্য সম্পূর্ণ নিরাপদ</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">আমরা আপনার গোপনীয়তা রক্ষা করি</p>
                    </div>
                </div>
            </aside>
        </div>
    );
};

export default ChatPage;

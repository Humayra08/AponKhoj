import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { sendChatMessage, getConversationHistory } from '../helpers/chatService';
import ChatMessageBubble from './ChatMessageBubble';

const WELCOME_MESSAGE = {
    role: 'assistant',
    content: 'আসসালামু আলাইকুম! আমি আপনখোঁজের সহায়ক। ওয়েবসাইট সম্পর্কে বা নিখোঁজ/উদ্ধার হওয়া ব্যক্তি সম্পর্কে যেকোনো প্রশ্ন করতে পারেন।',
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

    const handleSend = async (e) => {
        e.preventDefault();
        const text = input.trim();
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

    return (
        <div className="fixed bottom-5 right-5 z-50">
            {open && (
                <div className="mb-3 w-[90vw] max-w-sm h-[70vh] max-h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
                    <div className="bg-primary text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <MessageCircle size={18} />
                            <span className="font-bold text-sm">আপনখোঁজ সহায়ক</span>
                        </div>
                        <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
                            <X size={18} />
                        </button>
                    </div>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-background">
                        {messages.map((m, i) => (
                            <ChatMessageBubble key={i} message={m} />
                        ))}
                        {sending && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                                    <Loader2 size={14} className="animate-spin text-gray-400" />
                                </div>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSend} className="p-3 border-t border-gray-100 flex items-center gap-2 flex-shrink-0">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="আপনার প্রশ্ন লিখুন..."
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
                </div>
            )}

            <button
                onClick={() => setOpen((v) => !v)}
                className="w-14 h-14 rounded-full bg-primary text-white shadow-xl flex items-center justify-center hover:bg-primary-dark transition-colors"
                aria-label="চ্যাট খুলুন"
            >
                {open ? <X size={22} /> : <MessageCircle size={22} />}
            </button>
        </div>
    );
};

export default ChatWidget;

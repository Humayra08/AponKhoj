import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    FileText, Bell, Users, ArrowRight, Clock, CheckCircle, AlertTriangle,
    Search, MapPin, LogOut, Settings, ChevronRight, Zap, Eye, Trash2,
    UserCircle2, Loader2
} from 'lucide-react';

// Status Badge 
const StatusBadge = ({ status }) => {
    const styles = {
        pending: 'bg-yellow-50 text-yellow-600 border-yellow-200',
        verified: 'bg-teal-50 text-teal-600 border-teal-200',
        matched: 'bg-purple-50 text-purple-600 border-purple-200',
        closed: 'bg-gray-50 text-gray-500 border-gray-200',
    };
    const labels = {
        pending: 'অপেক্ষমাণ',
        verified: 'যাচাইকৃত',
        matched: 'ম্যাচ পাওয়া',
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
    const [user, setUser] = useState(null);               // null = not loaded yet
    const [reports, setReports] = useState([]);           // user's submitted reports
    const [notifications, setNotifications] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      
        const timer = setTimeout(() => {
            setUser(null);      
            setReports([]);      
            setNotifications([]); 
            setStats(null);      
            setLoading(false);
        }, 800);
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                {/* Loading Header */}
                <div className="bg-white border-b border-gray-100 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="w-32 h-4" />
                            <Skeleton className="w-44 h-3" />
                        </div>
                    </div>
                </div>
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
}
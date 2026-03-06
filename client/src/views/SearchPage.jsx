import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Shirt, ArrowRight, SlidersHorizontal, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

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

const ALL_REPORTS = [
    // Dhaka local
    { id: 1, name: 'রাফি আহমেদ', age: 8, gender: 'male', division: 'ঢাকা', district: 'উত্তরা, ঢাকা', clothing: 'নীল টি-শার্ট', status: 'missing', date: '৩ দিন আগে', seed: 'rafi' },
    { id: 2, name: 'অচেনা শিশু', age: 3, gender: 'female', division: 'ঢাকা', district: 'সাভার, ঢাকা', clothing: 'সাদা ও লাল ফ্রক', status: 'missing', date: '১ দিন আগে', seed: '' },
    { id: 3, name: 'করিম উদ্দিন', age: 65, gender: 'male', division: 'ঢাকা', district: 'মিরপুর, ঢাকা', clothing: 'সাদা পাঞ্জাবি', status: 'found', date: '৫ দিন আগে', seed: 'karim65' },
    { id: 4, name: 'সুমাইয়া বেগম', age: 32, gender: 'female', division: 'ঢাকা', district: 'ধানমন্ডি, ঢাকা', clothing: 'সবুজ শাড়ি', status: 'missing', date: '২ দিন আগে', seed: 'sumaiya32' },
    { id: 5, name: 'রিফাত হাসান', age: 19, gender: 'male', division: 'চট্টগ্রাম', district: 'হালিশহর, চট্টগ্রাম', clothing: 'কালো জ্যাকেট', status: 'missing', date: '৪ দিন আগে', seed: 'rifat19' },
    { id: 6, name: 'নাসরিন আক্তার', age: 45, gender: 'female', division: 'চট্টগ্রাম', district: 'পতেঙ্গা, চট্টগ্রাম', clothing: 'লাল শাড়ি', status: 'found', date: '৬ দিন আগে', seed: 'nasrin45' },
    { id: 7, name: 'আবির খান', age: 14, gender: 'male', division: 'সিলেট', district: 'আম্বরখানা, সিলেট', clothing: 'হলুদ শার্ট', status: 'missing', date: '৭ দিন আগে', seed: 'abir14' },
    { id: 8, name: 'তানজিলা হক', age: 27, gender: 'female', division: 'রাজশাহী', district: 'রাজশাহী সদর', clothing: 'নীল সালোয়ার', status: 'missing', date: '৮ দিন আগে', seed: 'tanzila27' },
    { id: 9, name: 'মোস্তফা আলী', age: 55, gender: 'male', division: 'খুলনা', district: 'খুলনা সদর', clothing: 'ধূসর শার্ট', status: 'found', date: '৯ দিন আগে', seed: 'mostafa55' },
    { id: 10, name: 'রেহানা বেগম', age: 38, gender: 'female', division: 'বরিশাল', district: 'বরিশাল সদর', clothing: 'সবুজ শাড়ি', status: 'missing', date: '১০ দিন আগে', seed: 'rehana38' },
    { id: 11, name: 'জামাল উদ্দিন', age: 22, gender: 'male', division: 'রংপুর', district: 'রংপুর সদর', clothing: 'সাদা টি-শার্ট', status: 'missing', date: '১১ দিন আগে', seed: 'jamal22' },
    { id: 12, name: 'শিরিন আক্তার', age: 17, gender: 'female', division: 'ময়মনসিংহ', district: 'ময়মনসিংহ সদর', clothing: 'কমলা কামিজ', status: 'found', date: '১২ দিন আগে', seed: 'shirin17' },
];

const DIVISIONS = ['পুরো বাংলাদেশ', 'ঢাকা', 'চট্টগ্রাম', 'সিলেট', 'রাজশাহী', 'খুলনা', 'বরিশাল', 'রংপুর', 'ময়মনসিংহ'];
const SORT_OPTIONS = ['সর্বশেষ আগে', 'সবচেয়ে পুরনো', 'বয়স (কম-বেশি)'];
const COLORS = ['লাল', 'নীল', 'হলুদ', 'সাদা', 'কালো', 'সবুজ'];
const PER_PAGE = 6;

const StatusBadge = ({ status }) => (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${status === 'missing' ? 'bg-secondary text-white' : 'bg-accent-teal text-white'}`}>
        {status === 'missing' ? 'নিখোঁজ' : 'পাওয়া গেছে'}
    </span>
);

export default function SearchPage() {
    const [activeDiv, setActiveDiv] = useState('পুরো বাংলাদেশ');
    const [statusFilter, setStatusFilter] = useState('সব');
    const [ageRange, setAgeRange] = useState(100);
    const [selectedColors, setSelectedColors] = useState([]);
    const [sortBy, setSortBy] = useState('সর্বশেষ আগে');
    const [page, setPage] = useState(1);
    const [nearbyOnly, setNearbyOnly] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const toggleColor = (c) =>
        setSelectedColors(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);

    const clearAll = () => {
        setActiveDiv('পুরো বাংলাদেশ');
        setStatusFilter('সব');
        setAgeRange(100);
        setSelectedColors([]);
        setNearbyOnly(false);
        setPage(1);
    };

    // Filter logic
    const filtered = ALL_REPORTS.filter(r => {
        if (activeDiv !== 'পুরো বাংলাদেশ' && r.division !== activeDiv) return false;
        if (statusFilter === 'নিখোঁজ' && r.status !== 'missing') return false;
        if (statusFilter === 'পাওয়া গেছে' && r.status !== 'found') return false;
        if (r.age > ageRange) return false;
        return true;
    });

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    // Group into local vs other
    const localReports = paginated.filter(r => r.division === 'ঢাকা');
    const otherReports = paginated.filter(r => r.division !== 'ঢাকা');

    
    );
}
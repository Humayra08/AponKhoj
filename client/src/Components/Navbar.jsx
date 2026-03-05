import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, Search } from 'lucide-react';

const Navbar = () => {
    const [menuOpen, setMenuOpen] = useState(false);

    const navLinks = [
        { to: '/search', label: 'নিখোঁজ তালিকা' },
        { to: '/found', label: 'উদ্ধারকৃত তালিকা' },
        { to: '/about', label: 'আমাদের সম্পর্কে' },
        { to: '/contact', label: 'যোগাযোগ' },
    ];

    return (
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 font-bold text-gray-800 shrink-0">
                        <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center shrink-0">
                            <Search size={18} className="text-primary" strokeWidth={2.5} />
                        </div>
                        <span className="text-base font-extrabold text-gray-800 whitespace-nowrap">আপনখোঁজ</span>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map(l => (
                            <NavLink
                                key={l.to}
                                to={l.to}
                                className={({ isActive }) =>
                                    `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive ? 'text-primary bg-primary/5' : 'text-gray-600 hover:text-primary hover:bg-gray-50'}`
                                }
                            >
                                {l.label}
                            </NavLink>
                        ))}
                    </div>

                    {/* Auth Buttons */}
                    <div className="hidden md:flex items-center gap-2">
                        <Link to="/login" className="text-sm text-gray-600 hover:text-primary px-3 py-1.5 rounded-md transition-colors font-medium">
                            লগইন
                        </Link>
                        <Link to="/register" className="text-sm bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-primary-dark transition-colors font-medium">
                            রেজিস্ট্রেশন
                        </Link>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button className="md:hidden p-2 text-gray-500" onClick={() => setMenuOpen(!menuOpen)}>
                        {menuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {menuOpen && (
                    <div className="md:hidden pb-4 space-y-1 border-t border-gray-50 pt-3">
                        {navLinks.map(l => (
                            <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} className="block px-3 py-2 text-sm text-gray-600 hover:text-primary hover:bg-gray-50 rounded-md">
                                {l.label}
                            </Link>
                        ))}
                        <div className="flex gap-2 pt-2">
                            <Link to="/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center text-sm text-primary border border-primary py-2 rounded-lg">লগইন</Link>
                            <Link to="/register" onClick={() => setMenuOpen(false)} className="flex-1 text-center text-sm bg-primary text-white py-2 rounded-lg">রেজিস্ট্রেশন</Link>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;

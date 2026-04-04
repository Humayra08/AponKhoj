import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, KeyRound, Lock, EyeOff, Eye, CheckCircle2, Loader } from 'lucide-react';
import apiClient from '../api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [code, setCode] = useState(['', '', '', '']);
    // Store the verified code so resetPassword always sends the correct code
    const [verifiedCode, setVerifiedCode] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const codeInputs = useRef([]);

    // Step 1: Send verification code
    const handleSendCode = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await apiClient.forgetPasswordRequest(email.trim().toLowerCase());
            toast.success(response.message || 'Verification code sent to your email');
            setStep(2);
        } catch (error) {
            // handleError already shows toast — no extra action needed
            console.error('Error sending code:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle code input with auto-focus to next field
    const handleCodeChange = (index, value) => {
        if (/^\d?$/.test(value)) {
            const newCode = [...code];
            newCode[index] = value;
            setCode(newCode);

            // Auto-focus to next input
            if (value && index < 3) {
                codeInputs.current[index + 1]?.focus();
            }
        }
    };

    const handleCodeKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            codeInputs.current[index - 1]?.focus();
        }
    };

    // Step 2: Verify code against the backend BEFORE allowing password change
    const handleVerifyCode = async () => {
        const fullCode = code.join('');

        if (fullCode.length !== 4) {
            toast.error('Please enter all 4 digits');
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.verifyResetCode(email.trim().toLowerCase(), fullCode);
            // Only proceed to step 3 if backend confirms the code is valid
            if (response && response.valid) {
                setVerifiedCode(fullCode); // Store the verified code for password reset
                toast.success(response.message || 'Code verified successfully');
                setStep(3);
            } else {
                toast.error('Verification failed. Please try again.');
            }
        } catch (error) {
            // handleError shows the toast; stay on step 2
            console.error('Error verifying code:', error);
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset password using the already-verified code
    const handleReset = async (e) => {
        e.preventDefault();

        if (!verifiedCode || verifiedCode.length !== 4) {
            toast.error('Verification code missing. Please go back and verify your code.');
            setStep(2);
            return;
        }

        if (password.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }

        if (password !== passwordConfirmation) {
            toast.error('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const response = await apiClient.resetPassword(
                email.trim().toLowerCase(),
                verifiedCode,
                password,
                passwordConfirmation
            );
            toast.success(response.message || 'Password reset successfully');
            setStep(4);
            setTimeout(() => {
                navigate('/login');
            }, 2500);
        } catch (error) {
            console.error('Error resetting password:', error);
        } finally {
            setLoading(false);
        }
    };

    // Resend code — resets the code inputs and sends a new code
    const handleResendCode = async () => {
        setLoading(true);
        try {
            const response = await apiClient.forgetPasswordRequest(email.trim().toLowerCase());
            toast.success(response.message || 'Verification code resent to your email');
            setCode(['', '', '', '']);
            setVerifiedCode('');
            codeInputs.current[0]?.focus();
        } catch (error) {
            console.error('Error resending code:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4">
            <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">

                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <KeyRound className="text-primary w-6 h-6" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">পাসওয়ার্ড ভুলে গেছেন?</h1>
                        <p className="text-gray-500 text-sm text-center mb-6 leading-relaxed">
                            কোনো চিন্তা নেই! আপনার অ্যাকাউন্টের সাথে যুক্ত ইমেইল ঠিকানা দিন এবং আমরা আপনাকে একটি যাচাইকরণ কোড পাঠাব।
                        </p>

                        <form onSubmit={handleSendCode} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">ইমেইল ঠিকানা</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !email.trim()}
                                className="w-full bg-primary hover:bg-primary-dark text-white py-2.5 rounded-lg font-bold transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading && <Loader size={16} className="animate-spin" />}
                                {loading ? 'পাঠানো হচ্ছে...' : 'কোড পাঠান'}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
                                <ArrowLeft size={14} /> লগইন পেজে ফিরে যান
                            </Link>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-2 duration-300 text-center">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Mail className="text-primary w-6 h-6" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">ইমেইল চেক করুন</h1>
                        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                            আমরা <strong>{email}</strong> ঠিকানায় একটি 4-ডিজিটের কোড পাঠিয়েছি। কোডটি নিচে প্রবেশ করুন।
                        </p>

                        <div className="space-y-6">
                            <div className="flex justify-center gap-3">
                                {[0, 1, 2, 3].map((i) => (
                                    <input
                                        key={i}
                                        ref={(el) => codeInputs.current[i] = el}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={code[i]}
                                        onChange={(e) => handleCodeChange(i, e.target.value)}
                                        onKeyDown={(e) => handleCodeKeyDown(i, e)}
                                        disabled={loading}
                                        className="w-12 h-14 text-center text-xl font-bold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50"
                                        placeholder="0"
                                    />
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={handleVerifyCode}
                                disabled={loading || code.join('').length !== 4}
                                className="w-full bg-primary hover:bg-primary-dark text-white py-2.5 rounded-lg font-bold transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading && <Loader size={16} className="animate-spin" />}
                                {loading ? 'যাচাই করা হচ্ছে...' : 'পরবর্তী'}
                            </button>
                        </div>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-500 mb-3">কোড পাননি?</p>
                            <button
                                type="button"
                                onClick={handleResendCode}
                                disabled={loading}
                                className="text-sm font-bold text-primary hover:underline disabled:opacity-50"
                            >
                                আবার কোড পাঠান
                            </button>
                        </div>

                        <div className="mt-4 text-center">
                            <button
                                type="button"
                                onClick={() => { setStep(1); setCode(['', '', '', '']); }}
                                disabled={loading}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
                            >
                                <ArrowLeft size={14} /> ইমেইল পরিবর্তন করুন
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="animate-in fade-in slide-in-from-right-2 duration-300">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="text-primary w-6 h-6" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">নতুন পাসওয়ার্ড সেট করুন</h1>
                        <p className="text-gray-500 text-sm text-center mb-6 leading-relaxed">
                            আপনার অ্যাকাউন্টের জন্য একটি শক্তিশালী নতুন পাসওয়ার্ড তৈরি করুন।
                        </p>

                        <form onSubmit={handleReset} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">নতুন পাসওয়ার্ড</label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        minLength={8}
                                        className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={loading}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">কমপক্ষে ৮ অক্ষর হতে হবে</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">পাসওয়ার্ড নিশ্চিত করুন</label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        required
                                        value={passwordConfirmation}
                                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                                        placeholder="••••••••"
                                        minLength={8}
                                        className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all disabled:opacity-50"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        disabled={loading}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                    >
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {passwordConfirmation && password !== passwordConfirmation && (
                                    <p className="text-xs text-red-500 mt-1">পাসওয়ার্ড মিলছে না</p>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={loading || password.length < 8 || password !== passwordConfirmation}
                                className="w-full bg-primary hover:bg-primary-dark text-white py-2.5 rounded-lg font-bold transition-all shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
                            >
                                {loading && <Loader size={16} className="animate-spin" />}
                                {loading ? 'পাসওয়ার্ড পরিবর্তন করা হচ্ছে...' : 'পাসওয়ার্ড পরিবর্তন করুন'}
                            </button>
                        </form>
                    </div>
                )}

                {step === 4 && (
                    <div className="animate-in fade-in zoom-in-95 duration-300 text-center py-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="text-green-600 w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">সফল!</h1>
                        <p className="text-gray-500 text-sm leading-relaxed mb-6">
                            আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে। আপনি এখন লগইন পেজে পুনঃনির্দেশিত হবেন।
                        </p>
                        <Loader size={20} className="animate-spin text-primary mx-auto" />
                    </div>
                )}

            </div>
        </div>
    );
}
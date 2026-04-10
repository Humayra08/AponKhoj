import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../helpers/AuthContext';

const GoogleAuthCallbackPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const encodedUser = params.get('user');
        const error = params.get('error');

        if (error) {
            toast.error('Google login failed. Please try again.');
            navigate('/login', { replace: true });
            return;
        }

        if (!token || !encodedUser) {
            toast.error('Google login response is incomplete.');
            navigate('/login', { replace: true });
            return;
        }

        try {
            const user = JSON.parse(encodedUser);
            login(user, token);

            navigate(user?.role === 'admin' ? '/admin/dashboard' : '/dashboard', {
                replace: true,
            });
        } catch (_e) {
            toast.error('Unable to process Google login response.');
            navigate('/login', { replace: true });
        }
    }, [login, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-600">
                <Loader2 size={18} className="animate-spin" />
                <span>Signing you in with Google...</span>
            </div>
        </div>
    );
};

export default GoogleAuthCallbackPage;

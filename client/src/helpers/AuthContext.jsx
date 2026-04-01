import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api';

/**
 * AuthContext — Global authentication state for AponKhoj.
 *
 * Provides:
 *   user       — object { name, email, phone, location, avatarUrl, joinDate } or null
 *   token      — Sanctum Bearer token string or null
 *   login(userData, token) — saves user + token, persists to localStorage
 *   logout()               — clears state and localStorage
 *   updateUser(partial)    — merge-update user fields (e.g. after profile edit)
 *   isAuthenticated        — boolean shortcut
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true); // true while reading localStorage

    // On mount: restore session from localStorage
    useEffect(() => {
        let cancelled = false;

        const bootstrapAuth = async () => {
            try {
                const savedUser = localStorage.getItem('aponkhoj_user');
                const savedToken = localStorage.getItem('aponkhoj_token');

                if (!savedToken) {
                    return;
                }

                const parsedUser = savedUser ? JSON.parse(savedUser) : null;
                setToken(savedToken);

                // Validate token with backend to prevent fake/stale local login state.
                const currentUser = await apiClient.getCurrentUser();
                if (cancelled) return;

                const userWithRole = {
                    role: parsedUser?.role || 'user',
                    ...(parsedUser || {}),
                    ...(currentUser || {}),
                };

                setUser(userWithRole);
                localStorage.setItem('aponkhoj_user', JSON.stringify(userWithRole));
            } catch {
                if (cancelled) return;
                localStorage.removeItem('aponkhoj_user');
                localStorage.removeItem('aponkhoj_token');
                setUser(null);
                setToken(null);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        bootstrapAuth();

        return () => {
            cancelled = true;
        };
    }, []);

    /** Call this after a successful login or registration API response */
    const login = (userData, authToken) => {
        // ensure role is always set, default to 'user'
        const userWithRole = { role: 'user', ...userData };
        setUser(userWithRole);
        setToken(authToken);
        localStorage.setItem('aponkhoj_user', JSON.stringify(userWithRole));
        localStorage.setItem('aponkhoj_token', authToken);
    };

    /** Call this on logout */
    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('aponkhoj_user');
        localStorage.removeItem('aponkhoj_token');
    };

    /** Merge-update user fields without full re-login (e.g. after profile save) */
    const updateUser = (partial) => {
        setUser(prev => {
            const updated = { ...prev, ...partial };
            localStorage.setItem('aponkhoj_user', JSON.stringify(updated));
            return updated;
        });
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            isAuthenticated: !!user,
            isAdmin: user?.role === 'admin',
            login,
            logout,
            updateUser,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

/** Custom hook — use anywhere in the app */
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}

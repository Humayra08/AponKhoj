import { createContext, useContext, useState, useEffect } from 'react';


const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true); // true while reading localStorage

    
    useEffect(() => {
        try {
            const savedUser  = localStorage.getItem('aponkhoj_user');
            const savedToken = localStorage.getItem('aponkhoj_token');
            if (savedUser && savedToken) {
                setUser(JSON.parse(savedUser));
                setToken(savedToken);
            }
        } catch {
            
            localStorage.removeItem('aponkhoj_user');
            localStorage.removeItem('aponkhoj_token');
        } finally {
            setLoading(false);
        }
    }, []);


    const login = (userData, authToken) => {
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('aponkhoj_user',  JSON.stringify(userData));
        localStorage.setItem('aponkhoj_token', authToken);
    };

    /** Call this on logout */
    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('aponkhoj_user');
        localStorage.removeItem('aponkhoj_token');
    };

    
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
            login,
            logout,
            updateUser,
        }}>
            {children}
        </AuthContext.Provider>
    );
}


export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}

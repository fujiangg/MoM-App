import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { KeyRound, User } from 'lucide-react';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const qs = new URLSearchParams();
            qs.append('username', username);
            qs.append('password', password);

            const response = await api.post('/auth/login', qs, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            localStorage.setItem('token', response.data.access_token);
            localStorage.setItem('username', username);
            navigate('/dashboard');
        } catch (err) {
            setError('Invalid username or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center h-full w-full bg-gradient-to-br from-gray-900 to-gray-800">
            <div className="card glass-panel animate-fade-in" style={{ width: '400px', maxWidth: '90%' }}>
                <div className="text-center mb-8">
                    <h1 className="text-2xl text-primary mb-2">Welcome Back</h1>
                    <p className="text-muted text-sm">Sign in to manage your MoMs</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-md mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-muted">Username</label>
                        <div className="relative">
                            <User size={18} className="absolute input-icon" />
                            <input
                                type="text"
                                className="input"
                                style={{ paddingLeft: '2.5rem' }}
                                placeholder="Enter username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-muted">Password</label>
                        <div className="relative">
                            <KeyRound size={18} className="absolute input-icon" />
                            <input
                                type="password"
                                className="input"
                                style={{ paddingLeft: '2.5rem' }}
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-full mt-4"
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}

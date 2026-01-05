import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Wallet, ArrowRight, Lock, Mail } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl flex w-full max-w-4xl overflow-hidden min-h-[500px]">

        {/* Left Side - Visual */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-fintech-600 to-fintech-800 p-8 flex-col justify-between relative">
            <div className="text-white">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4">
                    <Wallet size={28} className="text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
                <p className="text-blue-100 text-sm leading-relaxed max-w-xs">
                    Track your expenses, manage your cards, and achieve your financial goals with precision.
                </p>
            </div>
            <div className="text-blue-200 text-xs">
                © 2024 FinTrack India. Secure & Private.
            </div>

            {/* Decorative circles */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute top-20 right-10 w-20 h-20 bg-blue-400/20 rounded-full blur-xl"></div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <div className="mb-8 md:hidden">
                <div className="w-10 h-10 bg-fintech-600 rounded-lg flex items-center justify-center text-white mb-2">
                    <Wallet size={20} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">FinTrack</h2>
            </div>

            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">Sign In</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Enter your credentials to access your account.</p>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input
                            type="email"
                            required
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-fintech-500 focus:border-transparent outline-none transition-all dark:bg-gray-700 dark:text-white"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input
                            type="password"
                            required
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-fintech-500 focus:border-transparent outline-none transition-all dark:bg-gray-700 dark:text-white"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                <button type="submit" className="w-full bg-fintech-600 hover:bg-fintech-700 text-white font-semibold py-2.5 rounded-lg shadow-lg shadow-fintech-500/30 transition-all flex items-center justify-center gap-2 mt-4">
                    Sign In <ArrowRight size={18} />
                </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
                Don't have an account? <Link to="/register" className="text-fintech-600 hover:text-fintech-700 font-semibold">Create one</Link>
            </p>
        </div>

      </div>
    </div>
  );
}

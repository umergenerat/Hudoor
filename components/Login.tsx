
import React, { useState } from 'react';
import { Lock, Mail, ChevronRight, LayoutDashboard, Fingerprint } from 'lucide-react';
import { User } from '../types';

interface LoginProps {
  users: User[];
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ users, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate network delay for effect
    setTimeout(() => {
      const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      
      if (!foundUser) {
        setError('Invalid credentials. Please check your email or password.');
        setLoading(false);
      } else {
          onLogin(foundUser);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
         <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-teal-600/20 rounded-full blur-[100px]"></div>
         <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-indigo-600/20 rounded-full blur-[100px]"></div>
      </div>

      <div className="bg-white/95 backdrop-blur-sm w-full max-w-md rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col border border-white/20">
        <div className="p-8 bg-slate-50 border-b border-slate-100 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-600 to-teal-800 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg text-white">
                <LayoutDashboard size={32} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Hudoor AI</h2>
            <p className="text-slate-500 font-medium text-sm mt-1">Smart Attendance Management</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <Fingerprint size={16} />
                {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1"> Email</label>
            <div className="relative">
                <Mail className="absolute top-3.5 left-3 text-slate-400" size={20} />
                <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g., admin@ISTA.Tata.ma"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all font-semibold text-slate-800"
                />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
            <div className="relative">
                <Lock className="absolute top-3.5 left-3 text-slate-400" size={20} />
                <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all font-semibold text-slate-800"
                />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                <>
                    Sign In <ChevronRight size={20} />
                </>
            )}
          </button>
        </form>

        <div className="p-4 bg-slate-100 text-center text-xs text-slate-400 font-medium">
            Protected by Hudoor Secure Auth • v1.1.0 (RBAC)
        </div>
      </div>
    </div>
  );
};

export default Login;

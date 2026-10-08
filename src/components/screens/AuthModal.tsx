import React, { useState } from 'react';
import { X, Leaf, Lock, Mail, User, Sparkles, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    authModalMode, 
    openAuthModal, 
    login, 
    signup,
    demoUsers,
    switchUser 
  } = useAuth();
  const { showToast } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (authModalMode === 'signup') {
        if (!name.trim()) {
          setError('Please provide your name.');
          setIsSubmitting(false);
          return;
        }
        await signup(email, password, name);
        showToast({
          type: 'success',
          title: 'Welcome to EcoShare! 🌱',
          message: 'Your account is ready. Start browsing and sharing items with neighbors.',
        });
      } else {
        await login(email, password);
        showToast({
          type: 'success',
          title: 'Welcome back! 👋',
          message: 'Successfully signed in to EcoShare.',
        });
      }
    } catch (err: any) {
      const errMsg = err?.message || '';
      if (errMsg.includes('configuration-not-found') || errMsg.includes('auth/')) {
        setError(
          'Firebase Authentication is not yet enabled in your Firebase Console. Go to Firebase Console > Build > Authentication > Click "Get Started" & enable "Email/Password". Or select a 1-Click persona below!'
        );
      } else {
        setError(errMsg || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectDemoUser = (userId: string) => {
    switchUser(userId);
    closeAuthModal();
    showToast({
      type: 'info',
      title: 'Demo Persona Active',
      message: 'You are now signed in as this member to test live sharing & requests.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-tr from-emerald-800 to-teal-700 text-white p-6 relative text-center">
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-1.5 rounded-full text-emerald-200 hover:text-white hover:bg-emerald-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md text-white flex items-center justify-center mx-auto mb-2.5 border border-white/20 shadow-md">
            <Leaf className="w-6 h-6 fill-white/20 text-emerald-300" />
          </div>

          <h3 className="text-xl font-extrabold tracking-tight">
            {authModalMode === 'signup' ? 'Create Your Account' : 'Welcome to EcoShare'}
          </h3>
          <p className="text-xs text-emerald-100 mt-1">
            {authModalMode === 'signup'
              ? 'Join our community to share tools, books & earn EcoPoints'
              : 'Sign in to manage your items and requests'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {authModalMode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 active:scale-98 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 mt-2"
          >
            {isSubmitting
              ? 'Processing...'
              : authModalMode === 'signup'
              ? 'Create Account'
              : 'Sign In'}
          </button>

          {/* Switch Mode Toggle */}
          <div className="text-center pt-2">
            {authModalMode === 'signup' ? (
              <p className="text-xs text-slate-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="text-emerald-700 font-bold hover:underline"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                New to EcoShare?{' '}
                <button
                  type="button"
                  onClick={() => openAuthModal('signup')}
                  className="text-emerald-700 font-bold hover:underline"
                >
                  Create an Account
                </button>
              </p>
            )}
          </div>

          {/* Quick Demo Personas */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Quick Test Personas
              </span>
              <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                1-Click Sign-in
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {demoUsers.map((user) => (
                <button
                  key={user.userId}
                  type="button"
                  onClick={() => handleSelectDemoUser(user.userId)}
                  className="p-2 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all text-center flex flex-col items-center group"
                >
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 mb-1 group-hover:scale-105 transition-transform"
                  />
                  <span className="text-[11px] font-bold text-slate-800 line-clamp-1">
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="text-[9px] text-emerald-700 font-extrabold">
                    {user.ecoPoints} pts
                  </span>
                </button>
              ))}
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

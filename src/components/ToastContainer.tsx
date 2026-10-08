import React from 'react';
import { Sparkles, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto p-4 rounded-2xl shadow-xl border flex items-start gap-3 transform transition-all duration-300 animate-in slide-in-from-bottom-5 ${
            toast.type === 'points'
              ? 'bg-gradient-to-r from-emerald-900 to-teal-900 text-white border-emerald-500/40'
              : toast.type === 'success'
              ? 'bg-white text-slate-900 border-emerald-300 shadow-emerald-500/10'
              : toast.type === 'error'
              ? 'bg-white text-slate-900 border-rose-300 shadow-rose-500/10'
              : 'bg-white text-slate-900 border-slate-300 shadow-slate-500/10'
          }`}
        >
          {/* Icon */}
          <div className="shrink-0 mt-0.5">
            {toast.type === 'points' && (
              <div className="w-7 h-7 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-bold shadow-md">
                <Sparkles className="w-4 h-4 fill-slate-900" />
              </div>
            )}
            {toast.type === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            )}
            {toast.type === 'error' && (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            {toast.type === 'info' && (
              <Info className="w-5 h-5 text-blue-600" />
            )}
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <h4 className={`text-xs font-bold leading-tight ${toast.type === 'points' ? 'text-amber-300' : 'text-slate-900'}`}>
              {toast.title}
            </h4>
            <p className={`text-xs mt-0.5 leading-relaxed ${toast.type === 'points' ? 'text-emerald-100' : 'text-slate-500'}`}>
              {toast.message}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

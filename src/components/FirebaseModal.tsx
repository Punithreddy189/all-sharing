import React, { useState } from 'react';
import { Database, X, CheckCircle, ShieldAlert, Key, Sparkles, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { 
  activeFirebaseConfig, 
  isFirebaseConfigured, 
  updateFirebaseConfig, 
  clearFirebaseConfig 
} from '../firebase/config';

export const FirebaseModal: React.FC = () => {
  const { isConfigModalOpen, setIsConfigModalOpen, showToast } = useApp();
  const isLive = isFirebaseConfigured();

  const [config, setConfig] = useState({
    apiKey: activeFirebaseConfig.apiKey || '',
    authDomain: activeFirebaseConfig.authDomain || '',
    projectId: activeFirebaseConfig.projectId || '',
    storageBucket: activeFirebaseConfig.storageBucket || '',
    messagingSenderId: activeFirebaseConfig.messagingSenderId || '',
    appId: activeFirebaseConfig.appId || '',
  });

  if (!isConfigModalOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.apiKey || !config.projectId) {
      showToast({
        type: 'error',
        title: 'Missing Keys',
        message: 'Please provide at least an API Key and Project ID to connect.',
      });
      return;
    }

    updateFirebaseConfig(config);
  };

  const handleReset = () => {
    clearFirebaseConfig();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={() => setIsConfigModalOpen(false)}
            className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Firebase Connection Hub</h3>
              <p className="text-xs text-slate-400">Authentication, Firestore & Storage Configuration</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
            {isLive ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-emerald-300 font-semibold">
                  Connected to Live Firebase Project: <span className="font-mono text-white">{activeFirebaseConfig.projectId}</span>
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-amber-300 font-medium">
                  Running in Instant Reactive Demo Mode (All features, points & real-time simulation work out-of-the-box).
                </span>
              </>
            )}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            You can paste your Firebase web credentials from your Firebase Console project settings to switch to your cloud Firestore database.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                API Key
              </label>
              <input
                type="text"
                value={config.apiKey}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Project ID
              </label>
              <input
                type="text"
                value={config.projectId}
                onChange={(e) => setConfig({ ...config, projectId: e.target.value })}
                placeholder="ecoshare-app"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Auth Domain
              </label>
              <input
                type="text"
                value={config.authDomain}
                onChange={(e) => setConfig({ ...config, authDomain: e.target.value })}
                placeholder="ecoshare-app.firebaseapp.com"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
                Storage Bucket
              </label>
              <input
                type="text"
                value={config.storageBucket}
                onChange={(e) => setConfig({ ...config, storageBucket: e.target.value })}
                placeholder="ecoshare-app.appspot.com"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset to Demo Mode</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
              >
                Save & Connect
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};

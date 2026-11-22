import React, { useState } from 'react';
import { 
  signInUserWithEmail, 
  registerUserWithEmail, 
  signInWithGooglePopup 
} from '../firebase.ts';
import { 
  Lock, 
  Mail, 
  LogIn, 
  UserPlus, 
  ExternalLink,
  Sparkles, 
  AlertCircle
} from 'lucide-react';

interface AuthViewProps {
  onAuthSuccess?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onAuthSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('admin@jasolfurniture.com');
  const [password, setPassword] = useState('Jasol@2026');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConsoleNotice, setShowConsoleNotice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setShowConsoleNotice(false);
    setLoading(true);

    try {
      if (isRegister) {
        await registerUserWithEmail(email.trim(), password);
      } else {
        await signInUserWithEmail(email.trim(), password);
      }
      onAuthSuccess?.();
    } catch (err: any) {
      const code = err?.code || '';
      console.warn('Auth notice code:', code);
      if (code === 'auth/operation-not-allowed') {
        setShowConsoleNotice(true);
        setErrorMsg('Email/Password provider is disabled in this Firebase project. Please use 1-Click Google Sign In below, or enable Email/Password in your Firebase Console.');
      } else if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        setErrorMsg('User not found or incorrect password. Switch to "Create Account" or use Google Sign In.');
      } else if (code === 'auth/weak-password') {
        setErrorMsg('Password must be at least 6 characters.');
      } else {
        setErrorMsg(err.message || 'Authentication failed. Please use Google Sign In.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setShowConsoleNotice(false);
    setLoading(true);
    try {
      await signInWithGooglePopup();
      onAuthSuccess?.();
    } catch (err: any) {
      console.warn('Google login notice:', err?.code || err?.message);
      setErrorMsg(err.message || 'Google sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillAdminPreset = () => {
    setEmail('admin@jasolfurniture.com');
    setPassword('Jasol@2026');
    setErrorMsg('');
    setShowConsoleNotice(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#1e1109] relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/30 via-[#1c0f07] to-[#0f0703]"></div>

      <div className="w-full max-w-md relative z-10 bg-stone-900/95 border-2 border-amber-600/50 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-md">
        
        {/* Header Branding */}
        <div className="bg-gradient-to-b from-[#3a1d0d] via-[#2d1609] to-[#1e1007] p-6 text-center border-b border-amber-500/40 relative">
          <div className="inline-flex p-3 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-500 text-stone-950 shadow-lg mb-3">
            <Lock className="w-7 h-7 text-stone-950" />
          </div>

          <h1 className="text-2xl font-black font-cinzel text-amber-300 tracking-wider">
            JASOL FURNITURE
          </h1>
          <p className="text-xs text-amber-200/80 font-serif italic mt-0.5">
            Build Better... Live Better...
          </p>
          <p className="text-xs text-stone-400 mt-2 font-medium">
            Billing, Receipt &amp; Accounts Software
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-7 space-y-4">

          {/* PRIMARY RECOMMENDED LOGIN: 1-Click Google Sign In */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-extrabold text-sm rounded-xl shadow-lg transition transform active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2.5 cursor-pointer border border-amber-300"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.18 3.66-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.29 21.36 7.37 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12c0 2.06.46 3.84 1.26 5.42l4.02-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.29 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>1-Click Sign In with Google (Recommended)</span>
            </button>
            <p className="text-[11px] text-center text-amber-200/80">
              Instant login with your Google account &bull; Zero setup required
            </p>
          </div>

          <div className="relative my-4 flex items-center justify-center">
            <div className="w-full h-px bg-stone-800"></div>
            <span className="bg-stone-900 px-3 text-[10px] text-stone-500 uppercase tracking-widest font-semibold absolute">
              Or Sign In with Email &amp; Password
            </span>
          </div>
          
          {errorMsg && (
            <div className="bg-rose-950/80 border border-rose-800 text-rose-200 text-xs p-3 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {showConsoleNotice && (
            <div className="bg-amber-950/90 border border-amber-600/70 text-amber-100 text-xs p-3.5 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <Sparkles className="w-4 h-4" />
                <span>How to Enable Email/Password Provider:</span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                By default, new Firebase projects require turning on Email/Password under Authentication:
              </p>
              <ol className="list-decimal list-inside text-[11px] text-amber-200/80 space-y-1">
                <li>Go to <strong>Authentication &gt; Sign-in method</strong> in Firebase Console.</li>
                <li>Click <strong>Email/Password</strong>, toggle <strong>Enable</strong> to ON, and click <strong>Save</strong>.</li>
              </ol>
              <div className="pt-1 flex flex-wrap gap-2">
                <a
                  href="https://console.firebase.google.com/project/plucky-polymer-mn56p/authentication/providers"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-stone-950 font-bold text-xs transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Firebase Console
                </a>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs transition cursor-pointer"
                >
                  Sign In with Google
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-xs font-bold text-stone-300 mb-1 flex items-center justify-between">
                <span>Email Address / User ID</span>
                <button
                  type="button"
                  onClick={fillAdminPreset}
                  className="text-[10px] text-amber-400 hover:text-amber-300 underline font-normal cursor-pointer"
                >
                  Fill Admin Preset
                </button>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@jasolfurniture.com"
                  className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-300 mb-1 block">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-stone-950 border border-stone-700 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none"
                  required
                />
              </div>
            </div>

            {/* Email/Pass Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-stone-800 hover:bg-stone-700 border border-amber-600/40 text-amber-200 font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              {loading ? 'Please wait...' : isRegister ? 'Create Email Account' : 'Sign In with Email & Password'}
            </button>
          </form>

          {/* Toggle between login and registration */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg('');
                setShowConsoleNotice(false);
              }}
              className="text-[11px] text-amber-400 hover:text-amber-300 font-medium transition cursor-pointer"
            >
              {isRegister 
                ? 'Already have an account? Sign In' 
                : "Don't have an account yet? Create one"}
            </button>
          </div>

          <div className="pt-2 text-center text-[10px] text-stone-500 border-t border-stone-800/80">
            Jasol Furniture &bull; Washim, Maharashtra &bull; Firebase Cloud Database
          </div>
        </div>
      </div>
    </div>
  );
};

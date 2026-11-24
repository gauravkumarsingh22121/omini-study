import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { MindgraspLogo } from '../components/MindgraspLogo';

export function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
      setGoogleLoading(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setSuccessMsg('Account created! Please check your email for the confirmation link.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7EF] flex flex-col justify-between font-sans text-[#1C1A17]">
      {/* Top Navbar */}
      <header className="w-full bg-[#F7F7EF]/90 backdrop-blur-md border-b border-[#DDD8CB] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <MindgraspLogo />
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-block text-xs font-semibold uppercase tracking-wider text-[#0D9488] bg-[#E6FAF7] border border-[#BFF5F5] px-3 py-1 rounded-full">
              #1 AI Study Tool
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6">
          
          {/* Badge & Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6FAF7] border border-[#BFF5F5] text-[#0D9488] text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Used by 5M+ Students</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1C1A17] tracking-tight">
              {isSignUp ? (
                <>Create your <span className="text-[#0D9488] italic">Free Account</span></>
              ) : (
                <>Welcome back to <span className="text-[#0D9488] italic">OMINI-Study</span></>
              )}
            </h1>
            
            <p className="text-sm text-[#8E8B82]">
              {isSignUp 
                ? 'Turn your lectures and notes into active recall in seconds.' 
                : 'Continue your personalized AI study sessions.'}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-[#DDD8CB] rounded-2xl p-6 sm:p-8 shadow-sm">
            {/* Google Authentication Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full mb-5 py-2.5 px-4 rounded-xl border border-[#DDD8CB] bg-white hover:bg-gray-50 active:bg-gray-100 font-semibold text-sm text-[#1C1A17] transition-all flex items-center justify-center gap-3 shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              {googleLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#0D9488]" />
                  <span>Connecting to Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center mb-5">
              <div className="border-t border-[#DDD8CB] w-full" />
              <span className="bg-white px-3 text-xs font-semibold text-[#8E8B82] uppercase tracking-wider absolute">
                or with email
              </span>
            </div>

            {/* Toggle Tabs */}
            <div className="flex p-1 bg-[#F7F7EF] rounded-xl border border-[#DDD8CB] mb-6">
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setError(null); setSuccessMsg(null); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  !isSignUp 
                    ? 'bg-white text-[#1C1A17] shadow-xs' 
                    : 'text-[#8E8B82] hover:text-[#1C1A17]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setError(null); setSuccessMsg(null); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  isSignUp 
                    ? 'bg-white text-[#1C1A17] shadow-xs' 
                    : 'text-[#8E8B82] hover:text-[#1C1A17]'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error & Success Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-2">
                <span className="font-medium">{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-600" />
                <span className="font-medium">{successMsg}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleAuth}>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8E8B82] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8E8B82]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DDD8CB] focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/20 outline-none text-sm transition-all text-[#1C1A17]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8E8B82] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8E8B82]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DDD8CB] focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/20 outline-none text-sm transition-all text-[#1C1A17]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm text-white bg-[#1C1B17] hover:bg-black active:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Please wait...</span>
                  </>
                ) : (
                  <>
                    <span>{isSignUp ? 'Start Free Study Session' : 'Sign In'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Social Proof */}
          <div className="text-center pt-2">
            <p className="text-xs font-semibold text-[#8E8B82] uppercase tracking-wider mb-3">
              Trusted by students at top universities
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-bold text-[#8E8B82]">
              <span>PRINCETON</span>
              <span>•</span>
              <span>STANFORD</span>
              <span>•</span>
              <span>MIT</span>
              <span>•</span>
              <span>CAMBRIDGE</span>
              <span>•</span>
              <span>YALE</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-[#8E8B82] bg-[#EFECE3] border-t border-[#DDD8CB]">
        © {new Date().getFullYear()} OMINI-Study. All rights reserved.
      </footer>
    </div>
  );
}

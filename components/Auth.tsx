import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface AuthProps {
  onComplete: (email: string) => void;
  onBack: () => void;
  onGuestMode: () => void;
}

const Auth: React.FC<AuthProps> = ({ onComplete, onBack, onGuestMode }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // Sign up with Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split('@')[0],
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // Check if session exists (means auto-login successful)
        if (data.session) {
          setMessage('Account created successfully!');
          onComplete(email);
          return;
        }

        // Check if email confirmation is required
        if (data.user.identities && data.user.identities.length === 0) {
          setError('This email is already registered. Please sign in instead.');
          setIsLogin(true);
        } else if (data.user.confirmed_at) {
          // Auto-confirmed (if email confirmation is disabled in Supabase)
          setMessage('Account created successfully!');
          onComplete(email);
        } else {
          // Email confirmation required
          setMessage('Check your email for a confirmation link to complete registration!');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        // Fetch user profile from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile fetch error:', profileError);
        }

        onComplete(data.user.email!);
      }
    } catch (err: any) {
      if (err.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else if (err.message.includes('Email not confirmed')) {
        setError('Please verify your email before signing in. Check your inbox for the confirmation link.');
      } else {
        setError(err.message || 'Sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setMessage('Password reset link sent! Check your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 font-['Inter']">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
        {/* Logo */}
        <div className="text-center">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl font-black text-black">G</span>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">GTD</h1>
          <p className="text-sm text-zinc-500 mt-2">Neural System Authentication</p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {message && (
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-2xl">
            <p className="text-sm text-green-400">{message}</p>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={isLogin ? handleSignIn : handleSignUp} className="space-y-6">
          {/* Name field (Sign Up only) */}
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-all"
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-all"
            />
            {!isLogin && (
              <p className="text-xs text-zinc-600 mt-1">Minimum 6 characters</p>
            )}
          </div>

          {/* Forgot Password (Login only) */}
          {isLogin && (
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={loading}
              className="text-xs text-blue-500 hover:text-blue-400 transition-all disabled:opacity-50"
            >
              Forgot password?
            </button>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-white text-black rounded-xl font-black text-sm uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                {isLogin ? 'Signing In...' : 'Creating Account...'}
              </span>
            ) : (
              <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>
        </form>

        {/* Toggle Login/Signup */}
        <div className="text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setMessage(null);
            }}
            className="text-sm text-zinc-500 hover:text-white transition-all"
          >
            {isLogin ? (
              <>Don't have an account? <span className="text-white font-bold">Sign Up</span></>
            ) : (
              <>Already have an account? <span className="text-white font-bold">Sign In</span></>
            )}
          </button>
        </div>

        {/* Guest Mode */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-black px-2 text-zinc-600">Or</span>
          </div>
        </div>

        <button
          onClick={onGuestMode}
          className="w-full py-3 border-2 border-zinc-800 hover:border-zinc-700 rounded-xl font-bold text-xs uppercase tracking-wider text-zinc-400 hover:text-white transition-all"
        >
          Continue as Guest
        </button>

        <p className="text-xs text-zinc-600 text-center">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Auth;

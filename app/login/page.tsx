'use client'

import { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { LogIn, Mail, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import Cookies from 'js-cookie'

import { googleSignInWithIdToken } from '../../lib/googleSignIn'   // ⭐ ADD THIS

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false) // ⭐ ADD THIS
  const { login, setUser } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await login(formData.email, formData.password)
      toast.success('Login successful!')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  // ⭐ Google Login Handler
  const handleGoogleLogin = async () => {
  try {
    setGoogleLoading(true);

    // 1️⃣ Firebase login
    const { firebaseUser, idToken } = await googleSignInWithIdToken();

    // 2️⃣ Hit backend Google login
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/google`,
      { idToken }
    );

    const { token, user } = response.data;

    // 3️⃣ Store JWT
    Cookies.set('token', token, { expires: 7 });
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // 4️⃣ Update global auth state
    setUser(user);

    toast.success('Logged in with Google!');
    router.push('/dashboard');

  } catch (err: any) {
    toast.error(err.response?.data?.message || 'Google sign-in failed');
  } finally {
    setGoogleLoading(false);
  }
};



  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <LogIn className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field pl-10"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field pl-10"
                placeholder="Enter your password"
              />
            </div>
          </div>

          {/* Normal Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* ⭐ Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full mt-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2"
        >
          <img src="/google-logo.svg" alt="Google" className="w-5 h-5" />
          {googleLoading ? 'Connecting...' : 'Sign in with Google'}
        </button>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

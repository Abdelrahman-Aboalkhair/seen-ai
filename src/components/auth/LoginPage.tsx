import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../../lib/auth'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Card } from '../ui/Card'
import { Mail, Lock, BrainCircuit, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    setLoading(true)
    try {
      console.log('Attempting login with:', { email })
      const { error } = await signIn(email, password)
      
      if (error) {
        console.error('Login failed with error:', error)
        // The error message is already handled in the auth context
        return
      }
      
      console.log('Login successful, navigating to dashboard')
      toast.success('تم تسجيل الدخول بنجاح!')
      navigate('/dashboard')
    } catch (error: any) {
      console.error('Unexpected login error:', error)
      toast.error('حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000" />
        </div>
      </div>

      <div className="relative z-10 max-w-md w-full space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <div className="flex items-center justify-center space-x-3 mb-6">
            <img src="/logo-new.png" alt="SEEN AI" className="h-10 w-auto" />
            <BrainCircuit className="h-10 w-10 text-cyan-400" />
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              SEEN AI
            </span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-400">
            Sign in to your account to access the AI system
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Card>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-white text-center mb-6">Sign In</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  icon={<Mail className="h-4 w-4" />}
                  required
                />
                
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  icon={<Lock className="h-4 w-4" />}
                  required
                />

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm text-gray-300">Remember me</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button type="submit" className="w-full" loading={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                  {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-400">
                  Don't have an account?{' '}
                  <Link
                    to="/signup"
                    className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                  >
                    Create new account
                  </Link>
                </p>
              </div>

              {/* Demo Accounts */}
              <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
                <h4 className="text-sm font-medium text-white mb-2">🧪 Demo Accounts:</h4>
                <div className="text-xs space-y-1 text-gray-400">
                  <p><strong>Regular User:</strong> user@test.com / Test123!</p>
                  <p><strong>Admin:</strong> admin@seenai.com / Admin123!</p>
                </div>
                <div className="mt-2 text-xs text-cyan-400">
                  💡 You can copy and paste these credentials
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-center"
        >
          <Link
            to="/"
            className="text-gray-400 hover:text-cyan-400 text-sm transition-colors flex items-center justify-center space-x-2"
          >
            <span>Back to Home</span>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
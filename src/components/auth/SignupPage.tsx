import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Mail, Lock, User, BrainCircuit, Gift, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

export function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password || !fullName) {
      toast.error('Please fill in all required fields')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Password and confirmation do not match')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (!agreedToTerms) {
      toast.error('You must agree to the Terms of Service')
      return
    }

    setLoading(true)
    try {
      const { error } = await signUp(email, password, fullName)
      if (!error) {
        toast.success('Activation link sent to your email')
        navigate('/login')
      }
    } catch (error) {
      console.error('Signup error:', error)
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
            Join the Future of Hiring
          </h2>
          <p className="text-gray-400">
            Create your account and get 200 free credits
          </p>
          
          {/* Free Credits Badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500/20 to-cyan-500/20 border border-green-500/30 rounded-full px-4 py-2 mt-4"
          >
            <Gift className="h-4 w-4 text-green-400" />
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-medium text-white">200 Free Credits</span>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Create New Account</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                  label="Full Name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ahmed Mohammed Ali"
                  icon={<User className="h-4 w-4" />}
                  required
                />
                
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
                  placeholder="At least 6 characters"
                  icon={<Lock className="h-4 w-4" />}
                  required
                />
                
                <Input
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  icon={<Lock className="h-4 w-4" />}
                  required
                />

                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="w-4 h-4 text-cyan-600 bg-slate-700 border-slate-600 rounded focus:ring-cyan-500 focus:ring-2 mt-0.5"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-300 leading-relaxed">
                    I agree to the{' '}
                    <Link to="/terms" className="text-cyan-400 hover:text-cyan-300">
                      Terms of Service
                    </Link>
                    {' '}and{' '}
                    <Link to="/privacy" className="text-cyan-400 hover:text-cyan-300">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                <Button type="submit" className="w-full" loading={loading}>
                  {loading ? 'Creating Account...' : 'Create Account & Get 200 Credits'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-400">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>

              {/* Info about demo accounts */}
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h4 className="text-sm font-medium text-white mb-2">💡 Quick Start</h4>
                <p className="text-xs text-gray-400">
                  Want to test immediately? Use our demo accounts on the login page!
                </p>
              </div>
            </CardContent>
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
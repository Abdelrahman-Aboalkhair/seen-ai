import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        // Get the hash fragment from the URL
        const hashFragment = window.location.hash

        if (hashFragment && hashFragment.length > 0) {
          // Exchange the auth code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(hashFragment)

          if (error) {
            console.error('Error exchanging code for session:', error.message)
            toast.error('Error activating your account')
            navigate('/login?error=' + encodeURIComponent(error.message))
            return
          }

          if (data.session) {
            toast.success('Account activated successfully! Welcome!')
            navigate('/dashboard')
            return
          }
        }

        // If we get here, something went wrong
        navigate('/login?error=No session found')
      } catch (error) {
        console.error('Auth callback error:', error)
        toast.error('Error activating your account')
        navigate('/login')
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 text-cyan-400 animate-spin mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Activating your account...</h2>
        <p className="text-gray-400">Please wait while we activate your account</p>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function Page() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ברגע שהקומפוננטה עולה, בודקים אם כבר מחובר
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClientComponentClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        router.push('/home')
      }
    }
    checkSession()
  }, [router])

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!email || !password) {
      setError('אנא מלאי את כל השדות.')
      setLoading(false)
      return
    }

    const supabase = createClientComponentClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('שם משתמש או סיסמה שגויים.')
    } else {
      router.push('/home')
    }

    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-pink-100 via-blue-100 to-indigo-100 font-sans"
      dir="rtl"
    >
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md transition hover:shadow-3xl">
        <div className="text-center text-6xl mb-4 text-gray-700">🍼</div>
        <h1 className="text-center text-3xl font-bold text-gray-800 mb-2">ברוכה הבאה!</h1>
        <p className="text-center text-lg text-gray-600 mb-6">
          התחברי לניהול ציוד למשפחה עם תינוקת בקלות ובכיף.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="text-right">
            <label htmlFor="email" className="block text-gray-600 text-sm font-medium mb-2">
              כתובת אימייל
            </label>
            <input
              id="email"
              type="email"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent text-gray-700 text-right"
              placeholder="הכניסי אימייל"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="text-right">
            <label htmlFor="password" className="block text-gray-600 text-sm font-medium mb-2">
              סיסמה
            </label>
            <input
              id="password"
              type="password"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent text-gray-700 text-right"
              placeholder="הכניסי סיסמה"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="text-red-500 text-center text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-gradient-to-r from-pink-400 to-pink-600 text-white font-bold text-lg hover:from-pink-500 hover:to-pink-700 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l2-2.647z"
                  />
                </svg>
                מתחברת...
              </>
            ) : (
              'התחברי'
            )}
          </button>

          <div className="text-center mt-4 text-sm">
            <a href="/reset-password" className="text-pink-600 hover:underline">
              שכחתי סיסמה
            </a>
          </div>

          <div className="text-center mt-2 text-sm">
            <a href="/register" className="text-pink-600 hover:underline">
              צרי חשבון חדש
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}

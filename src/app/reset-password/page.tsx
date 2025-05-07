// src/app/reset-password/page.tsx
'use client'

import { useState } from 'react'
// ייבוא הפונקציה ליצירת לקוח קליינט
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false); // הוספת סטייט לטעינה

  // יצירת לקוח Supabase המיועד לשימוש בקומפוננטות קליינט
  const supabase = createClientComponentClient();


  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true); // התחלת טעינה

    // קריאה לשליחת אימייל איפוס סיסמה
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
         // הגדרת הכתובת שאליה Supabase יפנה לאחר שהמשתמש ילחץ על הקישור באימייל
         // חשוב! כתובת זו צריכה להיות עמוד/Route Handler באפליקציה שלך שיודע לטפל בזה.
         // נשתמש כאן בנתיב שנתקין בהמשך, למשל /auth/callback
         // שימו לב שה-URL צריך לכלול את ה-host (למשל: https://your-app-url.com/auth/callback)
         // בזמן פיתוח זה יהיה בדרך כלל http://localhost:3000/auth/callback
         // ודא שה-URL תואם את ה-Site URL בהגדרות ה-Auth של Supabase -> General
         redirectTo: `${location.origin}/auth/callback`, // שינוי כאן
    });


    if (error) {
      console.error('Password reset request error:', error.message); // הדפסת שגיאה לקונסול
      setError(error.message) // הצגת הודעת שגיאה למשתמש
      setLoading(false); // סיום טעינה במקרה שגיאה
    } else {
      console.log('Password reset email sent.'); // הדפסת הצלחה לקונסול
      setMessage('קישור לאיפוס סיסמה נשלח למייל שלך'); // הודעת הצלחה למשתמש
      setEmail(''); // ניקוי שדה המייל
      setLoading(false); // סיום טעינה בהצלחה
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-indigo-100 to-pink-100 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
        <div className="text-center text-6xl mb-4 text-gray-700">🔒</div>
        <h1 className="text-center text-3xl font-bold text-gray-800 mb-2">שכחת סיסמה?</h1>
        <p className="text-center text-lg text-gray-600 mb-6">נשלח לך קישור לשחזור</p>

        <form onSubmit={handleReset} className="space-y-4">
          <input
            type="email"
            placeholder="כתובת אימייל"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 text-gray-700"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {message && <p className="text-green-600 text-sm text-center">{message}</p>}

          <button
            type="submit"
            className="w-full py-3 rounded-full bg-gradient-to-r from-pink-400 to-pink-600 text-white font-bold text-lg hover:from-pink-500 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading} // הוספת דיסייבל בזמן טעינה
          >
             {loading ? 'שולחת...' : 'שלחי קישור לאיפוס'} {/* שינוי טקסט בזמן טעינה */}
          </button>
        </form>

        <p className="text-center text-sm mt-6">
          נזכרת?{' '}
          <a href="/" className="text-pink-600 font-bold hover:underline">התחברי כאן</a>
        </p>
      </div>
    </div>
  )
}
// src/app/register/page.tsx
'use client'

import { useState } from 'react'
// ייבוא הפונקציה ליצירת לקוח קליינט
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  // סטייט חדש להצגת הודעה לאחר הרשמה מוצלחת
  const [successMessage, setSuccessMessage] = useState<string | null>(null);


  // יצירת לקוח Supabase המיועד לשימוש בקומפוננטות קליינט
  const supabase = createClientComponentClient();


  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null) // איפוס שגיאות קודמות
    setSuccessMessage(null); // איפוס הודעת הצלחה קודמת
    setLoading(true)

    // ודא שדות אימייל וסיסמה אינם ריקים
     if (!email || !password) {
        setError('אנא מלאי את כל השדות.');
        setLoading(false);
        return;
     }


    const { error } = await supabase.auth.signUp({
        email,
        password,
         // אופציה: להוסיף redirectUrl לאימות אימייל אם רוצים לנתב לדף ספציפי אחרי הקלקה על קישור האימות
         // options: {
         //     emailRedirectTo: `${location.origin}/auth/confirm`, // דוגמה לניתוב לדף באפליקציה שלך
         // },
    });


    if (error) {
      console.error('Registration error:', error.message); // הדפסת השגיאה לקונסול למטרות דיבוג
      setError(error.message) // הצגת שגיאה ספציפית מה-Supabase (ניתן לשנות להודעה גנרית)
    } else {
      // הרשמה מוצלחת - הצג הודעה למשתמש לבדוק אימייל
      console.log('Registration successful, awaiting email confirmation'); // הדפסת דיבוג
      setSuccessMessage('נרשמת בהצלחה! אנא בדקי את האימייל שלך לאישור.');
      setEmail(''); // ניקוי שדות הטופס
      setPassword('');
      // **חשוב:** לא מנתבים אוטומטית ל- '/' כאן.
      // המשתמש צריך לאשר את האימייל לפני שהוא יכול להתחבר.
      // router.push('/') // <--- הסרנו את הניתוב האוטומטי
    }

    setLoading(false) // סיום מצב טעינה
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-100 to-pink-100 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
        <div className="text-center text-6xl mb-4 text-gray-700">👶</div>
        <h1 className="text-center text-3xl font-bold text-gray-800 mb-2">יצירת חשבון</h1>
        <p className="text-center text-lg text-gray-600 mb-6">התחילי לנהל את הציוד שלכן יחד 👨‍👩‍👧</p>

        {/* טופס הרשמה מוצג רק אם אין הודעת הצלחה */}
        {!successMessage ? (
            <form onSubmit={handleRegister} className="space-y-4">
              <input
                type="email"
                placeholder="כתובת אימייל"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 text-gray-700"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <input
                type="password"
                placeholder="סיסמה"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 text-gray-700"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              {error && <p className="text-red-500 text-sm text-center">{error}</p>}

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-gradient-to-r from-pink-400 to-pink-600 text-white font-bold text-lg hover:from-pink-500 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'נרשמת...' : 'צרי חשבון'}
              </button>
            </form>
        ) : (
            // הצגת הודעת הצלחה לאחר הרשמה מוצלחת
            <div className="text-center text-green-600 font-semibold p-4 bg-green-100 rounded-lg">
                {successMessage}
                <p className="mt-4 text-sm text-gray-700">
                    לאחר אישור האימייל, תוכלי{' '}
                    <a href="/" className="text-pink-600 font-bold hover:underline">להתחבר כאן</a>.
                </p>
            </div>
        )}


        {!successMessage && ( // הצג קישור התחברות רק אם לא הוצגה הודעת הצלחה
            <p className="text-center text-sm mt-6">
              כבר יש לך חשבון?{' '}
              <a href="/" className="text-pink-600 font-bold hover:underline">התחברי כאן</a>
            </p>
        )}
      </div>
    </div>
  )
}
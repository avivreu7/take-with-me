// src/app/reset-password/update/page.tsx
'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null); // State for general errors
  const [loading, setLoading] = useState(false);

  const supabase = createClientComponentClient();
  const router = useRouter();

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[UpdatePassword] Form submitted'); // לוג 1
    setError(null);
    setMessage(null);
    setLoading(true);

    if (!password) {
      console.log('[UpdatePassword] Password field is empty'); // לוג 2
      setError('אנא הכניסי סיסמה חדשה.');
      setLoading(false);
      return;
    }

    console.log('[UpdatePassword] Getting user...'); // לוג 3
    const { data: { user }, error: getUserError } = await supabase.auth.getUser(); // שים לב, הוספתי getUserError

    if (getUserError) {
        console.error('[UpdatePassword] Error getting user:', getUserError.message);
        setError('שגיאה בקבלת פרטי המשתמש. נסי לרענן או לאפס סיסמה מחדש.');
        setLoading(false);
        return;
    }

    if (!user) {
      console.log('[UpdatePassword] No user session found'); // לוג 4
      setError('לא זוהה משתמש מחובר. אנא נסי את תהליך איפוס הסיסמה מחדש.');
      setLoading(false);
      return;
    }
    console.log('[UpdatePassword] User found:', user.id); // לוג 5

    console.log('[UpdatePassword] Attempting to update user password...'); // לוג 6
    // קריאה לעדכון הסיסמה של המשתמש המחובר (במצב איפוס)
    // נשתמש בשם אחר לאובייקט השגיאה כדי להיות בטוחים
    const { error: supabasePasswordUpdateError } = await supabase.auth.updateUser({
      password: password,
    });
    console.log('[UpdatePassword] supabase.auth.updateUser call completed.'); // לוג 7

    // הדפסת אובייקט השגיאה שהתקבל, אם קיים
    if (supabasePasswordUpdateError) {
      console.log('[UpdatePassword] supabasePasswordUpdateError object exists:', supabasePasswordUpdateError); // לוג 8
      console.error('[UpdatePassword] Password update error from Supabase:', supabasePasswordUpdateError.message);
      // כאן אתה יכול להוסיף את הלוגיקה המפורטת יותר לטיפול בשגיאות שהצעתי קודם
      if (supabasePasswordUpdateError.message.includes("New password should be different from the old password") || supabasePasswordUpdateError.message.includes("Password should be different from the old password")) {
        setError('הסיסמה החדשה חייבת להיות שונה מהסיסמה הישנה.');
      } else if (supabasePasswordUpdateError.message.toLowerCase().includes("user not found")) {
        setError('שגיאה בעדכון הסיסמה. ייתכן שהקישור פג תוקף או שהמשתמש אינו קיים. נסי לבקש קישור חדש.');
      } else if (supabasePasswordUpdateError.message.includes("characters")) {
        setError('הסיסמה חייבת להכיל לפחות 6 תווים (או לפי הגדרותיך).');
      } else if (supabasePasswordUpdateError.message.includes("same as the old")) { // תוספת אפשרית
        setError('הסיסמה החדשה חייבת להיות שונה מהקודמת.');
      }
      else {
        setError('שגיאה בעדכון הסיסמה. אנא נסי שוב.');
      }
    } else {
      console.log('[UpdatePassword] Password updated successfully!'); // לוג 9
      setMessage('הסיסמה עודכנה בהצלחה! כעת תוכלי להתחבר.');
      setPassword(''); // ניקוי השדה

      setTimeout(() => {
        router.push('/');
      }, 3000);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-indigo-100 to-pink-100 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md">
        <h1 className="text-center text-3xl font-bold text-gray-800 mb-4">עדכני סיסמה</h1>

        {!message ? (
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <p className="text-gray-600 text-sm text-center mb-6">הכניסי סיסמה חדשה עבור חשבונך.</p>
            <input
              type="password"
              placeholder="סיסמה חדשה"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-300 text-gray-700"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {/* הצגת הודעת השגיאה מה-state */}
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
              type="submit"
              className="w-full py-3 rounded-full bg-gradient-to-r from-pink-400 to-pink-600 text-white font-bold text-lg hover:from-pink-500 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'מעדכנת...' : 'עדכני סיסמה'}
            </button>
          </form>
        ) : (
          <div className="text-center text-green-600 font-semibold p-4 bg-green-100 rounded-lg">
            {message}
            <p className="mt-4 text-sm text-gray-700">
              מנתבת אותך לעמוד ההתחברות...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
// src/app/home/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
// ייבוא הפונקציה ליצירת לקוח קליינט
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type List = {
  id: string
  name: string
}

export default function HomePage() {
  const router = useRouter()
  const [customLists, setCustomLists] = useState<List[]>([])
  const [newListName, setNewListName] = useState('')
  const [showInput, setShowInput] = useState(false)

  // יצירת לקוח Supabase המיועד לשימוש בקומפוננטות קליינט
  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUserLists = async () => {
      // בדיקה אם יש session קיים - אם לא, מנתבים חזרה לעמוד ההתחברות
      // (למרות שה-middleware אמור לטפל בזה קודם)
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        console.log("No user session found, redirecting to /"); // הדפסת דיבוג
        router.push('/')
        return
      }

      // אם יש משתמש, טוענים את הרשימות שלו
      const { data, error } = await supabase
        .from('lists')
        .select('id, name')
        .eq('user_id', user.id)

      if (!error && data) {
        const filtered = data.filter(
          (list) => !['gan', 'parents', 'trip'].includes(list.name)
        )
        setCustomLists(filtered)
      } else if (error) {
        console.error("Error fetching lists:", error.message); // הדפסת שגיאה
      }
    }

    getUserLists()

    // הקשבה לשינויים במצב ה-Auth (למשל, התנתקות ממקום אחר או פקיעת תוקף)
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
             console.log("Auth state changed: SIGNED_OUT or no session, redirecting to /"); // הדפסת דיבוג
            router.push('/');
        }
    });

    // ניקוי ה-listener בעת הסרת הקומפוננטה מה-DOM
    return () => {
        authListener?.subscription.unsubscribe();
    };

  }, [router, supabase]) // הוספת supabase לתלות של useEffect

  const handleCardClick = (route: string) => {
    router.push(route)
  }

  const handleAddList = async () => {
    if (!newListName.trim()) return

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        console.error("User not found when trying to add list"); // הדפסת שגיאה
        alert("שגיאה: לא זוהה משתמש. אנא התחברי מחדש.");
        // אולי לנתב חזרה להתחברות אם אין משתמש
        // router.push('/');
        return;
    }

    const family_id = user.user_metadata?.family_id ?? null

    const { data: newList, error } = await supabase.from('lists').insert({
      name: newListName.trim(),
      user_id: user.id,
      family_id: family_id,
    }).select('id, name').single(); // בחירת הנתונים שהוכנסו כדי לעדכן את הסטייט בלי reload

    if (!error && newList) {
      setCustomLists(prev => [...prev, newList]); // עדכון הסטייט ישירות
      setNewListName('')
      setShowInput(false)
      // הימנעות מ-location.reload() לטובת חווית משתמש טובה יותר
      // location.reload()
    } else {
      console.error('שגיאה בהוספת רשימה:', error.message) // הודעת שגיאה מפורטת לקונסול
      alert('שגיאה בהוספת רשימה. אנא נסו שוב.'); // הודעה גנרית למשתמש
    }
  }

  const handleDeleteList = async (id: string) => {
      // אישור מהמשתמש לפני מחיקה
      if (!confirm("האם את בטוחה שברצונך למחוק את הרשימה הזו?")) {
          return;
      }

    const { error } = await supabase.from('lists').delete().eq('id', id)
    if (!error) {
      setCustomLists((prev) => prev.filter((list) => list.id !== id)) // עדכון הסטייט
    } else {
        console.error('שגיאה במחיקת רשימה:', error.message); // הודעת שגיאה מפורטת
        alert('שגיאה במחיקת רשימה. אנא נסו שוב.'); // הודעה גנרית
    }
  }

  // פונקציית ההתנתקות
  const handleLogout = async () => {
      console.log("Attempting to sign out..."); // הדפסת דיבוג
      const { error } = await supabase.auth.signOut();

      if (error) {
          console.error("Logout error:", error.message); // הדפסת שגיאה
          alert("שגיאה בהתנתקות. אנא נסו שוב.");
      } else {
          console.log("Sign out successful, redirecting to /"); // הדפסת דיבוג
          router.push('/'); // ניתוב לעמוד ההתחברות לאחר התנתקות
      }
  }


  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 via-blue-100 to-indigo-100 p-6 flex flex-col items-center">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl p-6 mt-10 text-right space-y-6">

        {/* כפתור התנתקות - הוספתי כאן, אפשר למקם לפי עיצוב */}
        <div className="text-left">
            <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:underline"
            >
                התנתקות
            </button>
        </div>


        <h1 className="text-3xl font-bold text-pink-600">ברוכה הבאה</h1>
        <p className="text-gray-600 text-sm">בחרי את סוג היציאה או הפעולה שברצונך לבצע:</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
          <div onClick={() => handleCardClick('/checklist/gan')} className="bg-pink-50 rounded-xl p-4 shadow hover:shadow-lg cursor-pointer">🎒 יציאה לגן</div>
          <div onClick={() => handleCardClick('/checklist/parents')} className="bg-pink-50 rounded-xl p-4 shadow hover:shadow-lg cursor-pointer">🏡 ביקור אצל ההורים</div>
          <div onClick={() => handleCardClick('/checklist/trip')} className="bg-pink-50 rounded-xl p-4 shadow hover:shadow-lg cursor-pointer">🧺 טיול</div>
        </div>

        {customLists.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm text-gray-500 mt-4">יציאות מותאמות אישית:</h3>
            {customLists.map((list) => (
              <div key={list.id} className="flex justify-between items-center bg-white rounded-xl shadow p-3 hover:shadow-md">
                <div onClick={() => handleCardClick(`/checklist/${list.id}`)} className="cursor-pointer text-pink-700 font-semibold">{list.name}</div>
                <button onClick={() => handleDeleteList(list.id)} className="text-sm text-red-500 hover:underline">מחקי</button>
              </div>
            ))}
          </div>
        )}

        {showInput ? (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="שם היציאה (למשל: קניות)"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button onClick={handleAddList} className="flex-1 bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600">הוסיפי</button>
              <button onClick={() => setShowInput(false)} className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg">ביטול</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowInput(true)} className="w-full bg-pink-100 border-2 border-pink-400 text-pink-600 py-2 rounded-xl hover:bg-pink-200 transition">
            ➕ הוסיפי יציאה חדשה
          </button>
        )}

        {/* הפרדה ויזואלית לרשימת הציוד הכללית */}
        <div className="border-t border-gray-300 pt-4 mt-6 space-y-2 text-center">
          <p className="text-xs text-gray-500 px-4">
            🎒 <span className="font-semibold">רשימת הציוד הכללית</span> היא המקום להכניס את כל הציוד הקיים בבית – ממנו תבחרי פריטים לכל אחת מהיציאות.
          </p>
          <button
            onClick={() => handleCardClick('/inventory')}
            className="w-full bg-blue-100 text-blue-800 py-2 rounded-xl hover:bg-blue-200 transition font-semibold"
          >
            📦 מעבר לרשימת הציוד הכללית
          </button>
        </div>
      </div>
    </div>
  )
}
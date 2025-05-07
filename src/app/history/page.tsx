'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@lib/supabaseClient'

type List = {
  id: string
  name: string
  created_at: string
}

export default function HistoryPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [lists, setLists] = useState<List[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserAndLists = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) return
      setUserId(user.id)

      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('שגיאה בטעינת יציאות:', error.message)
      } else {
        setLists(data || [])
      }

      setLoading(false)
    }

    fetchUserAndLists()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 via-blue-100 to-indigo-100 p-6 text-right">
      <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-3xl p-6">
        <h1 className="text-2xl font-bold text-pink-600 mb-6 text-center">📅 היסטוריית יציאות</h1>

        {loading ? (
          <p className="text-center text-gray-500">טוען נתונים...</p>
        ) : lists.length === 0 ? (
          <p className="text-center text-gray-400">לא נמצאו יציאות קודמות.</p>
        ) : (
          <ul className="space-y-4">
            {lists.map((list) => (
              <li
                key={list.id}
                className="bg-pink-50 p-4 rounded-xl shadow-sm hover:shadow transition"
              >
                <div className="text-lg font-semibold text-gray-800">{list.name}</div>
                <div className="text-sm text-gray-500">
                  נוצרה בתאריך: {new Date(list.created_at).toLocaleDateString('he-IL')}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

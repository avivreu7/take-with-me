// src/app/inventory/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
// ייבוא הפונקציה ליצירת לקוח קליינט
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type Item = {
  id: string
  name: string
  category: string
  user_id: string
}

export default function InventoryPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [newCategory, setNewCategory] = useState('')
  const [newItemsText, setNewItemsText] = useState('')

  // 1. קבלת מזהה המשתמש וטעינת הפריטים
  useEffect(() => {
    const getUserAndData = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error('שגיאה בקבלת משתמש:', userError.message)
      }
      const currentUserId = userData.user?.id || null
      setUserId(currentUserId)

      if (currentUserId) {
        const { data, error } = await supabase
          .from('inventory')
          .select('*')
          .eq('user_id', currentUserId)
        if (error) {
          console.error('שגיאה בטעינת פריטים:', error.message)
        } else {
          setItems(data || [])
        }
      }
      setLoading(false)
    }
    getUserAndData()
  }, [supabase])

  // 2. קטגוריות ייחודיות מתוך הפריטים
  const uniqueCategories = Array.from(new Set(items.map((item) => item.category)))

  // 3. הוספת פריטים (מקבוצת טקסט)
  const handleAddItems = async () => {
    if (!newCategory.trim() || !newItemsText.trim() || !userId) {
      console.log('Validation failed')
      return
    }
    const names = newItemsText
      .split(/\n|,/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    const insertData = names.map((name) => ({
      name,
      category: newCategory,
      user_id: userId,
    }))

    const { data: insertedItems, error } = await supabase
      .from('inventory')
      .insert(insertData)
      .select('*')

    if (error) {
      console.error('שגיאה בהוספת פריטים:', error.message)
      alert('שגיאה בהוספת פריטים. אנא נסי שוב.')
    } else {
      setItems((prev) => [...prev, ...(insertedItems || [])])
      setNewItemsText('')
      setNewCategory('')
    }
  }

  // 4. מחיקת פריט בודד
  const handleDeleteItem = async (id: string) => {
    if (!confirm('האם למחוק פריט זה?')) return
    const { error } = await supabase.from('inventory').delete().eq('id', id)
    if (error) {
      console.error('שגיאה במחיקת פריט:', error.message)
      alert('שגיאה במחיקת פריט.')
    } else {
      setItems((prev) => prev.filter((item) => item.id !== id))
    }
  }

  // 5. מחיקת קטגוריה שלמה
  const handleDeleteCategory = async (category: string) => {
    if (!confirm(`להסיר קטגוריה "${category}" וכל הפריטים בה?`)) return
    const { error } = await supabase.from('inventory').delete().eq('category', category)
    if (error) {
      console.error('שגיאה במחיקת קטגוריה:', error.message)
      alert('שגיאה במחיקת קטגוריה.')
    } else {
      setItems((prev) => prev.filter((item) => item.category !== category))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 via-blue-100 to-indigo-100 p-6">
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-pink-600">רשימת ציוד</h1>
          <button
            onClick={() => router.push('/home')}
            className="text-sm text-blue-600 underline"
          >
            חזרה לדף הבית
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-4 mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-2 text-right">
            הוספת פריטים
          </h2>

          <label className="block text-sm mb-1 text-right">
            בחרי או הזיני קטגוריה:
          </label>
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="w-full p-2 border rounded mb-2 text-right"
          >
            <option value="">-- בחרי קטגוריה --</option>
            {uniqueCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            {newCategory &&
              !uniqueCategories.includes(newCategory) && (
                <option value={newCategory}>
                  {newCategory} (חדשה)
                </option>
              )}
          </select>

          <input
            type="text"
            placeholder="או כתבי קטגוריה חדשה"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="w-full p-2 border rounded mb-2 text-right"
          />

          <label className="block text-sm mb-1 text-right">
            הכניסי פריטים (מופרדים בפסיק או שורה):
          </label>
          <textarea
            value={newItemsText}
            onChange={(e) => setNewItemsText(e.target.value)}
            placeholder="בקבוק, חיתול, מגבונים"
            rows={4}
            className="w-full p-2 border rounded mb-2 text-right"
          />

          <button
            onClick={handleAddItems}
            className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 w-full"
          >
            הוסיפי פריטים
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">טוען פריטים...</p>
      ) : (
        <div className="max-w-2xl mx-auto grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {uniqueCategories.map((category) => (
            <div
              key={category}
              className="bg-white rounded-3xl shadow-xl p-4 text-right relative"
            >
              <button
                onClick={() => handleDeleteCategory(category)}
                className="absolute top-3 left-3 text-sm text-red-500 hover:text-red-700"
              >
                🗑️ מחקי קטגוריה
              </button>
              <h2 className="text-xl font-bold text-pink-600 mb-3">
                {category}
              </h2>
              <ul className="space-y-2">
                {items
                  .filter((item) => item.category === category)
                  .map((item) => (
                    <li
                      key={item.id}
                      className="flex justify-between items-center px-3 py-2 bg-pink-50 rounded-xl shadow-sm text-gray-800"
                    >
                      <span>{item.name}</span>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        ✖️
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

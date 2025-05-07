// src/app/checklist/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation' // הוספת ייבוא של useRouter
// ייבוא הפונקציה ליצירת לקוח קליינט - ודא שזה מ-@supabase/auth-helpers-nextjs
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

import confetti from 'canvas-confetti'

type Item = {
  id: string
  name: string
  category: string
  is_checked?: boolean
  user_id: string
  // family_id?: string
}

export default function ChecklistPage() {
  const { id } = useParams()
  const router = useRouter() // אתחול ה-router
  const [userId, setUserId] = useState<string | null>(null)
  const [listItems, setListItems] = useState<Item[]>([])
  const [inventoryItems, setInventoryItems] = useState<Item[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [resetMessage, setResetMessage] = useState(false)
  const [allPacked, setAllPacked] = useState(false)
  const [loading, setLoading] = useState(true)

  // יצירת לקוח Supabase המיועד לשימוש בקומפוננטות קליינט - ודא שזה מ-@supabase/auth-helpers-nextjs
  const supabase = createClientComponentClient();

  // טען מזהה משתמש
  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
          console.error("שגיאה בקבלת משתמש:", userError.message);
      }
      if (user) setUserId(user.id);
        else setLoading(false); // אם אין משתמש, סיים טעינה
    }
    getUser();
  }, [supabase]);


  // טען את הפריטים של הצ'קליסט (תלוי ב-id ו-userId)
  useEffect(() => {
    const fetchChecklist = async () => {
      if (!userId || !id) return;

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('list_id', id)
        .eq('user_id', userId);

      if (error) {
        console.error('שגיאה בטעינת פריטי צ\'קליסט:', error.message);
      } else {
        setListItems(data || []);
      }
    }

    fetchChecklist();
  }, [id, userId, supabase]);


  // טען את הציוד הכללי (תלוי ב-userId)
  useEffect(() => {
    const fetchInventory = async () => {
      if (!userId) {
          setInventoryItems([]);
          setLoading(false);
          return;
      }

      // הקפד לבדוק את שם הטבלה הנכון. בדוגמה השתמשת ב-'inventory'
      const { data, error } = await supabase
        .from('inventory') // ודא ששם הטבלה נכון
        .select('id, name, category, user_id');

      if (error) {
        console.error('שגיאה בטעינת ציוד כללי:', error.message);
        setLoading(false);
      } else {
        setInventoryItems(data || []);
        setLoading(false);
      }
    }
    
    if (userId) { // בצע קריאה רק אם יש userId
        fetchInventory();
    } else {
        // אם אין userId, אפשר להחליט אם להציג הודעת טעינה או הודעה אחרת
        // כאן אני מניח שאם אין userId, אין מה לטעון מה-inventory עדיין.
        setLoading(false); // לדוגמה, אם אין משתמש, אין טעם לטעון inventory עד שהוא יתחבר
        // אם אתה רוצה להציג loading עד ש-userId יתקבל, השאר את setLoading(true) או שנה לוגיקה בהתאם
    }

  }, [userId, supabase]);


  // אנימציית קונפטי - תלויה רק ב-listItems
  useEffect(() => {
    const allChecked = listItems.length > 0 && listItems.every((item) => item.is_checked);
    setAllPacked(allChecked);

    if (allChecked) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [listItems]);


  // --- פונקציות שמטפלות בשינויים מול ה-Supabase ---

  const toggleItem = async (itemId: string, isChecked: boolean) => {
      if (!userId) return;
    const { error } = await supabase
      .from('items')
      .update({ is_checked: !isChecked })
      .eq('id', itemId)
      .eq('user_id', userId);

    if (error) {
      console.error('שגיאה בעדכון פריט:', error.message);
    } else {
      setListItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, is_checked: !isChecked } : item
        )
      );
    }
  };

  const deleteItem = async (itemId: string) => {
      if (!userId) return;
      if (!confirm("האם את בטוחה שברצונך למחוק פריט זה מהצ'קליסט?")) {
          return;
      }
    const { error } = await supabase.from('items').delete().eq('id', itemId).eq('user_id', userId);
    if (error) {
      console.error('שגיאה במחיקת פריט צ\'קליסט:', error.message);
    } else {
      setListItems((prev) => prev.filter((item) => item.id !== itemId));
    }
  };

  const handleAddSelectedItems = async (selectedIds: string[]) => {
    if (!userId || !id || selectedIds.length === 0) {
        console.log("Validation failed for adding selected items: userId, listId, or selectedIds missing/empty.");
        return;
    }
    const itemsToAdd = inventoryItems.filter((item) => selectedIds.includes(item.id));

    const insertPayload = itemsToAdd.map((item) => ({
      name: item.name,
      category: item.category,
      list_id: id, // ודא ששם העמודה הוא list_id בטבלת items
      is_checked: false,
      user_id: userId,
      // family_id: user?.user_metadata?.family_id ?? null, // אם אתה צריך את זה, ודא שיש לך גישה ל-user object
    }));

    if (insertPayload.length === 0) {
          console.log("No valid items selected to add.");
          return;
    }

    const { data: newChecklistItems, error } = await supabase.from('items').insert(insertPayload).select('*');
    if (error) {
      console.error('שגיאה בהוספת פריטים לצ\'קליסט:', error.message);
        alert('שגיאה בהוספת פריטים לצ\'קליסט. אנא נסו שוב.');
    } else {
        console.log('פריטים נוספו בהצלחה לצ\'קליסט:', newChecklistItems);
        if (newChecklistItems) {
            setListItems(prevItems => [...prevItems, ...newChecklistItems]);
        }
      setSelectedItems([]);
    }
  };

  const resetChecklist = async () => {
      if (!userId || !id) return;
      if (!confirm("האם את בטוחה שברצונך לאפס את כל הפריטים בצ'קליסט?")) {
          return;
      }
    const { error } = await supabase
      .from('items')
      .update({ is_checked: false })
      .eq('list_id', id)
      .eq('user_id', userId);

    if (!error) {
      setListItems((prev) =>
        prev.map((item) => ({ ...item, is_checked: false }))
      );
      setResetMessage(true);
      setTimeout(() => setResetMessage(false), 3000);
    } else {
        console.error('שגיאה באיפוס צ\'קליסט:', error.message);
        alert('שגיאה באיפוס צ\'קליסט. אנא נסו שוב.');
    }
  };

  const toggleSelection = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  // קבלת קטגוריות ייחודיות מרשימת הציוד הכללי (inventoryItems)
  // המיון נעשה ישירות לפני השימוש ב-JSX כדי לשמור על סדר עקבי
  const uniqueInventoryCategories = Array.from(
    new Set(inventoryItems.map((item) => item.category))
  );
  // אין צורך למיין כאן אם אתה ממיין בתוך ה-JSX

  // קבלת קטגוריות ייחודיות מפריטי הצ'קליסט הנוכחיים (listItems)
  const uniqueChecklistCategories = Array.from(
    new Set(listItems.map((item) => item.category))
  );
  // ניתן למיין גם כאן אם רוצים סדר קבוע לקטגוריות בצ'קליסט


  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 via-blue-100 to-indigo-100 p-4 text-right">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="bg-white shadow-xl rounded-3xl p-4 text-center relative">
          <button
            onClick={() => router.push('/home')} // כאן router מוגדר
            className="text-sm text-blue-600 underline absolute top-2 right-2"
          >
            חזרה לדף הבית
          </button>
          <h1 className="text-2xl font-bold text-pink-600">{`רשימת ציוד ל-${id}`}</h1>
        </div>

        {resetMessage && (
          <div className="text-center text-green-600 font-semibold animate-bounce">
            כל הפריטים אופסו! מוכנים ליום חדש עם הבייבי 💼🍼
          </div>
        )}

        {allPacked && (
          <div className="text-center text-green-700 font-bold text-xl animate-pulse">
            כל הכבוד! הכל נארז 🎉🍼💪
          </div>
        )}

        {/* הצגת פריטי הצ'קליסט הנוכחיים */}
        {/* הצג חלק זה רק אם יש פריטים בצ'קליסט או אם עדיין טוען */}
        {(uniqueChecklistCategories.length > 0 || (listItems.length === 0 && loading)) && (
            <div className="space-y-6">
                {uniqueChecklistCategories.sort().map((category) => ( // מיון קטגוריות הצ'קליסט
                    <div key={category} className="bg-white shadow-lg rounded-3xl p-6">
                        <h2 className="text-lg font-semibold text-pink-500 mb-4">{category}</h2>
                        <ul className="space-y-3">
                            {listItems
                                .filter((item) => item.category === category)
                                .map((item) => (
                                    <li
                                        key={item.id}
                                        className={`flex items-center justify-between px-4 py-2 rounded-xl shadow-sm bg-pink-50 ${
                                            item.is_checked ? 'line-through text-gray-400' : ''
                                        }`}
                                    >
                                        <span>{item.name}</span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => toggleItem(item.id, item.is_checked ?? false)}
                                                className={`text-sm rounded px-3 py-1 ${
                                                    item.is_checked
                                                        ? 'bg-green-300 text-white'
                                                        : 'bg-pink-500 text-white'
                                                }`}
                                            >
                                                {item.is_checked ? 'בוטל' : 'נארז'}
                                            </button>
                                            <button
                                                onClick={() => deleteItem(item.id)}
                                                className="text-sm px-2 py-1 bg-red-400 text-white rounded hover:bg-red-500"
                                            >
                                                מחיקה
                                            </button>
                                        </div>
                                    </li>
                                ))}
                        </ul>
                    </div>
                ))}
            </div>
       )}
        {/* הודעה אם אין פריטים בצ'קליסט */}
        {uniqueChecklistCategories.length === 0 && !loading && listItems.length === 0 && ( // הצג רק אם אין פריטים וסיימנו לטעון
             <div className="text-center text-gray-600">
                 אין כרגע פריטים ברשימת הצ'קליסט זו.
             </div>
        )}

        <div className="text-center">
          <button
            onClick={resetChecklist}
            className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-full"
          >
            איפוס הרשימה
          </button>
        </div>

       {/* חלק הוספת פריטים מהרשימה הכללית */}
       {/* הצג חלק זה רק אם יש פריטים ב-inventoryItems או אם עדיין טוען */}
       {(inventoryItems.length > 0 || loading) && (
            <div className="bg-white shadow-lg rounded-3xl p-6">
                <h2 className="text-lg font-semibold text-pink-500 mb-4">בחרי פריטים מהרשימה הכללית:</h2>
                {loading && userId ? ( // הצג טעינה רק אם יש userId ואנחנו באמת טוענים inventory
                    <p className="text-center text-gray-500">טוען ציוד כללי...</p>
                ) : (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleAddSelectedItems(selectedItems);
                        }}
                        className="space-y-6"
                    >
                        {/* מיון קטגוריות הציוד הכללי לפי סדר אלפביתי */}
                        {uniqueInventoryCategories.sort().map((category) => ( // מיון כאן
                            <div key={category}>
                                <h3 className="text-sm font-bold text-gray-600 mb-2">{category}</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {inventoryItems
                                        .filter((item) => item.category === category)
                                        .map((item) => (
                                            <label key={item.id} className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems.includes(item.id)}
                                                    onChange={() => toggleSelection(item.id)}
                                                />
                                                {item.name}
                                            </label>
                                        ))}
                                </div>
                            </div>
                        ))}

                        <button
                            type="submit"
                            className="w-full mt-4 py-2 bg-pink-500 text-white font-bold rounded-lg hover:bg-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={selectedItems.length === 0}
                        >
                            הוסיפי לרשימה ({selectedItems.length})
                        </button>
                    </form>
                )}
            </div>
       )}
        {/* הודעה אם אין פריטים ברשימה הכללית לאחר סיום הטעינה */}
        {inventoryItems.length === 0 && !loading && ( // הצג רק אם אין פריטים וסיימנו לטעון
             <div className="text-center text-gray-600">
                 אין כרגע פריטים ברשימת הציוד הכללית עבורך. אנא הוסיפי פריטים{' '}
                 <a href="/inventory" className="text-blue-600 underline">כאן</a>.
             </div>
        )}

      </div>
    </div>
  )
}
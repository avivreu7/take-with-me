// src/app/checklist/[id]/page.tsx
'use client' // זהו קובץ קומפוננטת לקוח

import { useEffect, useState } from 'react';
import Link from 'next/link'; // ייבוא Link
import { useParams, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import confetti from 'canvas-confetti';

type Item = {
  id: string;
  name: string;
  category: string;
  is_checked?: boolean;
  user_id: string;
  // family_id?: string
}

export default function ChecklistPage() { // חזרנו לשם המקורי של הקומפוננטה
  const { id } = useParams();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [listItems, setListItems] = useState<Item[]>([]);
  const [inventoryItems, setInventoryItems] = useState<Item[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [resetMessage, setResetMessage] = useState(false);
  const [allPacked, setAllPacked] = useState(false);
  const [loading, setLoading] = useState(true);

  const supabase = createClientComponentClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
          console.error("שגיאה בקבלת משתמש:", userError.message);
      }
      if (user) {
        setUserId(user.id);
      } else {
        setLoading(false);
      }
    };
    getUser();
  }, [supabase]);

  useEffect(() => {
    const fetchChecklist = async () => {
      if (!userId || !id) {
        if (!userId && !id) setLoading(false);
        return;
      }
      setLoading(true);
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
      // setLoading(false); // הטעינה תסתיים אחרי טעינת ה-inventory
    };
    if (userId && id) {
        fetchChecklist();
    }
  }, [id, userId, supabase]);

  useEffect(() => {
    const fetchInventory = async () => {
      if (!userId) {
        setInventoryItems([]);
        // setLoading(false); // נטפל באופן כללי
        return;
      }
      // setLoading(true); // אם לא נטען
      const { data, error } = await supabase
        .from('inventory')
        .select('id, name, category, user_id');
      if (error) {
        console.error('שגיאה בטעינת ציוד כללי:', error.message);
      } else {
        setInventoryItems(data || []);
      }
      setLoading(false); // סיום טעינה כוללת
    };

    if (userId) {
      fetchInventory();
    } else {
      if (!id) setLoading(false);
    }
  }, [userId, supabase, id]);

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
      list_id: id,
      is_checked: false,
      user_id: userId,
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

  const uniqueInventoryCategories = Array.from(
    new Set(inventoryItems.map((item) => item.category))
  );

  const uniqueChecklistCategories = Array.from(
    new Set(listItems.map((item) => item.category))
  );

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-xl text-gray-600">טוען רשימת ציוד...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 via-blue-100 to-indigo-100 p-4 text-right">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="bg-white shadow-xl rounded-3xl p-4 text-center relative">
          <button
            onClick={() => router.push('/home')}
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

        {(uniqueChecklistCategories.length > 0 || (listItems.length === 0 && loading)) && (
            <div className="space-y-6">
                {uniqueChecklistCategories.sort().map((category) => (
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
        {uniqueChecklistCategories.length === 0 && !loading && listItems.length === 0 && (
             <div className="text-center text-gray-600">
                 אין כרגע פריטים ברשימת הצ&apos;קליסט זו.
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

       <div>
            <div className="bg-white shadow-lg rounded-3xl p-6">
                <h2 className="text-lg font-semibold text-pink-500 mb-4">בחרי פריטים מהרשימה הכללית:</h2>
                {loading && !inventoryItems.length ? (
                    <p className="text-center text-gray-500">טוען ציוד כללי...</p>
                ) : inventoryItems.length > 0 ? (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleAddSelectedItems(selectedItems);
                        }}
                        className="space-y-6"
                    >
                        {uniqueInventoryCategories.sort().map((category) => (
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
                ) : !loading && inventoryItems.length === 0 && (
                    <div className="text-center text-gray-600">
                        אין כרגע פריטים ברשימת הציוד הכללית עבורך. אנא הוסיפי פריטים{' '}
                        <Link href="/inventory" className="text-blue-600 underline">כאן</Link>.
                    </div>
                )}
            </div>
       </div>
      </div>
    </div>
  );
}
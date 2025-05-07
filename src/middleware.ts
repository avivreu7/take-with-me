// src/middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  // השתמש בפונקציה המתאימה מ-@supabase/auth-helpers-nextjs עבור middleware
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // הרחבת רשימת הנתיבים הציבוריים
  const publicPaths = [
    '/',                        // עמוד ההתחברות / דף הבית הראשי
    '/reset-password',          // עמוד בקשת איפוס סיסמה
    '/register',                // עמוד הרשמה
    '/auth/callback',           // נקודת ה-callback של Supabase (קריטי לאיפוס סיסמה)
    '/reset-password/update',   // עמוד עדכון הסיסמה לאחר לחיצה על הקישור במייל
  ];

  const currentPath = req.nextUrl.pathname;
  const isPublicPath = publicPaths.includes(currentPath);

  // אם המשתמש מנסה לגשת לנתיב מוגן ללא session, הפנה אותו לדף ההתחברות
  if (!session && !isPublicPath) {
    console.log(`[Middleware] Path "${currentPath}" is protected and no session. Redirecting to /.`);
    return NextResponse.redirect(new URL('/', req.url));
  }

  // אם המשתמש מחובר (יש session) והוא נמצא בדף ההתחברות ('/'), הפנה אותו לדף הבית של משתמשים מחוברים
  const homePath = '/home'; // נתיב דף הבית למשתמשים מחוברים
  const isLoginPage = currentPath === '/';

  if (session && isLoginPage) {
    console.log(`[Middleware] User with session is on login page. Redirecting to ${homePath}.`);
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = homePath;
    return NextResponse.redirect(redirectUrl);
  }

  // אפשר להוסיף כאן לוג נוסף אם רוצים לעקוב אחרי כל הבקשות שעוברות
  // console.log(`[Middleware] Allowing request to "${currentPath}". Session: ${session ? 'Exists' : 'None'}`);
  return res;
}

export const config = {
  // ה-matcher נראה תקין ומכסה את רוב הנתיבים
  matcher: ['/((?!_next|favicon.ico|logo|images|fonts).*)'],
};
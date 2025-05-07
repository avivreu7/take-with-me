// src/app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server'; // שימוש ב-NextRequest כדי לקבל את ה-URL המלא

// הטיפוס CookieOptions עשוי להיות בעייתי.
// אם הוא לא קיים, נצטרך להשתמש בטיפוס כללי יותר או להשמיט אותו אם הפונקציה לא דורשת אותו במפורש.
// ב-createRouteHandlerClient, אובייקט ה-cookies מועבר ישירות.
// import type { CookieOptions } from '@supabase/auth-helpers-nextjs'; // נסיר את זה אם זה גורם לשגיאה

export async function GET(request: NextRequest) { // שימוש ב-NextRequest
  const requestUrl = new URL(request.url); // קבלת ה-URL מה-request
  const code = requestUrl.searchParams.get('code');

  console.log('[AUTH_CALLBACK] Handler reached. Full URL:', requestUrl.href);
  console.log('[AUTH_CALLBACK] URL Search Params:', requestUrl.searchParams.toString());

  if (code) {
    console.log('[AUTH_CALLBACK] Code found:', code);
    const cookieStore = cookies(); // קבלת אובייקט ה-cookies

    // בדיקה אם משתני הסביבה של Supabase קיימים
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[AUTH_CALLBACK] Critical Error: Supabase URL or Anon Key is missing from environment variables.');
      return NextResponse.redirect(`${requestUrl.origin}/?error_message=Supabase_configuration_missing_on_server&error_source=config_error`);
    }

    // שימוש ב-createRouteHandlerClient
    // הוא מקבל את אובייקט ה-cookies ישירות
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });


    console.log('[AUTH_CALLBACK] Supabase client initialized. Attempting to exchange code for session...');
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      console.log("[AUTH_CALLBACK] Code exchange successful! User ID:", data?.user?.id, "Session expires at:", data?.session?.expires_at);
      console.log("[AUTH_CALLBACK] Redirecting to password update page:", `${requestUrl.origin}/reset-password/update`);
      return NextResponse.redirect(`${requestUrl.origin}/reset-password/update`);
    } else {
      console.error("[AUTH_CALLBACK] Error exchanging code for session. Message:", error.message, "Full error object:", JSON.stringify(error, null, 2));
      return NextResponse.redirect(`${requestUrl.origin}/?error_message=${encodeURIComponent(error.message)}&error_source=exchange_code_failed`);
    }
  } else {
    console.warn("[AUTH_CALLBACK] No 'code' parameter found in callback URL.");
    return NextResponse.redirect(`${requestUrl.origin}/?error_message=No_auth_code_in_link&error_source=no_code_param`);
  }
}
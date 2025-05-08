/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // מאפשר התעלמות מבעיות ESLint בעת הבנייה ב–Vercel
    ignoreDuringBuilds: true
  },
  experimental: {
    // שומר על תמיכה ב־serverActions בצורה תקינה
    serverActions: true
  }
};

module.exports = nextConfig;

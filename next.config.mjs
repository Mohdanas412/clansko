/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            // Content-Security-Policy
            // - default-src 'self': block everything not explicitly listed
            // - script-src: allow Next.js inline scripts (nonce not available in static headers)
            // - style-src: allow Tailwind inline styles
            // - img-src: allow data URIs and any https image host (avatars, CDNs)
            // - connect-src: allow Supabase REST/Realtime and Groq API
            // - frame-ancestors 'none': belt-and-suspenders with X-Frame-Options DENY
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.groq.com`,
              "frame-src 'none'",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join('; ')
          }
        ]
      }
    ]
  }
};

export default nextConfig;

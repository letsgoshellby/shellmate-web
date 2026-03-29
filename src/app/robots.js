export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/login',
          '/signup/',
          '/client/dashboard',
          '/client/consultations',
          '/client/profile',
          '/expert/dashboard',
          '/expert/consultations',
          '/expert/profile',
          '/expert/qna',
          '/video-call/',
        ],
      },
    ],
    sitemap: 'https://shellmate.letsgoshellby.com/sitemap.xml',
  };
}

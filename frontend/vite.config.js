import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'node:fs'
import path from 'node:path'

// Pages publiques à référencer (les fiches films sont dynamiques et découvertes via les liens).
const PUBLIC_ROUTES = ['/', '/discover', '/cinemas', '/watchlist', '/ce-soir', '/confidentialite', '/cgu', '/mentions-legales']

/**
 * Fichiers de mise en ligne générés au build :
 * - sitemap.xml + robots.txt (référencement)
 * - _redirects : toutes les URL renvoient vers l'application, sinon /title/... donne une 404 Netlify
 * - _headers : HTTPS forcé (HSTS) et en-têtes de sécurité
 */
function launchFiles(env) {
  const siteUrl = (env.VITE_SITE_URL || '').replace(/\/$/, '')
  return {
    name: 'cineviseur-launch-files',
    apply: 'build',
    configResolved(config) {
      const api = env.VITE_API_URL || ''
      if (config.mode === 'production' && api.startsWith('http://')) {
        config.logger.warn(
          `\n[CineViseur] VITE_API_URL=${api} n'est pas en HTTPS : le site en ligne ne pourra pas l'appeler ` +
            `(contenu mixte bloqué) et les mots de passe passeraient en clair. Renseigne l'URL https de l'API dans .env.production.\n`
        )
      }
      if (!siteUrl) {
        config.logger.warn('[CineViseur] VITE_SITE_URL est vide : sitemap.xml non généré et liens de partage relatifs.')
      }
    },
    writeBundle(options) {
      const out = options.dir
      const today = new Date().toISOString().slice(0, 10)
      if (siteUrl) {
        const urls = PUBLIC_ROUTES.map(
          (route) => `  <url><loc>${siteUrl}${route}</loc><lastmod>${today}</lastmod></url>`
        ).join('\n')
        fs.writeFileSync(
          path.join(out, 'sitemap.xml'),
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
        )
      }
      const robots = ['User-agent: *', 'Disallow: /profile', 'Allow: /']
      if (siteUrl) robots.push(`Sitemap: ${siteUrl}/sitemap.xml`)
      fs.writeFileSync(path.join(out, 'robots.txt'), robots.join('\n') + '\n')
      fs.writeFileSync(
        path.join(out, '_redirects'),
        [
          '/api/tmdb/*    /.netlify/functions/api/tmdb/:splat             200',
          '/api/cinemas/* /.netlify/functions/api/cinemas/:splat          200',
          '/api/health    /.netlify/functions/api/health                  200',
          '/*             /index.html                                     200',
          '',
        ].join('\n')
      )
      fs.writeFileSync(
        path.join(out, '_headers'),
        [
          '/*',
          '  Strict-Transport-Security: max-age=31536000; includeSubDomains',
          '  X-Content-Type-Options: nosniff',
          '  Referrer-Policy: strict-origin-when-cross-origin',
          '  Permissions-Policy: geolocation=(self), camera=(), microphone=()',
          '  X-Frame-Options: DENY',
          "  Content-Security-Policy: frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
          '',
          '/assets/*',
          '  Cache-Control: public, max-age=31536000, immutable',
          '',
          '/sw.js',
          '  Cache-Control: no-cache, no-store, must-revalidate',
          '',
          '/registerSW.js',
          '  Cache-Control: no-cache, no-store, must-revalidate',
          '',
          '/index.html',
          '  Cache-Control: no-cache, no-store, must-revalidate',
          '',
        ].join('\n')
      )
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      react(),
      // Service worker : sans lui, les navigateurs ne proposent pas « Installer ».
      // Mode prompt : alerte l'utilisateur dès qu'un patch/mise à jour est disponible
      // sans l'obliger à vider son cache ou perdre ses données locales.
      VitePWA({
        registerType: 'autoUpdate',
        manifest: false,
        devOptions: {
          enabled: false,
        },
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          cleanupOutdatedCaches: true,
          globPatterns: ['**/*.{js,css,html,svg,png,jpg,woff2}'],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
        },
      }),
      launchFiles(env),
    ],
  }
})

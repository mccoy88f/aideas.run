import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  base: '/', // Percorso root per dominio personalizzato aideas.run
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    target: 'es2020',
    minify: 'esbuild',
    cssCodeSplit: true,
    
    rollupOptions: {
      input: {
        main: './index.html'
      },
      output: {
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash].${ext}`;
          }
          if (/css/i.test(ext)) {
            return `css/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        },
        manualChunks: {
          vendor: ['dexie', 'jszip', 'fuse.js', 'date-fns', 'lodash-es', 'dompurify'],
        }
      }
    },
    
    // Ottimizzazioni build
    cssMinify: true,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000
  },
  
  // Development server
  server: {
    port: 3001,
    open: false,
    cors: true,
    strictPort: false,
    hmr: {
      overlay: false // Disabilita overlay errori per ora
    }
  },
  
  // Preview server (for production build testing)
  preview: {
    port: 4173,
    cors: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin'
    }
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@services': '/src/services',
      '@utils': '/src/utils',
      '@styles': '/src/styles',
      '@assets': '/public/assets'
    },
    dedupe: ['dexie']
  },
  
  // CSS configuration
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },
  
  // Optimizations
  optimizeDeps: {
    include: [
      'dexie',
      'dexie/dist/dexie.js',
      'jszip',
      'fuse.js',
      'date-fns',
      'lodash-es',
      'dompurify'
    ],
    exclude: []
  },
  
  // Define global variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
    global: 'globalThis'
  },
  
  // Plugins
  plugins: [
    // PWA Plugin - RIATTIVATO
    VitePWA({
      devOptions: {
        enabled: true,  // Abilita SW in sviluppo
        type: 'module'
      },
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.github\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'github-api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 24 ore
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-apis-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 giorni
              }
            }
          }
        ]
      },
      manifest: {
        name: 'AIdeas - Run your AIdeas',
        short_name: 'AIdeas',
        description: 'Launcher per applicazioni web generate da AI',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'it',
        dir: 'ltr',
        categories: ['productivity', 'utilities', 'developer'],
        icons: [
          {
            src: 'assets/icons/icon-72x72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: 'assets/icons/icon-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: 'assets/icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: 'assets/icons/icon-144x144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: 'assets/icons/icon-152x152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: 'assets/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: 'assets/icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'maskable any'
          },
          {
            src: 'assets/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable any'
          }
        ],
        shortcuts: [
          {
            name: 'Aggiungi App',
            short_name: 'Aggiungi',
            description: 'Aggiungi una nuova applicazione',
            url: '/?action=add',
            icons: [
              {
                src: 'assets/icons/icon-96x96.png',
                sizes: '96x96'
              }
            ]
          },
          {
            name: 'Impostazioni',
            short_name: 'Settings',
            description: 'Accedi alle impostazioni',
            url: '/?action=settings',
            icons: [
              {
                src: 'assets/icons/icon-96x96.png',
                sizes: '96x96'
              }
            ]
          }
        ]
      }
    })
  ]
});
/**
 * Generates an image data URL with specific square dimensions and optional safe-padding.
 */
export function generateSizedIcon(imgSrc: string, size: number, safePadding = 0): Promise<string> {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') {
      resolve(imgSrc);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imgSrc);
          return;
        }

        ctx.clearRect(0, 0, size, size);

        const targetSize = Math.max(16, size - safePadding * 2);
        const imgW = img.width || size;
        const imgH = img.height || size;
        const scale = Math.min(targetSize / imgW, targetSize / imgH);
        const w = Math.round(imgW * scale);
        const h = Math.round(imgH * scale);
        const x = Math.round((size - w) / 2);
        const y = Math.round((size - h) / 2);

        ctx.drawImage(img, x, y, w, h);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(imgSrc);
      }
    };
    img.onerror = () => resolve(imgSrc);
    img.src = imgSrc;
  });
}

/**
 * Updates the document favicon, apple-touch-icon, and PWA manifest dynamically
 * so that any uploaded logo becomes the application icon for both browser tabs
 * and installed PWA on phones & desktops.
 */
export async function updateAppFavicon(logoUrl?: string, institutionName?: string) {
  if (typeof document === 'undefined') return;

  const url = logoUrl && logoUrl.trim().length > 0 ? logoUrl : '/favicon.png';
  const appTitle = institutionName && institutionName.trim().length > 0 
    ? `E-SanguSantri - ${institutionName.trim()}`
    : 'E-SanguSantri';

  // 1. Remove obsolete or static icon links
  const iconSelectors = [
    "link[rel='icon']",
    "link[rel='shortcut icon']",
    "link[rel='apple-touch-icon']",
    "link[rel='apple-touch-icon-precomposed']",
    "#dynamic-favicon-svg",
    "#dynamic-favicon-png",
    "#dynamic-apple-icon"
  ];

  iconSelectors.forEach(selector => {
    const existing = document.querySelectorAll(selector);
    existing.forEach(el => el.remove());
  });

  // 2. Create primary PNG favicon (32x32 / standard)
  const linkPng = document.createElement('link');
  linkPng.id = 'dynamic-favicon-png';
  linkPng.rel = 'icon';
  linkPng.type = 'image/png';
  linkPng.href = url;
  document.head.appendChild(linkPng);

  // 3. Create shortcut icon for older browsers
  const linkShortcut = document.createElement('link');
  linkShortcut.rel = 'shortcut icon';
  linkShortcut.type = 'image/png';
  linkShortcut.href = url;
  document.head.appendChild(linkShortcut);

  // 4. Create Apple Touch Icon for iOS Safari & homescreen add
  const linkApple = document.createElement('link');
  linkApple.id = 'dynamic-apple-icon';
  linkApple.rel = 'apple-touch-icon';
  linkApple.href = url;
  document.head.appendChild(linkApple);

  const linkApplePrecomposed = document.createElement('link');
  linkApplePrecomposed.rel = 'apple-touch-icon-precomposed';
  linkApplePrecomposed.href = url;
  document.head.appendChild(linkApplePrecomposed);

  // 5. Update meta tags
  const setMetaContent = (nameOrProp: string, value: string, isProp = false) => {
    const selector = isProp ? `meta[property='${nameOrProp}']` : `meta[name='${nameOrProp}']`;
    let meta = document.querySelector<HTMLMetaElement>(selector);
    if (!meta) {
      meta = document.createElement('meta');
      if (isProp) meta.setAttribute('property', nameOrProp);
      else meta.setAttribute('name', nameOrProp);
      document.head.appendChild(meta);
    }
    meta.content = value;
  };

  setMetaContent('apple-mobile-web-app-title', 'E-SanguSantri');
  setMetaContent('application-name', 'E-SanguSantri');
  setMetaContent('msapplication-TileImage', url);
  setMetaContent('og:image', url, true);

  // 6. Generate sized icons for PWA and dynamically update Web App Manifest
  try {
    const [icon192, icon512, maskable512] = await Promise.all([
      generateSizedIcon(url, 192, 0),
      generateSizedIcon(url, 512, 0),
      generateSizedIcon(url, 512, 48) // safe padding for Android adaptive squircle/round icons
    ]);

    // 6. Ensure canonical HTTPS /manifest.webmanifest is maintained for Google WebAPK minting
    let manifestLink = document.querySelector<HTMLLinkElement>("link[rel='manifest']");
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    // Must remain a real URL (/manifest.webmanifest), NOT a blob: URL,
    // so Google's WebAPK minting server can download and generate an independent Android WebAPK.
    manifestLink.href = '/manifest.webmanifest';

    // 7. Synchronize to Browser CacheStorage (Workbox & PWA caches) so background install fetch gets custom icon
    if ('caches' in window) {
      try {
        const [blob192, blob512, blobMaskable] = await Promise.all([
          fetch(icon192).then(r => r.blob()),
          fetch(icon512).then(r => r.blob()),
          fetch(maskable512).then(r => r.blob())
        ]);

        const dynamicManifest = {
          id: '/',
          name: appTitle,
          short_name: 'E-SanguSantri',
          description: 'Aplikasi Manajemen Tabungan Santri & Penitipan Uang Saku Pesantren.',
          theme_color: '#047857',
          background_color: '#047857',
          display: 'standalone',
          display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          prefer_related_applications: false,
          categories: ['finance', 'education', 'productivity'],
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        };

        const manifestBlob = new Blob([JSON.stringify(dynamicManifest, null, 2)], {
          type: 'application/manifest+json'
        });

        const cacheNames = await caches.keys();
        const targets = cacheNames.length > 0 ? cacheNames : ['pwa-custom-icons-v1'];

        for (const name of targets) {
          const cache = await caches.open(name);
          await Promise.all([
            cache.put('/pwa-192x192.png', new Response(blob192, { headers: { 'Content-Type': 'image/png' } })),
            cache.put('/pwa-512x512.png', new Response(blob512, { headers: { 'Content-Type': 'image/png' } })),
            cache.put('/pwa-maskable-512x512.png', new Response(blobMaskable, { headers: { 'Content-Type': 'image/png' } })),
            cache.put('/apple-touch-icon.png', new Response(blob192, { headers: { 'Content-Type': 'image/png' } })),
            cache.put('/favicon.png', new Response(blob192, { headers: { 'Content-Type': 'image/png' } })),
            cache.put('/manifest.webmanifest', new Response(manifestBlob, { headers: { 'Content-Type': 'application/manifest+json' } }))
          ]).catch(() => {});
        }
      } catch (cacheErr) {
        // Non-fatal cache write
        console.debug('Cache storage sync notice:', cacheErr);
      }
    }

    // 8. Synchronize to Backend Server so Google WebAPK Minting Service receives the real uploaded logo
    if (logoUrl && logoUrl.trim().length > 0) {
      try {
        fetch('/api/update-pwa-icon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logoUrl: url,
            institutionName: institutionName || 'Pondok Pesantren'
          })
        }).catch(err => {
          console.debug('Backend PWA icon sync notice:', err);
        });
      } catch (postErr) {
        console.debug('Failed to trigger backend PWA icon sync:', postErr);
      }
    }
  } catch (err) {
    console.warn('Dynamic PWA manifest update notice:', err);
  }
}

/**
 * Process a logo/icon image in PNG format:
 * - Accepts any PNG (with or without transparency) as-is.
 * - Does NOT add any artificial background.
 * - Does NOT automatically strip or clear white pixels (preserves original artwork).
 * - Scales down smoothly to max 512x512 if too large for lightweight storage.
 */
export function processLogoImage(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  let width = img.width || 512;
  let height = img.height || 512;
  const MAX_WIDTH = 512;
  const MAX_HEIGHT = 512;

  if (width > height) {
    if (width > MAX_WIDTH) {
      height = Math.round(height * (MAX_WIDTH / width));
      width = MAX_WIDTH;
    }
  } else {
    if (height > MAX_HEIGHT) {
      width = Math.round(width * (MAX_HEIGHT / height));
      height = MAX_HEIGHT;
    }
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Clear canvas so no background color is added; transparent stays transparent
  ctx.clearRect(0, 0, width, height);

  // Draw image faithfully as-is without pixel alteration or white background removal
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL('image/png');
}

/**
 * Backward compatibility alias for processLogoImage.
 * Preserves original PNG pixels as requested (never removes white background).
 */
export function processTransparentLogo(img: HTMLImageElement, _removeWhiteBg = false): string {
  return processLogoImage(img);
}

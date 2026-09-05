/**
 * Updates the document favicon and apple-touch-icon dynamically with a custom logo.
 */
export function updateAppFavicon(logoUrl?: string) {
  if (typeof document === 'undefined') return;

  const url = logoUrl && logoUrl.trim().length > 0 ? logoUrl : '/favicon.png';

  // Update or create icon links
  const iconSelectors = [
    "link[rel='icon']",
    "link[rel='shortcut icon']",
    "link[rel='apple-touch-icon']",
    "#dynamic-favicon-svg",
    "#dynamic-favicon-png",
    "#dynamic-apple-icon"
  ];

  iconSelectors.forEach(selector => {
    const existing = document.querySelectorAll(selector);
    existing.forEach(el => el.remove());
  });

  // Create primary PNG favicon
  const linkPng = document.createElement('link');
  linkPng.id = 'dynamic-favicon-png';
  linkPng.rel = 'icon';
  linkPng.type = 'image/png';
  linkPng.href = url;
  document.head.appendChild(linkPng);

  // Create shortcut icon
  const linkShortcut = document.createElement('link');
  linkShortcut.rel = 'shortcut icon';
  linkShortcut.type = 'image/png';
  linkShortcut.href = url;
  document.head.appendChild(linkShortcut);

  // Create Apple Touch Icon
  const linkApple = document.createElement('link');
  linkApple.id = 'dynamic-apple-icon';
  linkApple.rel = 'apple-touch-icon';
  linkApple.href = url;
  document.head.appendChild(linkApple);
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

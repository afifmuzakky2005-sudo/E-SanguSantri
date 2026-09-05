/**
 * Updates the document favicon and apple-touch-icon dynamically with a custom transparent logo.
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

  // Create primary PNG favicon (transparent)
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
 * Process an image to ensure a 100% transparent background (no white box) and PNG encoding.
 */
export function processTransparentLogo(img: HTMLImageElement, removeWhiteBg = true): string {
  const canvas = document.createElement('canvas');
  let width = img.width;
  let height = img.height;
  const MAX_WIDTH = 400;
  const MAX_HEIGHT = 400;

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
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return '';

  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  if (removeWhiteBg) {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // Convert pure white or near-white background to transparent
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const alpha = data[i + 3];

      if (alpha === 0) continue;

      // If pixel is near-white (background)
      if (r >= 238 && g >= 238 && b >= 238) {
        data[i + 3] = 0; // Make 100% transparent
      } else if (r >= 215 && g >= 215 && b >= 215) {
        // Smooth anti-aliased edge
        const factor = (255 - (r + g + b) / 3) / 40;
        data[i + 3] = Math.round(alpha * Math.max(0, Math.min(1, factor)));
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  return canvas.toDataURL('image/png');
}

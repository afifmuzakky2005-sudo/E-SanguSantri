import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import sharp from 'sharp';

const app = express();
const PORT = 3000;

// Enable JSON body parser with 30MB limit for high-res logo uploads
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// In-memory cache for dynamic icons and manifest
let customIcon192: Buffer | null = null;
let customIcon512: Buffer | null = null;
let customIconMaskable: Buffer | null = null;
let customAppleIcon: Buffer | null = null;
let customFavicon: Buffer | null = null;
let currentManifest: any = null;

// Helper to ensure directory exists
function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Helper to build Web App Manifest
function generateManifestObject(instName?: string) {
  const cleanName = instName && instName.trim().length > 0 ? instName.trim() : 'Pondok Pesantren';
  return {
    id: '/',
    name: `E-SanguSantri - ${cleanName}`,
    short_name: 'E-SanguSantri',
    description: 'Aplikasi Manajemen Tabungan Santri & Penitipan Uang Saku Pesantren.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
    background_color: '#047857',
    theme_color: '#047857',
    lang: 'id',
    orientation: 'portrait',
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
}

// Try to load any existing icons or manifest from disk on server startup
try {
  const publicDir = path.join(process.cwd(), 'public');
  if (fs.existsSync(path.join(publicDir, 'manifest.webmanifest'))) {
    currentManifest = JSON.parse(fs.readFileSync(path.join(publicDir, 'manifest.webmanifest'), 'utf-8'));
  } else {
    currentManifest = generateManifestObject();
  }

  if (fs.existsSync(path.join(publicDir, 'pwa-192x192.png'))) {
    customIcon192 = fs.readFileSync(path.join(publicDir, 'pwa-192x192.png'));
  }
  if (fs.existsSync(path.join(publicDir, 'pwa-512x512.png'))) {
    customIcon512 = fs.readFileSync(path.join(publicDir, 'pwa-512x512.png'));
  }
  if (fs.existsSync(path.join(publicDir, 'pwa-maskable-512x512.png'))) {
    customIconMaskable = fs.readFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'));
  }
  if (fs.existsSync(path.join(publicDir, 'apple-touch-icon.png'))) {
    customAppleIcon = fs.readFileSync(path.join(publicDir, 'apple-touch-icon.png'));
  }
  if (fs.existsSync(path.join(publicDir, 'favicon.png'))) {
    customFavicon = fs.readFileSync(path.join(publicDir, 'favicon.png'));
  }
} catch (e) {
  console.debug('Initial icon load notice:', e);
}

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasCustomIcons: !!customIcon192 });
});

// Route for default logo
app.get('/default-logo.png', (req, res, next) => {
  const defaultPath = path.join(process.cwd(), 'public', 'default-logo.png');
  if (fs.existsSync(defaultPath)) {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.sendFile(defaultPath);
    return;
  }
  next();
});

// API: Update PWA Icon and Web App Manifest
// This converts the uploaded logo into compliant WebAPK icons and updates the server files
app.post('/api/update-pwa-icon', async (req, res) => {
  try {
    const { logoUrl, institutionName } = req.body;
    if (!logoUrl || typeof logoUrl !== 'string') {
      res.status(400).json({ success: false, message: 'logoUrl is required' });
      return;
    }

    // Extract base64 image data or file buffer
    let imageBuffer: Buffer;
    if (logoUrl.startsWith('data:image/')) {
      const base64Data = logoUrl.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
      const response = await fetch(logoUrl);
      const arrayBuffer = await response.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else if (logoUrl.startsWith('/')) {
      const filePath = path.join(process.cwd(), 'public', logoUrl.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        imageBuffer = fs.readFileSync(filePath);
      } else {
        imageBuffer = fs.readFileSync(path.join(process.cwd(), 'public', 'default-logo.png'));
      }
    } else {
      try {
        imageBuffer = Buffer.from(logoUrl, 'base64');
      } catch {
        imageBuffer = fs.readFileSync(path.join(process.cwd(), 'public', 'default-logo.png'));
      }
    }

    // 1. Generate 192x192 standard icon (purpose: 'any')
    const icon192 = await sharp(imageBuffer)
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 4, g: 120, b: 87, alpha: 0 } // Transparent background
      })
      .png()
      .toBuffer();

    // 2. Generate 512x512 standard icon (purpose: 'any')
    const icon512 = await sharp(imageBuffer)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 4, g: 120, b: 87, alpha: 0 }
      })
      .png()
      .toBuffer();

    // 3. Generate 512x512 maskable icon (purpose: 'maskable')
    // Safe zone is inner 80% circle (radius 40% = 368px) to prevent Android adaptive icon cropping
    const innerMaskable = await sharp(imageBuffer)
      .resize(360, 360, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();

    const iconMaskable = await sharp({
      create: {
        width: 512,
        height: 512,
        channels: 4,
        background: { r: 4, g: 120, b: 87, alpha: 1 } // Theme color emerald #047857
      }
    })
      .composite([{ input: innerMaskable, gravity: 'center' }])
      .png()
      .toBuffer();

    // 4. Generate Apple Touch Icon (180x180) and Favicon (32x32)
    const iconApple = await sharp(imageBuffer)
      .resize(180, 180, {
        fit: 'contain',
        background: { r: 4, g: 120, b: 87, alpha: 1 }
      })
      .png()
      .toBuffer();

    const iconFavicon = await sharp(imageBuffer)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();

    // Update in-memory buffers
    customIcon192 = icon192;
    customIcon512 = icon512;
    customIconMaskable = iconMaskable;
    customAppleIcon = iconApple;
    customFavicon = iconFavicon;

    // Generate updated manifest
    currentManifest = generateManifestObject(institutionName);

    // Persist to filesystem in both public/ and dist/ (if exists)
    const publicDir = path.join(process.cwd(), 'public');
    const distDir = path.join(process.cwd(), 'dist');

    ensureDir(publicDir);
    fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), icon192);
    fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), icon512);
    fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), iconMaskable);
    fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), iconApple);
    fs.writeFileSync(path.join(publicDir, 'favicon.png'), iconFavicon);
    fs.writeFileSync(path.join(publicDir, 'manifest.webmanifest'), JSON.stringify(currentManifest, null, 2));

    if (fs.existsSync(distDir)) {
      try {
        fs.writeFileSync(path.join(distDir, 'pwa-192x192.png'), icon192);
        fs.writeFileSync(path.join(distDir, 'pwa-512x512.png'), icon512);
        fs.writeFileSync(path.join(distDir, 'pwa-maskable-512x512.png'), iconMaskable);
        fs.writeFileSync(path.join(distDir, 'apple-touch-icon.png'), iconApple);
        fs.writeFileSync(path.join(distDir, 'favicon.png'), iconFavicon);
        fs.writeFileSync(path.join(distDir, 'manifest.webmanifest'), JSON.stringify(currentManifest, null, 2));
      } catch (distErr) {
        console.debug('dist write notice:', distErr);
      }
    }

    res.json({
      success: true,
      message: 'PWA WebAPK icons and manifest successfully updated with uploaded logo',
      manifest: currentManifest
    });
  } catch (error: any) {
    console.error('Error updating PWA icon:', error);
    res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

// Serve the canonical Web App Manifest with fresh headers
app.get(['/manifest.webmanifest', '/manifest.json'], (req, res) => {
  if (!currentManifest) {
    currentManifest = generateManifestObject();
  }
  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.send(JSON.stringify(currentManifest, null, 2));
});

// Explicit routes for PWA WebAPK icons to always deliver the latest uploaded logo
app.get('/pwa-192x192.png', (req, res, next) => {
  if (customIcon192) {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(customIcon192);
    return;
  }
  next();
});

app.get('/pwa-512x512.png', (req, res, next) => {
  if (customIcon512) {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(customIcon512);
    return;
  }
  next();
});

app.get('/pwa-maskable-512x512.png', (req, res, next) => {
  if (customIconMaskable) {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(customIconMaskable);
    return;
  }
  next();
});

app.get('/apple-touch-icon.png', (req, res, next) => {
  if (customAppleIcon) {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(customAppleIcon);
    return;
  }
  next();
});

app.get('/favicon.png', (req, res, next) => {
  if (customFavicon) {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(customFavicon);
    return;
  }
  next();
});

// Vite middleware setup (development vs production)
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} with WebAPK dynamic icon support`);
  });
}

startServer();

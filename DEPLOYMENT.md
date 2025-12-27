# AURA Neural System - Production Deployment Guide

## 📦 Building for Production

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Application
```bash
npm run build
```

This will create an optimized production build in the `dist/` folder.

## 🚀 Deployment Options

### Option 1: Netlify (Recommended - Easiest)

#### Quick Deploy:
1. **Install Netlify CLI** (if not already):
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

4. **Configure Environment Variables** in Netlify Dashboard:
   - Go to Site Settings → Build & Deploy → Environment
   - Add these variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`
     - `VITE_GEMINI_API_KEY`
     - `VITE_DEEPSEEK_API_KEY`
     - `VITE_OPENROUTER_API_KEY_1`
     - `VITE_OPENROUTER_API_KEY_2`
     - `VITE_GUEST_MODE` (set to `false` for production)

#### Auto-Deploy from Git:
1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Add environment variables as shown above
7. Deploy!

---

### Option 2: Vercel

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

3. **Add Environment Variables via CLI or Dashboard**

---

### Option 3: GitHub Pages

1. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add to package.json**:
   ```json
   {
     "scripts": {
       "deploy": "npm run build && gh-pages -d dist"
     },
     "homepage": "https://yourusername.github.io/repository-name"
   }
   ```

3. **Deploy**:
   ```bash
   npm run deploy
   ```

---

### Option 4: Self-Hosted (VPS/Server)

1. **Build the app**:
   ```bash
   npm run build
   ```

2. **Upload `dist/` folder** to your server

3. **Configure Nginx** (example):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       root /var/www/aura/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

4. **Or use Apache** with `.htaccess`:
   ```apache
   <IfModule mod_rewrite.c>
       RewriteEngine On
       RewriteBase /
       RewriteRule ^index\.html$ - [L]
       RewriteCond %{REQUEST_FILENAME} !-f
       RewriteCond %{REQUEST_FILENAME} !-d
       RewriteRule . /index.html [L]
   </IfModule>
   ```

---

## 🔒 Security Checklist

Before deploying to production:

- [ ] **Disable Guest Mode**: Set `VITE_GUEST_MODE=false` in production
- [ ] **Secure API Keys**: All API keys should be in environment variables, NEVER in code
- [ ] **Enable HTTPS**: Ensure SSL/TLS is configured
- [ ] **Configure CORS**: Update Supabase CORS settings if needed
- [ ] **Test Authentication**: Verify Supabase auth works properly
- [ ] **Test Cloud Sync**: Create/delete todos to verify sync
- [ ] **Test Voice Mode**: Ensure Gemini API works
- [ ] **Check Console**: No errors in browser console

---

## 📊 Performance Optimization

The build is already optimized with:
- ✅ Code splitting
- ✅ Asset compression
- ✅ Tree shaking
- ✅ Minification

For additional optimizations:
1. Enable CDN on Netlify/Vercel (automatic)
2. Use service worker for offline support (already included in `sw.js`)
3. Monitor bundle size with:
   ```bash
   npm run build -- --report
   ```

---

## 🧪 Testing Production Build Locally

```bash
# Build
npm run build

# Preview the production build
npm run preview
```

The preview will run on `http://localhost:4173` by default.

---

## 📱 PWA Installation

Your app is already configured as a Progressive Web App (PWA):
- Users can install it on mobile/desktop
- Manifest file is at `/manifest.json`
- Service worker is at `/sw.js`
- Works offline (after first load)

---

## 🔄 Continuous Deployment

For automatic deployments on every git push:

### Netlify:
- Connected to GitHub → Auto-deploys on push to main branch

### Vercel:
- Connected to GitHub → Auto-deploys on push

### GitHub Actions:
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## 📞 Support

If deployment issues occur:
1. Check build logs for errors
2. Verify all environment variables are set
3. Test with `npm run preview` first
4. Check browser console for runtime errors

---

## 🎯 Quick Deploy Commands

```bash
# For Netlify
netlify deploy --prod

# For Vercel
vercel --prod

# For GitHub Pages
npm run deploy

#For local testing
npm run build && npm run preview
```

Good luck with your deployment! 🚀

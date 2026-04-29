# Image Haven

Modern image gallery & management platform built with React, Supabase, and Vite.

## ✨ Features

- 📸 Upload and store images in Supabase Storage
- 🖼️ Responsive gallery grid with lightbox
- 🌙 Dark/light theme switching
- 🔍 Image search and filtering
- 📱 Mobile-first design
- ⚡ Fast Vite builds

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Routing:** TanStack Router (v1)
- **UI:** Radix UI + Tailwind CSS v4
- **Backend:** Supabase (PostgreSQL + Storage)
- **Hosting:** GitHub Pages (static) + Supabase (backend)
- **Optional:** Cloudflare Workers (for image optimization)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📦 Project Structure

```
image-haven/
├── src/
│   ├── components/    # Reusable UI components
│   │   ├── gallery-grid.tsx
│   │   ├── lightbox.tsx
│   │   ├── site-header.tsx
│   │   └── theme-provider.tsx
│   ├── routes/        # Page routes (TanStack Router)
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utilities (Supabase client)
│   ├── integrations/  # External integrations
│   ├── supabase/      # Supabase migrations/functions
│   └── types/         # TypeScript types
├── supabase/          # Supabase config & migrations
├── .env.example       # Environment variables template
├── vercel.json        # Vercel configuration (headers, redirects) — optional for GitHub Pages
├── wrangler.jsonc     # Cloudflare Workers config (optional)
└── package.json
```

## 🔐 Environment Variables

### **For Local Development:**
Copy `.env.example` to `.env` and fill in:

```env
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PROJECT_ID=your-project-id
```

### **For GitHub Pages (CI/CD):**
Add these as **GitHub Secrets** (Repo → Settings → Secrets and variables → Actions):

| Secret Name | Value | Where to get it |
|-------------|-------|-----------------|
| `SUPABASE_PUBLISHABLE_KEY` | Your Supabase publishable key | Supabase Dashboard → Settings → API |
| `SUPABASE_URL` | Supabase project URL | Same page |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID | Same page |

> **Note:** These are **public keys** (not secret). But keeping them in Secrets prevents exposing them in build logs.

## ☁️ Deployment

### **GitHub Pages (Primary)**

The project is configured for automatic deployment to GitHub Pages via GitHub Actions.

**How it works:**
1. Push to `main` branch
2. GitHub Actions builds the project
3. Deploys to `gh-pages` branch automatically
4. Site live at: `https://alihaidershakermax.github.io/image-haven`

**Manual trigger:**
- Go to **Actions** tab in GitHub
- Select "Deploy to GitHub Pages" workflow
- Click **"Run workflow"**

### **Build Settings (GitHub Pages)**

- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm ci`

**Important:** The `homepage` field in `package.json` is set to:
```
"homepage": "https://alihaidershakermax.github.io/image-haven"
```

### **Custom Domain (Optional)**

If you have a custom domain (e.g., `images.yourdomain.com`):
1. Go to Repository Settings → Pages
2. Under "Custom domain", enter your domain
3. Update `homepage` in `package.json` to match
4. Redeploy

### **Vercel (Alternative)**

If you prefer Vercel, import the repo and set environment variables there. See `vercel.json` for security headers config.

## 🛡️ Security

- ✅ **Security Headers** (via `vercel.json` for Vercel; for GitHub Pages, configure in `vite.config.ts` or use Cloudflare):
  - `X-Frame-Options: DENY`
  - `Content-Security-Policy: default-src 'self'`
  - `X-Content-Type-Options: nosniff`
  - `Strict-Transport-Security: max-age=31536000`
  - `Referrer-Policy: strict-origin-when-cross-origin`

- 🔒 **Supabase RLS** (Row Level Security) — enable on all tables
- 🚫 **No secret keys** committed to repository
- 🔐 **Environment variables** stored in GitHub Secrets (not in code)

## 📝 Supabase Setup

1. Create a new Supabase project
2. Run SQL migrations from `supabase/migrations/`
3. Configure Storage buckets for images
4. Set up RLS policies (see Supabase docs)
5. Get your API keys (publishable + URL) and add to GitHub Secrets

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit (`git commit -m 'feat: add amazing feature'`)
4. Push (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT — feel free to use commercially.

## 👤 Author

Ali al-Akbar Haidar
- Portfolio: https://alialakbarhaidarshaker.vercel.app
- GitHub: @alihaidershakermax

---

**Built with ❤️ using modern web stack. Deployed automatically to GitHub Pages.**

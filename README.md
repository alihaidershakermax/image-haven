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
- **Cloud:** Vercel hosting
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
├── vercel.json        # Vercel configuration (headers, redirects)
├── wrangler.jsonc     # Cloudflare Workers config (optional)
└── package.json
```

## 🔐 Environment Variables

Create a `.env` file in the root:

```env
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PROJECT_ID=your-project-id
```

> **Note:** These are public keys. For secrets (service role), use Vercel environment variables only.

## ☁️ Deployment

### Vercel (Recommended)

1. Import project from GitHub: https://vercel.com/new
2. Select `alihaidershakermax/image-haven`
3. Configure environment variables (see above)
4. Deploy

**Auto-deploy via GitHub Actions:** Push to `main` triggers automatic deployment.

### Build Settings (Vercel)

- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm ci`

## 🛡️ Security

- ✅ **Security Headers** configured in `vercel.json`:
  - `X-Frame-Options: DENY`
  - `Content-Security-Policy: default-src 'self'`
  - `X-Content-Type-Options: nosniff`
  - `Strict-Transport-Security: max-age=31536000`
  - `Referrer-Policy: strict-origin-when-cross-origin`

- 🔒 **Supabase RLS** (Row Level Security) enabled on all tables
- 🚫 **No secret keys** committed to repository

## 📝 Supabase Setup

1. Create a new Supabase project
2. Run SQL migrations from `supabase/migrations/`
3. Configure Storage buckets for images
4. Set up RLS policies (see Supabase docs)

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT — feel free to use commercially.

## 👤 Author

Ali al-Akbar Haidar
- Portfolio: https://alialakbarhaidarshaker.vercel.app
- GitHub: @alihaidershakermax

---

**Built with ❤️ using modern web stack.**

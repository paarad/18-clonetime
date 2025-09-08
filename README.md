# 🔨 Clonetime

**How long to rebuild this from scratch?**

Clonetime is a tool for developers, indie hackers, and product builders. Paste any product website — it crawls the site, understands what the product does, and tells you how long it would take to clone it.

No scale. No enterprise-grade infra. Just the minimum lovable version — estimated in vibe-hours.

## ✨ Features

- **URL Analysis**: Paste any product website URL
- **Smart Crawling**: Automatically crawls key pages (features, pricing, docs, etc.)
- **AI-Powered Analysis**: Uses OpenAI GPT-4 to understand product features
- **Build Time Estimation**: Estimates for Speedrun, MVP, and Prod-lite tiers
- **Deduplication**: Smart caching prevents duplicate analyses
- **Public Precedents**: Browse past analyses of popular products
- **Beautiful UI**: Built with Next.js, Tailwind, and shadcn/ui

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- OpenAI API key

### 1. Clone & Install

```bash
git clone https://github.com/paarad/18-clonetime.git
cd 18-clonetime
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env.local` and fill in your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

Create the `analyses` table in your Supabase database:

```sql
create table analyses (
  id uuid default gen_random_uuid() primary key,
  created_by uuid references auth.users(id),
  url text not null,
  url_canonical text not null,
  tier text not null check (tier in ('speedrun', 'mvp', 'prod-lite')),
  fingerprint text not null unique,
  result jsonb not null,
  is_public boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for fast lookups
create index analyses_fingerprint_idx on analyses (fingerprint);
create index analyses_public_created_idx on analyses (is_public, created_at desc);

-- Enable RLS (Row Level Security)
alter table analyses enable row level security;

-- Policy: Public analyses are readable by everyone
create policy "Public analyses are readable" on analyses
  for select using (is_public = true);

-- Policy: Users can create their own analyses
create policy "Users can create analyses" on analyses
  for insert with check (true);
```

### 4. Install Playwright

```bash
npx playwright install chromium
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start analyzing products!

## 🏗️ How It Works

1. **URL Input**: User pastes a product URL and selects complexity tier
2. **Web Crawling**: Playwright/fetch crawls the main page + key subpages
3. **AI Analysis**: OpenAI GPT-4 analyzes content to extract:
   - User roles and data objects
   - Core features and user stories
   - Development missions with time estimates
4. **Deduplication**: Uses SHA256 fingerprint of (canonical_url + tier)
5. **Storage**: Results stored in Supabase with public visibility
6. **Display**: Beautiful analysis breakdown with missions, evidence, and scope

## 🎯 Analysis Tiers

- **🚀 Speedrun**: Vibe-code prototype (1x multiplier)
- **🎯 MVP**: Functional product with core features (2.5x multiplier)
- **✅ Prod-lite**: Production-ready with polish (5x multiplier)

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4
- **Crawling**: Playwright (with fetch fallback)
- **Deployment**: Vercel-ready

## 📊 Database Schema

Single table design for MVP simplicity:

```typescript
interface Analysis {
  id: string
  created_by: string | null
  url: string                    // Original URL
  url_canonical: string          // Normalized URL
  tier: 'speedrun' | 'mvp' | 'prod-lite'
  fingerprint: string            // SHA256(canonical_url + tier)
  result: AnalysisResult         // Full JSON analysis
  is_public: boolean
  created_at: string
}
```

## 🎨 Features Showcase

### Smart URL Normalization
- Removes tracking parameters and fragments
- Handles www/non-www variants
- Case-insensitive matching

### Intelligent Crawling
- Primary page + feature/pricing/docs pages
- Playwright for JS-heavy sites
- Fetch fallback for simple sites
- Content extraction and cleanup

### AI-Powered Analysis
- GPT-4 content understanding
- Mission categorization (Accounts, Data, Content, etc.)
- Time estimation with confidence scores
- Evidence extraction with page references

### Deduplication System
- Fingerprint-based caching
- Instant results for duplicate requests
- Public precedent browsing

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy!

**Note**: Playwright requires additional setup for production deployment. Consider using a separate crawling service or serverless functions with larger memory limits.

## 🛣️ Roadmap

- [ ] User authentication and private analyses
- [ ] Community voting on accuracy
- [ ] Export to PDF/Markdown
- [ ] CLI version
- [ ] Browser extension
- [ ] User calibration (rate 3 known builds → custom pace)
- [ ] "What if" mode (toggle features to see time impact)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🙋‍♂️ Support

- [GitHub Issues](https://github.com/paarad/18-clonetime/issues)
- [Twitter](https://twitter.com/paarad)

---

Built with ❤️ for the indie hacker community.

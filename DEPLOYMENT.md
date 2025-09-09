# 🚀 Clonetime Deployment Guide

Simple deployment options for Clonetime MVP.

## 📋 Prerequisites

Before deploying, you'll need:

1. **Supabase Database**: Set up your Supabase project and create the `analyses` table
2. **OpenAI API Key**: Get your API key from OpenAI
3. **Environment Variables**: Properly configured for your environment

## 🌐 Vercel Deployment (Recommended)

Vercel provides the easiest deployment for Next.js applications.

### 1. Setup Repository

```bash
git clone https://github.com/paarad/18-clonetime.git
cd 18-clonetime
npm install
```

### 2. Configure Environment Variables

In your Vercel dashboard, add these environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### 3. Deploy

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy!

### 4. Important Note about Playwright

Vercel has limitations with Playwright in serverless functions. For production, consider:

- **Option A**: Use a separate crawling service (recommended)
- **Option B**: Use Edge Runtime with fetch-only crawling
- **Option C**: Deploy to platforms with longer timeout limits

## ☁️ Railway Deployment

Railway provides excellent support for full-stack applications.

### 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

### 2. Login and Deploy

```bash
railway login
railway init
railway up
```

### 3. Set Environment Variables

```bash
railway variables set NEXT_PUBLIC_SUPABASE_URL=your_url
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
railway variables set OPENAI_API_KEY=your_openai_key
```

## 🌊 DigitalOcean App Platform

### 1. Create App Spec

Create `.do/app.yaml`:

```yaml
name: clonetime
services:
- name: web
  source_dir: /
  github:
    repo: your-username/18-clonetime
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  env:
  - key: NEXT_PUBLIC_SUPABASE_URL
    value: your_url
  - key: NEXT_PUBLIC_SUPABASE_ANON_KEY
    value: your_key
  - key: OPENAI_API_KEY
    value: your_openai_key
```

### 2. Deploy

```bash
doctl apps create --spec .do/app.yaml
```

## 🗄️ Database Setup

Regardless of deployment platform, set up your Supabase database:

### 1. Create Table

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
```

### 2. Create Indexes

```sql
create index analyses_fingerprint_idx on analyses (fingerprint);
create index analyses_public_created_idx on analyses (is_public, created_at desc);
```

### 3. Enable RLS

```sql
alter table analyses enable row level security;

create policy "Public analyses are readable" on analyses
  for select using (is_public = true);

create policy "Users can create analyses" on analyses
  for insert with check (true);
```

## 🔧 Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `OPENAI_API_KEY` | OpenAI API key for GPT-4 | ✅ |
| `NEXT_PUBLIC_APP_URL` | Your app's public URL | ✅ |

## 📊 Performance Considerations

### For Production:

1. **Playwright Alternative**: Consider using a dedicated crawling service
2. **Caching**: Implement Redis for analysis caching
3. **Rate Limiting**: Add rate limiting for API endpoints
4. **Monitoring**: Set up error tracking and performance monitoring
5. **CDN**: Use a CDN for static assets

### Scaling Options:

- **Horizontal**: Multiple instances behind a load balancer
- **Vertical**: Larger instance sizes for better performance
- **Microservices**: Separate crawling service for heavy lifting

## 🛠️ Troubleshooting

### Common Issues:

1. **Playwright Timeout**: Increase timeout or use fetch fallback
2. **Memory Issues**: Use smaller instance or optimize crawling
3. **Database Connection**: Check Supabase connection limits
4. **OpenAI Rate Limits**: Implement proper error handling

### Debug Mode:

Set `NODE_ENV=development` to see detailed error messages.

## 📚 Additional Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Playwright Documentation](https://playwright.dev/)

---

Need help? Check our [GitHub Issues](https://github.com/paarad/18-clonetime/issues) or [Twitter](https://twitter.com/paarad).

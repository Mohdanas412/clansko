<div align="center">

# ⚡ ClanSko

### Where engineering students find co-founders, build in public, and ship.

A full-stack platform for college builders to post ideas, find collaborators, form project teams, chat in real time, track weekly goals, and get help from an AI co-pilot — all in one place.

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%7C%20Auth%20%7C%20Realtime-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Groq](https://img.shields.io/badge/AI-Groq%20Llama%203.3%2070B-F55036)](https://groq.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)](https://vercel.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

[Live Demo](#) · [Report a Bug](#) · [Request a Feature](#)

</div>

---

## 📖 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [Database](#-database)
- [Scripts](#-scripts)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 About

**ClanSko** is a community platform built for engineering students who want to build real things with real people. Instead of scattering project ideas across WhatsApp groups and Discord servers, ClanSko gives builders one place to:

- Post an idea and track it from **Idea → Validation → Building → Launched**
- Discover other builders by skill, interest, or what they're looking for
- Send connection requests and chat in real time once connected
- Form project teams and manage members
- Set weekly goals and keep a visible streak
- Talk to **Sko**, an AI assistant that knows your profile and your project context

Built solo, end-to-end, as a full-stack product — not a template.

---

## ✨ Features

| Module | What it does |
|---|---|
| 🧭 **Onboarding** | Collects profile, skills, and what a user is looking for |
| 📰 **Idea Feed** | Post ideas, react, comment, and track project stage |
| 🔍 **Explore** | Discover other builders by skill and interest |
| 🤝 **Connections** | Send, accept, and manage connection requests |
| 💬 **Realtime Chat** | 1-on-1 messaging over Supabase Realtime (WebSockets) |
| 👥 **Project Teams** | Invite collaborators onto a project with roles |
| 🎯 **Weekly Goals** | Set goals, mark them done, build a streak |
| 🤖 **Sko AI** | Context-aware AI co-pilot powered by Groq's Llama 3.3 70B |

---

## 🛠 Tech Stack

**Frontend**
- [Next.js 14](https://nextjs.org/) — App Router
- [Tailwind CSS](https://tailwindcss.com/) — styling
- [Framer Motion](https://www.framer.com/motion/) — animation

**Backend**
- Next.js API Routes (serverless)
- [Supabase](https://supabase.com/) — Postgres, Auth, Realtime

**AI**
- [Groq](https://groq.com/) — `llama-3.3-70b-versatile` inference

**Infrastructure**
- [Vercel](https://vercel.com/) — hosting & CI/CD

---

## 🏗 Architecture

```
┌─────────────────┐       ┌──────────────────────┐       ┌───────────────────┐
│   Next.js App    │──────▶│  Next.js API Routes   │──────▶│   Supabase          │
│  (App Router,     │◀──────│  (app/api/**)         │◀──────│  Postgres + Auth    │
│   Client/Server    │       │  auth, validation,     │       │  + Realtime          │
│   Components)      │       │  business logic         │       └───────────────────┘
└─────────────────┘       └──────────────────────┘
          │                             │
          │                             ▼
          │                   ┌───────────────────┐
          └──────────────────▶│   Groq API          │
                               │  (Sko AI chat)       │
                               └───────────────────┘
```

Some client components query Supabase directly (protected by Row Level Security); all other mutations and AI calls go through the Next.js API layer.

---

## ⚙️ Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com/) project
- A [Groq](https://console.groq.com/) API key

### Installation

```bash
# Clone the repo
git clone https://github.com/<your-username>/clansko.git
cd clansko

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# fill in the values — see below

# Run the database migrations (Supabase SQL editor or CLI)
# supabase db push

# Start the dev server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## 🔑 Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Groq
GROQ_API_KEY=

# Rate limiting (optional, recommended for production)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Error monitoring (optional)
SENTRY_DSN=
```

> ⚠️ Never commit `.env.local`. It's already listed in `.gitignore`.

---

## 📁 Project Structure

```
clansko/
├── app/
│   ├── (app)/              # Authenticated routes (feed, explore, messages, etc.)
│   ├── (auth)/             # Login / signup
│   ├── api/                # API route handlers
│   │   ├── auth/
│   │   ├── posts/
│   │   ├── connections/
│   │   ├── messages/
│   │   ├── projects/
│   │   ├── goals/
│   │   ├── users/
│   │   └── sko/            # AI assistant endpoint
│   └── layout.jsx
├── components/              # Shared UI components
├── lib/                      # Supabase clients, validation, rate limiting helpers
├── supabase/
│   └── migrations/          # SQL migrations (schema, indexes, RLS policies)
├── middleware.js             # Route protection
├── next.config.mjs
└── tailwind.config.js
```

---

## 🗄 Database

ClanSko uses Postgres (via Supabase) with the following core tables:

`users` · `posts` · `comments` · `reactions` · `connections` · `messages` · `goals` · `project_members`

All tables have **Row Level Security (RLS)** enabled — see `supabase/migrations/` for the full schema, indexes, and policies.

---

## 📜 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server |
| `npm run build` | Production build |
| `npm run start` | Run production build locally |
| `npm run lint` | Run ESLint |

---

## 🗺 Roadmap

- [x] Core feed, profiles, connections, chat
- [x] Weekly goals & streaks
- [x] Sko AI assistant
- [ ] Row Level Security on all tables
- [ ] Rate limiting on auth & AI endpoints
- [ ] Pagination on feed, explore, and messages
- [ ] Post moderation & reporting
- [ ] Shareable builder cards
- [ ] Mobile-first UI refresh

See [open issues](#) for the full list of proposed features and known bugs.

---

## 🤝 Contributing

This is currently a solo-built project. Contributions, issues, and feature suggestions are welcome:

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-thing`)
3. Commit your changes (`git commit -m 'Add amazing thing'`)
4. Push to the branch (`git push origin feature/amazing-thing`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">

Built with ⚡ by a solo founder, for builders.

</div>
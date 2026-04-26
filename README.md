# 🚗 AutoMarket — Full-Stack Car Reselling Marketplace

A full-featured car marketplace built with **Next.js 14**, **TypeScript**, **Prisma**, **NextAuth**, and **Cloudinary**.

---

## ✨ Features

- **Browse & Filter** — Search cars by brand, price range, year, and mileage
- **Auth** — Email/password signup & login with JWT sessions (+ optional Google OAuth)
- **Seller Dashboard** — Post, edit, mark sold, and delete listings
- **Inquiry System** — Buyers can message sellers directly from car detail pages
- **Image Upload** — Drag-and-drop multi-photo upload to Cloudinary (max 6 per listing)
- **SEO** — Dynamic metadata on every car detail page
- **Responsive** — Mobile-first, works on all screen sizes

---

## 🛠 Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + custom design system |
| Backend | Next.js API Routes |
| Database | PostgreSQL (Render) via Prisma ORM |
| Auth | NextAuth.js (credentials + optional Google OAuth) |
| Images | Cloudinary |
| Forms | React Hook Form + Zod |
| Toasts | Sonner |

---

## 🚀 Quick Start (Local Development)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd car-marketplace
npm install
```

### 2. Set Up Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# PostgreSQL (local or Render)
DATABASE_URL=postgresql://user:password@localhost:5432/car_marketplace
DIRECT_URL=postgresql://user:password@localhost:5432/car_marketplace

# NextAuth (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# Cloudinary (from cloudinary.com dashboard)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 3. Set Up Local PostgreSQL (macOS)

```bash
# Install PostgreSQL via Homebrew
brew install postgresql@16
brew services start postgresql@16

# Create database
psql -U postgres -c "CREATE DATABASE car_marketplace;"
```

### 4. Run Migrations

```bash
npx prisma migrate dev --name init
```

### 5. Seed the Database

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

Or install ts-node globally:
```bash
npm install -g ts-node
ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

**Seed creates:**
- 3 demo users (admin, seller, buyer)
- 8 sample car listings (BMW, Mercedes, Tesla, Audi, Porsche, Ford, Toyota, Honda)
- 2 sample inquiries

**Test credentials:**
- Seller: `seller@carmarket.com` / `Password123!`
- Buyer: `buyer@carmarket.com` / `Password123!`
- Admin: `admin@carmarket.com` / `Password123!`

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## ☁️ Deployment (Vercel + Render)

### Step 1 — Create Render PostgreSQL Database

1. Sign up at [render.com](https://render.com)
2. Go to **New → PostgreSQL**
3. Set name: `carmarket-db`, choose a region closest to you
4. After creation, copy the **"External Database URL"**

### Step 2 — Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) and import your repo
3. **Before deploying**, add ALL environment variables:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Render "External Database URL" |
| `DIRECT_URL` | Same as DATABASE_URL |
| `NEXTAUTH_SECRET` | Generate: `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Your Vercel URL (e.g. `https://carmarket.vercel.app`) |
| `CLOUDINARY_CLOUD_NAME` | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | From Cloudinary dashboard |

4. Click **Deploy**

The `vercel.json` build command automatically runs:
```bash
prisma generate && prisma migrate deploy && next build
```

### Step 3 — Verify Deployment

After deploy, check:
- [ ] `https://your-app.vercel.app/api/listings` returns data
- [ ] Auth signup + login works
- [ ] Image upload works
- [ ] `NEXTAUTH_URL` matches your exact Vercel domain

### Step 4 — Seed Production (Optional)

```bash
DATABASE_URL="<your-render-external-url>" npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts  # NextAuth handler
│   │   │   └── signup/route.ts         # User registration
│   │   ├── listings/
│   │   │   ├── route.ts                # GET list, POST create
│   │   │   └── [id]/route.ts           # GET, PUT, DELETE single
│   │   ├── inquiries/
│   │   │   ├── route.ts                # POST send inquiry
│   │   │   ├── received/route.ts       # GET seller's inquiries
│   │   │   └── [id]/route.ts           # PATCH mark read
│   │   └── upload/route.ts             # POST Cloudinary upload
│   ├── auth/
│   │   ├── login/page.tsx              # Login form
│   │   └── signup/page.tsx             # Signup form
│   ├── cars/
│   │   ├── page.tsx                    # Browse + filter listings
│   │   └── [id]/page.tsx               # Car detail + inquiry
│   ├── dashboard/
│   │   ├── page.tsx                    # Seller dashboard
│   │   └── listings/
│   │       ├── new/page.tsx            # Post new listing
│   │       └── [id]/edit/page.tsx      # Edit listing
│   ├── layout.tsx                      # Root layout
│   └── page.tsx                        # Homepage
├── components/
│   ├── ui/                             # Base UI components
│   ├── navbar.tsx
│   ├── listing-card.tsx
│   ├── listing-form.tsx                # Create/edit form
│   ├── dashboard-tabs.tsx
│   ├── image-gallery.tsx
│   ├── inquiry-form.tsx
│   └── cars-filter.tsx
├── lib/
│   ├── auth.ts                         # NextAuth config
│   ├── prisma.ts                       # Prisma singleton
│   ├── cloudinary.ts                   # Upload utilities
│   ├── utils.ts                        # Shared helpers
│   ├── validations/index.ts            # Zod schemas
│   └── db/
│       ├── listings.ts                 # Listing queries
│       ├── inquiries.ts                # Inquiry queries
│       └── users.ts                    # User queries
└── middleware.ts                        # Auth route protection
prisma/
├── schema.prisma                        # Database schema
└── seed.ts                              # Demo data
```

---

## 🔧 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run migrations (dev) |
| `npm run db:push` | Push schema changes (no migration) |
| `npm run db:studio` | Open Prisma Studio |

---

## 🌍 Environment Variables Reference

See [`.env.example`](.env.example) for all required variables.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `DIRECT_URL` | ✅ | Direct PostgreSQL URL (same as DATABASE_URL for Render) |
| `NEXTAUTH_SECRET` | ✅ | Random string for JWT signing |
| `NEXTAUTH_URL` | ✅ | Your app's base URL |
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | ✅ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | ✅ | Cloudinary API secret |
| `GOOGLE_CLIENT_ID` | ❌ | Google OAuth (optional) |
| `GOOGLE_CLIENT_SECRET` | ❌ | Google OAuth (optional) |

---

## 🔐 Security

- Passwords hashed with bcrypt (12 rounds)
- `passwordHash` never returned in API responses
- JWT-based sessions via NextAuth
- Route-level protection via Next.js middleware
- All mutations verify ownership before proceeding
- Sellers cannot send inquiries on their own listings
- Duplicate inquiry prevention at DB level (unique constraint)

---

## 📝 Default Assumptions

- **Role:** New users default to `BUYER`. During signup, users can choose `BUYER` or `SELLER`.
- **Images:** Stored on Cloudinary. Fallback to Unsplash placeholder images in seed data.
- **Currency:** USD only.
- **Inquiry:** One inquiry per buyer per listing (enforced at DB level).
- **Listing status:** `ACTIVE` (visible), `DRAFT` (hidden), `SOLD` (closed).

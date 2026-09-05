# 🚗 AutoMarket — Used-Car Marketplace

A full-stack marketplace where **sellers publish and manage used-car listings** and
**buyers browse and raise inquiries**, built on **Express.js** and **MongoDB** and
structured along **MVC** lines.

Role-based access separates the two workflows: a buyer account can browse, search
and contact sellers; a seller account can publish, edit and retire listings and
work an inquiry inbox. Every seller-only route is enforced server-side, so the
separation survives URL manipulation.

---

## Table of contents

- [Stack](#stack)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Data model](#data-model)
- [Indexing strategy](#indexing-strategy)
- [Search, filtering and pagination](#search-filtering-and-pagination)
- [Authentication and authorization](#authentication-and-authorization)
- [REST API reference](#rest-api-reference)
- [Testing](#testing)
- [Project layout](#project-layout)

---

## Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js 18+ |
| HTTP | Express.js 4 |
| Database | MongoDB via Mongoose 8 |
| Sessions | `express-session` + `connect-mongo` (server-side store) |
| Passwords | `bcryptjs`, cost factor 12 |
| Validation | Zod schemas at the route boundary |
| Views | EJS, server-rendered |
| Tests | Jest + Supertest against a real MongoDB |

---

## Architecture

The application is layered so that routing, business logic and data access can be
exercised independently:

```
HTTP request
    │
    ▼
routes/         Path, HTTP verb, and the middleware chain that guards it
    │           (requireAuth → requireSeller → validate)
    ▼
validators/     Zod schemas. Coerce and whitelist input; unknown fields
    │           never reach a model.
    ▼
controllers/    Thin HTTP adapters. Read the validated request, call one
    │           service, shape the response. No queries, no rules.
    ▼
services/       All business logic and every authorization decision
    │           ("is this seller the owner of this listing?").
    ▼
repositories/   Query construction and collection access. No policy.
    │
    ▼
models/         Mongoose schemas, indexes and instance helpers.
```

Two properties fall out of this split:

- **Services are testable without HTTP.** `tests/unit/listingService.test.js`
  drives ownership rules and search behaviour by calling functions directly.
- **Query building is testable without a database.**
  `listingRepository.buildSearchFilter` is a pure function, asserted in
  `tests/unit/listingRepository.test.js`.

The server-rendered pages call the *same services* the JSON API does, so a page
and its endpoint can never disagree about what a user is allowed to see. Page
routes handle `GET` only; every mutation goes through `/api/v1`.

---

## Getting started

### Prerequisites

- Node.js 18 or newer
- A MongoDB instance (local `mongod`, Docker, or Atlas)

### Install and configure

```bash
git clone <your-repo-url>
cd car-marketplace
npm install

cp .env.example .env
```

Fill in `.env`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/car_marketplace
SESSION_SECRET=<node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
PORT=3000
```

### Run

```bash
npm run seed     # optional: 4 accounts, 16 listings, sample inquiries
npm run dev      # nodemon, http://localhost:3000
npm start        # production
```

Seeded accounts all use the password `Password123`:

| Email | Role |
|---|---|
| `dana@example.com` | seller |
| `marcus@example.com` | seller |
| `priya@example.com` | buyer |
| `sam@example.com` | buyer |

### Scripts

| Command | Purpose |
|---|---|
| `npm start` | Start the server |
| `npm run dev` | Start with reload on change |
| `npm run seed` | Reset and repopulate the database, then build indexes |
| `npm test` | Full Jest suite |
| `npm run test:unit` | Services, repositories, utilities |
| `npm run test:integration` | HTTP surface through Supertest |
| `npm run lint` | ESLint |

---

## Data model

Three collections: `users`, `listings`, `inquiries`.

The schemas are shaped around **the platform's dominant read**: the search
results page, which renders dozens of listing cards at a time and is by far the
most-requested view.

### Denormalized seller snapshot

Each listing embeds the seller's display details:

```js
seller: { id: ObjectId, name: String, email: String, phone: String }
```

A results page is therefore **a single indexed `find`** — no per-card lookup into
`users`, and no `$lookup` stage. The cost is that a seller editing their profile
has to fan the change out to their listings, which
`listingRepository.updateSellerSnapshot` does in one `updateMany`. That write
happens orders of magnitude less often than a search.

Inquiries denormalize the same way, embedding a listing snapshot
(`title`, `price`, `image`) and the buyer's contact details, so both the seller's
inbox and the buyer's sent list render from one query each.

### Constraints enforced by the database

- `users.email` — unique index. A read-then-write check races under concurrent
  signups; the index does not.
- `inquiries.(listing.id, buyer.id)` — unique index, giving one inquiry per buyer
  per listing.
- `users.passwordHash` — `select: false`, so no query returns the hash unless it
  explicitly asks for it.

---

## Indexing strategy

Every buyer-facing query filters on `status: 'active'`, so that field leads each
compound index, followed by the equality fields (`make`, `model`) and then the
ranges (`year`, `price`). The goal is that **no search path falls back to a
collection scan**, and that the common browse orderings get their sort from the
index rather than from an in-memory sort.

| Index | Fields | Serves |
|---|---|---|
| `search_make_model_year_price` | `status, make, model, year, price` | The primary search. A `make`-only or `make + model` query uses the same index via its prefix. |
| `search_price_year` | `status, price, year` | Price-led browsing ("everything under $15k, cheapest first") where no make is given. |
| `browse_recent` | `status, createdAt` | The default landing view. |
| `seller_dashboard` | `seller.id, status, createdAt` | One seller's listings across every status. |
| `listing_text` | text on `title, description, make, model` | Keyword search, weighted toward the title. |
| `seller_inbox` | `sellerId, status, createdAt` | Inquiries received, optionally unread-only. |
| `buyer_sent` | `buyer.id, createdAt` | Inquiries sent. |

### Measured plans

Taken from `explain('executionStats')` against the seeded dataset. Every path is
an `IXSCAN`; none is a `COLLSCAN`.

| Query | Plan |
|---|---|
| Default browse, newest first | `FETCH ← IXSCAN [browse_recent]` — sort provided by the index |
| Price range, cheapest first | `FETCH ← IXSCAN [search_price_year]` — sort provided by the index |
| make + model + year + price | `IXSCAN [search_make_model_year_price]`, 2 keys examined for 1 result |
| make only, newest first | `IXSCAN [search_make_model_year_price]` + `SORT` |
| Seller dashboard | `IXSCAN [seller_dashboard]` + `SORT` |

The last two add an in-memory `SORT` stage, because `createdAt` is not a
contiguous suffix of the index once a range or a skipped field intervenes. That
sort runs over the already-filtered result set — a handful of documents, not the
collection — so it stays cheap; the scan itself is still index-driven. The
alternative would be another index per sort order, which would cost more on
every write than it saves on these reads.

Indexes are declared on the schemas and built by `npm run seed` (or
`database.syncIndexes()`). `autoIndex` is off in production so index builds
happen in a deploy step, not in the request path of a freshly booted process.

To confirm the plan against your own data:

```js
db.listings
  .find({ status: 'active', make: 'Toyota', model: 'Corolla',
          year: { $gte: 2015 }, price: { $lte: 30000 } })
  .explain('executionStats');
// winningPlan … stage: 'IXSCAN', indexName: 'search_make_model_year_price'
// executionStats.totalDocsExamined ≈ nReturned  (no collection scan)
```

---

## Search, filtering and pagination

`GET /api/v1/listings` accepts these parameters, combinable in any mix:

| Parameter | Type | Notes |
|---|---|---|
| `q` | string | Full-text search across title, description, make, model |
| `make`, `model` | string | Case-insensitive exact match |
| `minYear`, `maxYear` | int | Range |
| `minPrice`, `maxPrice` | int | Range |
| `maxMileage` | int | Upper bound |
| `fuelType` | enum | petrol, diesel, hybrid, electric, cng, lpg |
| `transmission` | enum | manual, automatic |
| `location` | string | Substring match |
| `sort` | enum | `newest`, `oldest`, `price_asc`, `price_desc`, `year_desc`, `year_asc`, `mileage_asc` |
| `page` | int | Defaults to 1 |
| `limit` | int | Defaults to 12, **capped server-side at `MAX_PAGE_SIZE` (50)** |

Two things keep the response payload flat as the collection grows:

1. **`limit` is clamped server-side.** A request for `limit=100000` returns 50
   results, not the collection. Validators check that the value is a positive
   integer; `utils/pagination` owns the cap.
2. **List endpoints project down to summary fields.** `description` is omitted
   and the image array is sliced to its first entry
   (`Listing.SUMMARY_PROJECTION`), so a results page costs roughly the same bytes
   per listing however much prose a seller wrote. The full document is returned
   only by `GET /listings/:id`.

Every list response carries the same meta block:

```json
{
  "success": true,
  "data": [ /* … */ ],
  "meta": {
    "page": 2, "limit": 12, "total": 137,
    "totalPages": 12, "hasNextPage": true, "hasPrevPage": true
  }
}
```

---

## Authentication and authorization

**Signup and login** — `POST /api/v1/auth/register` and `/login`. Passwords are
hashed with bcrypt at cost 12 and stored as `passwordHash`; the plain text exists
only inside `authService`. A wrong password and an unknown account produce the
same 401 with the same message, so the endpoint cannot be used to enumerate
registered addresses.

**Session management** — `express-session` with `connect-mongo` as the store. The
cookie carries nothing but a signed session id; the user id and role live
server-side where a client cannot edit them. The cookie is `httpOnly`,
`sameSite=lax`, and `secure` in production. The session id is **regenerated on
sign-in** so a pre-auth id cannot be reused once privileges change.

**Authorization** runs server-side on every protected route, in two stages:

1. `requireAuth` and `requireRole(...)` in `middleware/auth.js` read the role
   from the **session only** — never from a request body, query string or header.
   A buyer session hitting `POST /api/v1/listings` gets a 403 before any handler
   runs.
2. The service layer then checks *ownership*, because only it knows whether this
   seller owns *this* listing. `listingService.requireOwnedListing` is the single
   funnel for every seller mutation.

The rendered pages are gated by the same rules (`requireSellerPage`), so
navigating to `/dashboard` or `/cars/new` with a buyer session is refused rather
than rendered. Identity is always taken from the session: posting a `seller`
object in a create-listing body does not change who the listing belongs to, and
both cases are covered by tests.

---

## REST API reference

Base path: `/api/v1`. All responses are `{ success, data }` or
`{ success: false, error: { message, details? } }`.

### Auth

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/auth/register` | public | Create an account (`role`: buyer or seller) and start a session |
| `POST` | `/auth/login` | public | Sign in |
| `POST` | `/auth/logout` | public | Destroy the session |
| `GET` | `/auth/me` | session | Current user |
| `POST` | `/auth/password` | session | Change password |

### Listings

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/listings` | public | Paginated multi-parameter search (active only) |
| `GET` | `/listings/filters` | public | Distinct makes and models for the search form |
| `GET` | `/listings/:id` | public | One listing (drafts visible only to their seller) |
| `GET` | `/listings/mine` | **seller** | The caller's own listings, drafts included |
| `GET` | `/listings/stats` | **seller** | Dashboard counters |
| `POST` | `/listings` | **seller** | Publish a listing |
| `PATCH` | `/listings/:id` | **seller, owner** | Update |
| `PATCH` | `/listings/:id/status` | **seller, owner** | Draft / active / sold |
| `DELETE` | `/listings/:id` | **seller, owner** | Delete, cascading its inquiries |

### Inquiries

| Method | Path | Access | Description |
|---|---|---|---|
| `POST` | `/inquiries` | session | Raise an inquiry on an active listing |
| `GET` | `/inquiries/sent` | session | The caller's own inquiries |
| `GET` | `/inquiries/received` | **seller** | Inbox for the caller's listings |
| `GET` | `/inquiries/:id` | either party | One inquiry |
| `PATCH` | `/inquiries/:id/read` | **recipient** | Mark read |
| `POST` | `/inquiries/:id/reply` | **recipient** | Reply |
| `DELETE` | `/inquiries/:id` | either party | Withdraw or clear |

### Users

| Method | Path | Access | Description |
|---|---|---|---|
| `GET` | `/users/me` | session | Full profile |
| `PATCH` | `/users/me` | session | Update name, phone, location (fans out to listing snapshots) |
| `POST` | `/users/me/become-seller` | session | Upgrade a buyer account to a seller account |
| `DELETE` | `/users/me` | session | Delete the account and its listings |
| `GET` | `/users/:id` | public | Public seller profile |
| `GET` | `/users` | **admin** | Paginated user directory |

`GET /api/v1/health` reports process uptime and connection state.

### Example

```bash
# Sign in, keeping the session cookie
curl -c cookies.txt -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"dana@example.com","password":"Password123"}'

# Search: Toyotas from 2018 on, under $20k, cheapest first
curl 'http://localhost:3000/api/v1/listings?make=Toyota&minYear=2018&maxPrice=20000&sort=price_asc&limit=5'

# Publish a listing (seller session required)
curl -b cookies.txt -X POST http://localhost:3000/api/v1/listings \
  -H 'Content-Type: application/json' \
  -d '{"title":"2020 Mazda CX-5 Sport","make":"Mazda","model":"CX-5","year":2020,
       "price":20400,"mileage":38900,"description":"Full service history.","status":"active"}'
```

---

## Testing

```bash
npm test
```

The suite runs against a **real MongoDB**, not a stubbed driver, so the unique
indexes and query planner behave as they do in production.

- By default it starts an ephemeral `mongodb-memory-server`.
- Set `TEST_MONGODB_URI` to use an existing server instead — what CI does with a
  service container. Each test file gets its own database, dropped afterwards.

```bash
TEST_MONGODB_URI=mongodb://127.0.0.1:27017 npm test
```

Coverage is split along the architecture:

| Suite | What it pins down |
|---|---|
| `unit/pagination` | Clamping, skip arithmetic, meta |
| `unit/listingRepository` | Filter construction, including regex escaping of user input |
| `unit/authService` | Hashing, duplicate emails, no admin self-assignment, non-enumerable login errors |
| `unit/listingService` | Search combinations, draft visibility, ownership, non-editable fields |
| `unit/inquiryService` | Duplicate prevention, counters, who may read and reply |
| `integration/auth.api` | Session lifecycle, cookie flags, session regeneration |
| `integration/listings.api` | Role gates, ownership across HTTP, payload shape, `limit` cap |
| `integration/inquiries.api` | Inbox separation, identity taken from session not body |
| `integration/pages` | Rendered pages enforce the same role rules as the API |

---

## Project layout

```
src/
├── app.js                  Express wiring, exported as a factory for tests
├── server.js               Entry point: connect, listen, graceful shutdown
├── config/
│   ├── env.js              Single validated view of process.env
│   ├── database.js         Mongoose connection and index sync
│   └── session.js          Session store and cookie policy
├── models/                 Mongoose schemas, indexes, instance helpers
│   ├── User.js
│   ├── Listing.js
│   └── Inquiry.js
├── repositories/           Query construction and collection access
├── services/               Business logic and authorization decisions
├── controllers/            HTTP adapters (API) and page renderers
├── routes/
│   ├── api/                /api/v1 — auth, listings, inquiries, users
│   └── web.routes.js       Server-rendered pages (GET only)
├── middleware/             auth, validate, asyncHandler, errorHandler, rateLimit
├── validators/             Zod schemas per resource
├── utils/                  ApiError, pagination, constants
├── views/                  EJS layout, partials and pages
├── public/                 Stylesheet and progressive-enhancement JS
└── scripts/seed.js         Development dataset

tests/
├── setup.js                Database fixture
├── helpers/                Factories and an authenticated Supertest agent
├── unit/
└── integration/
```

---

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `NODE_ENV` | `development` | Enables production hardening when `production` |
| `PORT` | `3000` | HTTP port |
| `MONGODB_URI` | — | **Required.** Connection string |
| `SESSION_SECRET` | — | **Required.** Signing key for the session cookie |
| `SESSION_NAME` | `cm.sid` | Cookie name |
| `SESSION_TTL_MS` | `604800000` | Session lifetime (7 days) |
| `MAX_PAGE_SIZE` | `50` | Hard cap on `limit` |
| `TRUST_PROXY` | `0` | Set to `1` behind a TLS-terminating proxy |
| `TEST_MONGODB_URI` | — | Tests only: use this server instead of an in-memory one |

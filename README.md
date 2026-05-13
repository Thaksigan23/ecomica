# Ecomica - Fullstack Book E-Commerce Platform

Ecomica is a role-based online bookstore built with a React frontend and a Spring Boot + MongoDB backend.
It supports buyer, seller, and admin workflows in one project, with a modern Amazon-like UI and JWT authentication.

## Features

### Buyer
- Register/login as buyer
- Browse books by search, category, and filters (price range, in-stock, format, language)
- View book details with optional metadata (ISBN, language, format, publisher, year)
- Related titles, **customers also bought**, and **Q&A** (ask questions; sellers/admins can answer)
- Reviews with **verified purchase** badge when the buyer bought the book
- Add/remove cart items and update quantities
- Wishlist support
- Address book management
- Buyer profile page with editable account info and **loyalty points**
- Save/manage payment methods (Card and UPI)
- Multi-step checkout (Address -> Payment -> Review) with **promo codes** (e.g. seeded `SAVE10`, `WELCOME15`), merchandise/discount/shipping/tax/total aligned with the server
- Cancel **PLACED** orders from order history; order lines show **coupon and breakdown** when present
- Order history with status timeline

### Seller
- Register/login as seller
- Seller dashboard with separate visual theme
- Add and delete own book listings (optional category and catalogue metadata: ISBN, language, format, publisher, publication year)
- **Orders containing your listings** (read-only view per order lines)
- Seller profile page with store/account details
- Save/manage payment methods (Card and UPI)
- Seller analytics:
  - listed books
  - total units sold
  - total revenue
  - top-selling books
  - low-stock alerts

### Admin
- Login as admin
- Admin dashboard with stats:
  - total users
  - total orders
  - total revenue
  - pending approvals
- Moderate books (Approve / Reject / Reset)
- Block and unblock users
- Moderation filters and search
- Load-more pagination in moderation list

### UX Enhancements
- Amazon-style landing page
- Hero slider with navigation arrows
- Landing product cards linking to filtered buyer views
- Role-based route guards with redirect-after-login
- Floating animated toast notifications across app
- Light **route enter animation** on navigation (respects reduced-motion)
- Modernized seller dashboard with listing status badges and reload
- Vite `/api` proxy for stable local frontend-backend connectivity

### Checkout rules (demo)
- Flat shipping **Rs. 49** unless merchandise after coupon is **≥ Rs. 999** (free shipping)
- Tax **5%** on merchandise after discount
- Seeded coupons (see `SeedConfig`): **`SAVE10`** (10% off), **`WELCOME15`** (15% off, minimum merchandise **Rs. 500**)

## Tech Stack

### Frontend
- React + TypeScript
- Vite
- React Router
- Axios
- Custom CSS

### Backend
- Java 21
- Spring Boot 3
- Spring Security (JWT)
- Spring Data MongoDB
- Maven

### Database
- MongoDB

## Project Structure

```text
ecomica3/
  backend/   # Spring Boot API
  frontend/  # React client
```

## Prerequisites

- Node.js 18+
- npm
- Java 21
- Maven 3.9+ (backend build and `spring-boot:run`)
- MongoDB (local or cloud URI)

## Environment Configuration

Backend config is in:

- `backend/src/main/resources/application.properties`
- `backend/src/main/resources/application-prod.properties` (when `spring.profiles.active=prod`)

Set/update (names match Spring Boot binding):

| Purpose | Property or env |
|--------|-------------------|
| MongoDB URI | `spring.data.mongodb.uri` or environment variable `MONGO_URI` |
| JWT signing secret | `app.jwt.secret` or `JWT_SECRET` |
| JWT lifetime (ms) | `app.jwt.expiration-ms` |
| Demo seed data on startup | `app.seed.enabled` (`true` by default locally; `false` when profile `prod` is active) |
| Seeded admin login (optional) | `ADMIN_EMAIL`, `ADMIN_PASSWORD` |

Example for local `application.properties` overrides:

```properties
spring.data.mongodb.uri=mongodb://localhost:27017/ecomica3
app.jwt.secret=change-me-to-a-long-random-secret-at-least-32-chars
app.jwt.expiration-ms=86400000
app.seed.enabled=true
```

Production: run with `spring.profiles.active=prod`, set strong `JWT_SECRET`, and keep `app.seed.enabled=false` so demo users are not created.

## Run Locally

### 1) Start Backend

```bash
cd backend
mvn spring-boot:run
```

Backend default URL:

- `http://localhost:8080`

### 2) Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend default URL:

- `http://localhost:5173` (if that port is busy, Vite picks the next free port, e.g. **5174**)

If the backend fails with **port 8080 already in use**, stop the existing Java/Spring process or change the server port in Spring Boot config.

## Dev Networking (Important)

Frontend uses relative API base `/api` and Vite proxy config:

- `frontend/vite.config.ts` -> `/api` proxies to `http://127.0.0.1:8080`

If you update Vite config, restart frontend dev server:

```bash
cd frontend
npm run dev
```

## Demo Credentials (Seeded)

- Buyer 2: `buyer2@ecomica.com` / `buyer234`
- Seller 2: `seller2@ecomica.com` / `seller234`
- Admin: `admin@ecomica.com` / `admin123`

## Key Frontend Routes

- `/` - landing page
- `/login` - login
- `/register` - register
- `/buyer/dashboard`
- `/buyer/profile`
- `/buyer/book/:id`
- `/buyer/cart`
- `/buyer/orders`
- `/seller/dashboard`
- `/seller/profile`
- `/admin/dashboard`

## Key API Groups

- `/api/auth/*` - login/register
- `/api/books/*` - books catalog and CRUD; filters via query params; `GET .../also-bought`; `GET|POST .../questions`, `PATCH .../questions/{id}/answer`
- `/api/categories/*` - categories
- `/api/cart/*` - cart operations
- `/api/orders/*` - checkout and orders; `PATCH .../{id}/cancel` for PLACED orders (buyer/admin)
- `/api/reviews/*` - reviews
- `/api/wishlist/*` - wishlist
- `/api/addresses/*` - address book
- `/api/profile/*` - profile view/update (includes loyalty points)
- `/api/payment-methods/*` - saved payment methods
- `/api/seller/*` - seller books, analytics, **orders**
- `/api/admin/*` - admin users/orders/books moderation

## Notes

- Demo seeding (`app.seed.enabled`) is on by default for local development; the `prod` profile turns it off.
- Public book listing only shows approved + active books.
- New seller books are submitted with pending moderation.
- Blocked users cannot login.
- JWT is used for auth and role-based access control.
- JWT filter ignores invalid/stale tokens gracefully to avoid login lockout.

## Author

Built for the Ecomica fullstack project.

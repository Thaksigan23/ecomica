# Ecomica - Fullstack Book E-Commerce Platform

Ecomica is a role-based online bookstore built with a React frontend and a Spring Boot + MongoDB backend.
It supports buyer, seller, and admin workflows in one project, with a modern Amazon-like UI and JWT authentication.

## Features

### Buyer
- Register/login as buyer
- Browse books by search and category
- View book details, reviews, and related books
- Add/remove cart items and update quantities
- Wishlist support
- Address book management
- Buyer profile page with editable account info
- Save/manage payment methods (Card and UPI)
- Multi-step checkout (Address -> Payment -> Review)
- Order history with status timeline

### Seller
- Register/login as seller
- Seller dashboard with separate visual theme
- Add and delete own book listings
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
- Modernized seller dashboard with listing status badges and reload
- Vite `/api` proxy for stable local frontend-backend connectivity

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

- `http://localhost:5173`

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
- `/api/books/*` - books catalog and CRUD
- `/api/categories/*` - categories
- `/api/cart/*` - cart operations
- `/api/orders/*` - checkout and orders
- `/api/reviews/*` - reviews
- `/api/wishlist/*` - wishlist
- `/api/addresses/*` - address book
- `/api/profile/*` - profile view/update
- `/api/payment-methods/*` - saved payment methods
- `/api/seller/*` - seller books/analytics
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

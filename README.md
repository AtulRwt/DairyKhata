# DairyKhata 🥛

> Digital Milk Register for Small Milk Sellers

DairyKhata is a production-quality MERN application that gives milk sellers an Excel-style monthly register and gives customers a simple mobile hisab screen.

## Features

- **Monthly Register** — Spreadsheet-style milk entry with keyboard navigation (Tab/Enter/Arrow keys)
- **Multi-role Auth** — Owner, Employee, Customer (phone-only login)
- **Multi-tenant** — Complete data isolation per seller
- **UPI Payment** — Auto-generated UPI deep link for customer payments
- **Audit Logs** — Track every milk entry change with who did it
- **Customer Hisab** — Clean mobile screen showing personal milk usage + pay button
- **Windows/Routes** — Group customers by delivery route
- **Rate History** — Rate stored per entry for accurate historical billing

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + Tailwind CSS |
| State | Zustand |
| HTTP | Axios |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT |

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Clone and Install

```bash
cd DairyKhata
npm run install:all
```

### 2. Configure Environment

Copy and edit the server `.env`:
```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/dairykhata
JWT_SECRET=your-secret-key-here
CLIENT_URL=http://localhost:5173
```

### 3. Run Development Servers

```bash
npm run dev
```

This starts:
- Server: http://localhost:5000
- Client: http://localhost:5173

### 4. Create First Owner Account

Go to http://localhost:5173/signup and create your owner account.

## User Roles

| Role | Login | Access |
|---|---|---|
| Owner | `/login` (email + password) | Full control |
| Employee | `/login` tab (phone + password) | Assigned customers |
| Customer | `/customer-login` (phone only) | Own hisab only |

## API Reference

```
POST /api/auth/owner/register    Owner signup
POST /api/auth/owner/login       Owner login
POST /api/auth/employee/login    Employee login
POST /api/auth/customer/login    Customer login (phone only)

GET  /api/customers              List customers
POST /api/customers              Create customer
PUT  /api/customers/:id          Update customer
PATCH /api/customers/:id/status  Toggle active

GET  /api/milk/monthly           Monthly register data
POST /api/milk                   Upsert milk entry

GET  /api/billing/customer/:id   Customer billing + UPI link
GET  /api/billing/monthly        Monthly billing overview

GET  /api/dashboard              Dashboard stats + recent activity
GET  /api/settings               Seller settings
PUT  /api/settings               Update settings (UPI ID, rate)
```

## Project Structure

```
DairyKhata/
├── client/              React + Vite frontend
│   └── src/
│       ├── features/register/   Monthly Register + EditableCell
│       ├── pages/               All page components
│       ├── layouts/             Auth + Owner layouts
│       ├── services/api.js      Axios service layer
│       ├── store/authStore.js   Zustand auth store
│       └── utils/dateUtils.js   Date + formatting helpers
└── server/              Express backend
    └── src/
        ├── models/      Mongoose models
        ├── controllers/ Route handlers
        ├── routes/      Express routes
        └── middleware/  Auth + error handlers
```

## Security Notes

- `sellerId` is always extracted from JWT server-side — never trusted from client
- Customer auth enforces `authenticatedCustomerId === requestedCustomerId`
- Rate limiting on all login endpoints
- Helmet.js security headers
- Input validation on all mutations

---

Made with ❤️ for small dairy businesses

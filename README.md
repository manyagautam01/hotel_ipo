# Roomly: Hotel Management System

A full-stack hotel booking site. Guests browse rooms and make reservations; administrators manage rooms, users and bookings.

**Stack:** React + Vite · Node.js + Express · MongoDB + Mongoose · JWT · bcryptjs · Axios · Lucide React

```
Roomly/
├── Client/   React app (http://localhost:5173)
└── Server/   Express API (http://localhost:8001)
```

## 1. Prerequisites
- Node.js 18 or newer
- MongoDB running locally (Community Server), **or** a free MongoDB Atlas cluster (see section 6)

## 2. Run the backend
```bash
cd Server
npm install
cp .env.example .env        # Windows (cmd): copy .env.example .env
```
Open `Server/.env` and **replace the sample secrets**:

| Variable | Meaning |
|---|---|
| `PORT` | API port (default `8001`) |
| `MONGODB_URI` | Mongo connection string (default local DB `roomly`) |
| `JWT_SECRET` | Long random string. Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Your admin login. Password needs 10+ characters with letters and digits |
| `CLIENT_ORIGIN` | Frontend URL allowed by CORS (default `http://localhost:5173`) |

Then start it:
```bash
npm run dev
```
You should see `MongoDB connected`, `Admin setup: Admin account created…` and `Roomly API listening on http://localhost:8001`.
The server refuses to start while `JWT_SECRET` is still the placeholder.

## 3. Run the frontend
In a **second terminal**:
```bash
cd Client
npm install
cp .env.example .env        # Windows (cmd): copy .env.example .env
npm run dev
```
Open http://localhost:5173. Production build: `npm run build` (output in `Client/dist`, preview with `npm run preview`).

## 4. Admin account
The admin is created **from the backend `.env`** when the server starts (or by running `npm run seed:admin` in `Server/`).
1. Set `ADMIN_EMAIL` and a strong `ADMIN_PASSWORD` in `Server/.env`.
2. Start the server. The account is created with the `admin` role and a bcrypt-hashed password.
3. Log in at `/login` with those credentials. You are sent to the Admin Dashboard.

To change the admin password later, edit `.env` and run `npm run seed:admin -- --reset`.
There is no public way to become an admin: registration always creates a `guest` and ignores any `role` field.

## 5. Demo / testing walkthrough
1. **Optional sample data:** in `Server/` run `npm run seed:rooms` (adds 7 rooms).
2. **Register a guest:** `/register` → you are signed in and land on the guest dashboard.
3. **Admin adds rooms:** log in as admin → *Add rooms* tab → fill the form → the room appears in *All rooms*. Toggle availability or delete a room there.
4. **Book as a guest:** log in as the guest → *Book a room* → choose dates and guests → *Confirm booking*. It shows in *My bookings* with nights and an estimated total.
5. **Try the rules:** book the same room for overlapping dates (rejected), use more guests than capacity (rejected), check-out before check-in (rejected).
6. **Cancel:** click *Cancel* on an upcoming booking. The dates become bookable again.
7. **Admin views:** *All users* (no passwords shown) and *All bookings* (can mark Complete or Cancel).

## 6. MongoDB Atlas (if you have no local MongoDB)
1. Create a free cluster at mongodb.com/atlas, add a database user, and under *Network Access* allow your IP.
2. *Connect → Drivers* → copy the connection string.
3. Put it in `Server/.env`, adding the database name:
   `MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/roomly?retryWrites=true&w=majority`
   (URL-encode special characters in the password.)

## 7. Troubleshooting
- **"Could not connect to MongoDB":** start `mongod` (Windows: *Services → MongoDB Server → Start*; macOS: `brew services start mongodb-community`), check `MONGODB_URI`, and for Atlas check the IP allow-list.
- **"Port 8001 already in use":** stop the other process, or change `PORT` in `Server/.env` **and** `VITE_API_URL` in `Client/.env`, then restart both. Find the process: Windows `netstat -ano | findstr :8001`; macOS/Linux `lsof -i :8001`.
- **Frontend shows "Cannot reach the server":** the backend is not running, or `VITE_API_URL` is wrong. Restart `npm run dev` in `Client/` after editing `.env` (Vite reads it at startup).
- **CORS error in the browser console:** `CLIENT_ORIGIN` must exactly match the frontend URL (`http://localhost:5173`).
- **Admin not created:** the server log says why, usually a weak or placeholder `ADMIN_PASSWORD`.
- Quick API check: http://localhost:8001/api/health

## 8. API reference
| Method | Route | Access |
|---|---|---|
| GET | `/api/health` | public |
| POST | `/api/auth/register`, `/api/auth/login` | public |
| GET | `/api/auth/me` | logged in |
| GET | `/api/rooms`, `/api/rooms/:id` (`?available=true`) | public |
| POST | `/api/rooms` | admin |
| PATCH | `/api/rooms/:id/availability` | admin |
| DELETE | `/api/rooms/:id` | admin (blocked if the room has active bookings) |
| GET | `/api/users` | admin |
| POST | `/api/bookings` | logged in |
| GET | `/api/bookings/mine` | logged in (own bookings only) |
| GET | `/api/bookings` | admin |
| PATCH | `/api/bookings/:id/cancel` | booking owner or admin |
| PATCH | `/api/bookings/:id/status` | admin (`completed` or `cancelled`) |

Admin routes are protected by `protect` + `adminOnly` middleware, which re-read the user's role from the database on every request.

## 9. Design notes and known limitations
- **Dates** are stored as UTC midnight; a stay occupies nights from check-in up to (not including) check-out, so a guest can check in the day another checks out.
- **Overlap check** runs before saving. Without a MongoDB replica set/transaction, two requests at the exact same instant could in theory both pass; fine for a college project, use transactions for production.
- **No payments.** Totals are estimates only.
- **Token storage:** the JWT is kept in `localStorage` (key `roomly_auth`). It is simple but readable by any script running on the page (XSS). Production apps usually use httpOnly cookies. Passwords are never stored in the browser.
- Tokens last 7 days. Expired or invalid tokens log the user out with a message.
- Room photos use Unsplash URLs; if one fails to load a drawn placeholder appears.
- No automated test suite is included. `npm run check` (in `Server/`) loads every server module to catch syntax or import errors.

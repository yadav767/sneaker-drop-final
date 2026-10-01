# Sneaker Drop — Notes

## 1. Requirements

- Node.js 18+
- MongoDB running locally or a MongoDB Atlas connection
- npm

No frontend is required. This project is backend-only.

## 2. Setup

From the project root:

```bash
npm install
```

Create a `.env` file in the project root:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/sneaker_drop
HOLD_SECONDS=300
```

`HOLD_SECONDS` is set to 300 seconds (5 minutes) for the actual sale. For testing expiry quickly, it can be changed to:

```env
HOLD_SECONDS=20
```

Start the server:

```bash
npm start
```

For development with automatic restart:

```bash
npm run dev
```

The server runs on:

```text
http://localhost:5000
```

The application automatically creates sneaker records numbered 1–20 if they do not already exist.

To reset the sale completely, drop the `sneaker_drop` database and start the server again.

---

## 3. API Endpoints

### Create User

```http
POST /api/sneakers/users
```

Body:

```json
{
  "name": "Asha",
  "email": "asha@test.dev"
}
```

Creates or returns a test user.

### Sale Summary

```http
GET /api/sneakers/sale
```

Returns:

- total sneakers
- available
- held
- sold
- waiting

### Buy Sneaker

```http
POST /api/sneakers/buy
```

Body:

```json
{
  "userId": "<userId>"
}
```

Possible results:

- `201` — sneaker reserved for the user
- `202` — user joined the waiting queue
- `409` — request is not allowed (for example, purchase limit or active hold)

### User Status

```http
GET /api/sneakers/status/:userId
```

Returns:

- number of completed purchases
- current reservation
- sneaker number
- remaining hold time
- queue position

### Get Order

```http
GET /api/orders/:orderId
```

Returns the order and its current status.

### Simulate Payment

```http
POST /api/payments/simulate
```

Body:

```json
{
  "orderId": "<orderId>",
  "delaySeconds": 0,
  "twice": false
}
```

`delaySeconds` simulates a late payment.

`twice: true` sends the same fake payment twice to test duplicate-payment handling.

---

## 4. How the System Works

When a user clicks **Buy**:

1. Check that the user has not already completed 2 purchases.
2. Check that the user does not already have an active hold.
3. Add the user to the persistent MongoDB queue.
4. `processQueue()` takes the oldest waiting user.
5. One `AVAILABLE` sneaker is atomically changed to `HELD`.
6. A `PENDING` order is created with a 5-minute expiry.
7. If payment arrives before expiry, the order becomes `PAID` and the sneaker becomes `SOLD`.
8. If the hold expires, the order becomes `EXPIRED`, the sneaker returns to `AVAILABLE`, and the next waiting user gets a fresh hold.

The reservation expiry job checks MongoDB every second, so expiry information is stored in the database and is not dependent on a per-order `setTimeout`.

---

## 5. Concurrency / Overselling Protection

The important operations use MongoDB atomic conditional updates instead of unsafe read-then-write logic.

For example:

```js
Sneaker.findOneAndUpdate(
  { status: "AVAILABLE" },
  { status: "HELD", ... }
);
```

Only one concurrent request can claim a particular available sneaker.

The queue also uses an atomic update to take the oldest `WAITING` user.

Payment only succeeds when the order is still `PENDING` and its `expiresAt` is in the future:

```js
{
  status: "PENDING",
  expiresAt: { $gt: now }
}
```

This prevents an expired order from being paid later.

MongoDB unique indexes also enforce important rules such as:

- one active `PENDING` order per user
- one active `WAITING` queue entry per user
- unique sneaker numbers

This allows the system to handle many users attempting to buy the limited 20 pairs without overselling them.

---

## 6. Important State Changes

### Sneaker

```text
AVAILABLE → HELD → SOLD
               ↓
           AVAILABLE
```

A held sneaker returns to `AVAILABLE` when its order expires.

### Order

```text
PENDING → PAID
PENDING → EXPIRED
```

`PAID` and `EXPIRED` are final states.

### Queue

```text
WAITING → DONE
WAITING → CANCELLED
```

`DONE` means the user received a reservation. `CANCELLED` is used when the sale is completely sold out and the remaining queue can no longer receive a pair.

---

## 7. Project Structure

```text
server/
├── server.js
└── src/
    ├── app.js
    ├── config/
    │   └── db.js
    ├── controllers/
    ├── jobs/
    │   └── reservationExpiry.js
    ├── models/
    ├── routes/
    └── services/
```

- `models` — MongoDB/Mongoose schemas
- `controllers` — handles HTTP requests and responses
- `services` — business logic
- `routes` — API routes
- `jobs` — reservation expiry job
- `config` — database connection
- `app.js` — Express configuration
- `server.js` — database connection, initialization, job startup, and server startup

---

## 8. Suggested Demo / Screen Recording Flow

For the required screen recording:

1. Explain the project and folder structure.
2. Start MongoDB and the Node.js server.
3. Create a user.
4. Buy a sneaker and show the `PENDING` reservation.
5. Simulate a successful payment and show the order becoming `PAID`.
6. Simulate the same payment twice and show the duplicate being ignored.
7. Use a short `HOLD_SECONDS` value to demonstrate an expired reservation.
8. Create multiple users and show the FIFO waiting queue.
9. Explain that sneaker reservation and payment use atomic MongoDB updates to prevent overselling.

The project is intentionally backend-only and uses a fake payment system as required by the assignment.

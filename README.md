# Wise Money auction backend

A small, focused Node.js backend for a private live auction room of up to 20 bidders. It exposes REST endpoints for the host and bidders, plus a WebSocket channel that broadcasts every accepted or rejected bid immediately to everyone watching the lot.

## What is implemented

- **Arbitrary bid amounts:** bidders can enter any amount higher than the current price; there is no fixed increment.
- **Bid serialization:** PostgreSQL uses `SERIALIZABLE` transactions and `SELECT ... FOR UPDATE`. The local fallback uses a per-auction promise lock. A lower or equal bid is rejected instead of overwriting a winning bid.
- **Idempotent bid submission:** the `clientBidId` prevents double-placing a bid when a mobile connection retries the same request.
- **Live updates:** WebSocket messages are broadcast to all clients subscribed to `auctionId`.
- **Host controls:** create auctions and change their status (`draft`, `live`, `ended`) with the optional host token.
- **Participant room limit:** `POST /api/participants` admits up to `MAX_PARTICIPANTS` (20 by default).
- **Storage choices:** omit `DATABASE_URL` for an in-memory demo, or set it for durable PostgreSQL hosting.

## Run locally

```bash
cp .env.example .env
npm install
npm run dev
```

For durable storage, create a PostgreSQL database and set `DATABASE_URL`. The server creates the required tables at startup. The SQL is also available in [`schema.sql`](./schema.sql).

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/wise_money npm run db:init
```

The API listens on `http://localhost:8080` by default. Set `HOST_ADMIN_TOKEN` before exposing host routes to the internet. For a private 20-person event, keep `CORS_ORIGIN` restricted to the hosted frontend origin.

## Host flow

Create a lot:

```bash
curl -X POST http://localhost:8080/api/auctions \
  -H 'content-type: application/json' \
  -H 'x-host-token: replace-me' \
  -d '{"title":"Nocturne / 07","description":"Generative digital art","initialBidCents":3000,"endsAt":"2026-09-18T23:00:00.000Z"}'
```

Start bidding by setting the returned auction to `live`:

```bash
curl -X PATCH http://localhost:8080/api/auctions/AUCTION_ID \
  -H 'content-type: application/json' \
  -H 'x-host-token: replace-me' \
  -d '{"status":"live"}'
```

End the auction with the same endpoint and `{ "status": "ended" }`.

## Bidder flow

Register the bidder once per browser/device:

```bash
curl -X POST http://localhost:8080/api/participants \
  -H 'content-type: application/json' \
  -d '{"displayName":"Person A","ageConfirmed":true}'
```

Submit any strictly higher amount. The amount is expressed in cents to avoid floating-point money errors:

```bash
curl -X POST http://localhost:8080/api/auctions/AUCTION_ID/bids \
  -H 'content-type: application/json' \
  -d '{"bidderId":"PARTICIPANT_ID","amountCents":3200,"clientBidId":"browser-generated-uuid"}'
```

- `201` means the bid was accepted and is now the leading price.
- `409` with `reason: "stale_price"` means another bidder got there first or the amount was not higher.
- Retrying the same `clientBidId` returns the original accepted bid instead of inserting a duplicate.

Subscribe to live auction updates:

```ts
const socket = new WebSocket(`${WS_ORIGIN}/ws?auctionId=${auctionId}`);
socket.onmessage = ({ data }) => {
  const event = JSON.parse(data);
  // auction.snapshot | bid.accepted | bid.rejected | auction.updated
};
```

## Frontend integration notes

1. On registration, store the returned `participant.id` in `localStorage`.
2. Fetch `GET /api/auctions/:id` for the initial snapshot.
3. Open the WebSocket after entering an auction detail page.
4. Generate a UUID for each click and send it as `clientBidId`.
5. Optimistically show a submitting state, but treat the server WebSocket / REST response as authoritative.
6. On a `409` stale-price response, refresh the current bid and ask the bidder to choose a new amount.

## Hosting

This backend is designed for a small always-on room. Deploy it to a Node host with a persistent process and WebSocket support. For PostgreSQL, use a managed database such as Supabase Postgres, Neon, or Railway Postgres and set `DATABASE_URL`. Keep the host token server-side and configure the frontend with only the public backend URL.

Before a public event, set:

```env
DATABASE_URL=...
HOST_ADMIN_TOKEN=a-long-random-secret
CORS_ORIGIN=https://your-frontend.example.com
MAX_PARTICIPANTS=20
```

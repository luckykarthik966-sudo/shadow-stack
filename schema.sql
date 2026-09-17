CREATE TABLE IF NOT EXISTS auctions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'live', 'ended')) DEFAULT 'draft',
  current_bid_cents BIGINT NOT NULL DEFAULT 0 CHECK (current_bid_cents >= 0),
  leading_bidder_id TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bids (
  id BIGSERIAL PRIMARY KEY,
  auction_id TEXT NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  bidder_id TEXT NOT NULL,
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  client_bid_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (auction_id, client_bid_id)
);

CREATE INDEX IF NOT EXISTS bids_auction_created_idx ON bids (auction_id, created_at DESC);
CREATE INDEX IF NOT EXISTS auctions_status_ends_idx ON auctions (status, ends_at);

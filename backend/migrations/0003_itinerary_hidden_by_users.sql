CREATE TABLE IF NOT EXISTS itinerary_hidden_by_users (
  itinerary_id uuid NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (itinerary_id, user_id)
);

CREATE INDEX IF NOT EXISTS itinerary_hidden_user_idx
  ON itinerary_hidden_by_users (user_id, created_at);

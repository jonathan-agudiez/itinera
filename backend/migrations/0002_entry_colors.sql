ALTER TABLE itinerary_entries
  ADD COLUMN IF NOT EXISTS color varchar(24) NOT NULL DEFAULT 'sage';

UPDATE itinerary_entries
SET color = 'sage'
WHERE color IS NULL OR color = '';


ALTER TABLE public.gardener_services DROP CONSTRAINT IF EXISTS gardener_services_gardener_id_fkey;
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_gardener_id_fkey;
ALTER TABLE public.gardener_services ADD COLUMN IF NOT EXISTS gardener_name TEXT;
ALTER TABLE public.gardener_services ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) DEFAULT 4.8;

ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

GRANT ALL ON public.booking_requests TO service_role;

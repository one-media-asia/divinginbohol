ALTER TABLE public.booking_requests
ADD COLUMN IF NOT EXISTS paid boolean NOT NULL DEFAULT false;
ALTER TABLE public.booking_requests
ADD COLUMN IF NOT EXISTS paid_at timestamptz NULL;
ALTER TABLE public.booking_requests
ADD COLUMN IF NOT EXISTS payment_reference text NULL;

GRANT ALL ON public.booking_requests TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_requests TO authenticated;

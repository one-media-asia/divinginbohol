ALTER TABLE public.booking_requests
ADD COLUMN IF NOT EXISTS deposit_requested boolean NOT NULL DEFAULT false;

GRANT ALL ON public.booking_requests TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_requests TO authenticated;

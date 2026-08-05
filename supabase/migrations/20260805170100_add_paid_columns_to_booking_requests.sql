-- Add paid status tracking for booking requests
ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS paid boolean NOT NULL DEFAULT false;

ALTER TABLE public.booking_requests
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;

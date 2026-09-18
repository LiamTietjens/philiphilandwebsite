import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Public marketing site for Phillip Island Host.
// Runtime config comes from VITE_* env vars (see .env.example):
//   VITE_LISTINGS_API      — public-listings Edge Function (Guesty-backed)
//   VITE_AVAILABILITY_API  — public-availability Edge Function
//   VITE_GUESTY_BOOKING_URL — base URL of the Guesty Booking Engine
// The app degrades to bundled sample listings without them. Both endpoints
// hold the Guesty OAuth secret server-side (backend/supabase/functions/) —
// it is never sent to this project's build.
export default defineConfig({
  plugins: [react()],
});

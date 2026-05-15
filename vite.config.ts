import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

// Disable Lovable dev badge by preventing sandbox mode
if (!process.env.LOVABLE_DEV_SERVER) {
  process.env.LOVABLE_DEV_SERVER = "false";
}

// Use Nitro's Vercel preset so TanStack Start builds the correct Vercel output.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  plugins: [nitro({ preset: "vercel" })],
});

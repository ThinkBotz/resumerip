import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Disable Lovable dev badge by preventing sandbox mode
if (!process.env.LOVABLE_DEV_SERVER) {
  process.env.LOVABLE_DEV_SERVER = "false";
}

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
});

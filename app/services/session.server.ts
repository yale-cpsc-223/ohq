import { createCookieSessionStorage } from "@remix-run/node"; // or cloudflare/deno

export const sessionStorage = createCookieSessionStorage({
  // a Cookie from `createCookie` or the same CookieOptions to create one
  cookie: {
    name: "__session",
    secrets: [process.env.COOKIE_SECRET!],
    sameSite: "lax",
  },
});

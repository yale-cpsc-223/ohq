import { createCookieSessionStorage } from "@remix-run/node"; // or cloudflare/deno

export type SessionData = {
  user: {
    netId: string;
    firstName: string;
    lastName: string;
    email: string;
    year: number | null;
    role: "student" | "instructor" | "admin";
  };
  // Just the netID, before onboarding
  incumbentUser: string;
};

export const sessionStorage = createCookieSessionStorage<
  SessionData,
  SessionData
>({
  // a Cookie from `createCookie` or the same CookieOptions to create one
  cookie: {
    name: "__session",
    secrets: [process.env.COOKIE_SECRET!],
    sameSite: "lax",
  },
});

import { redirect, type ActionFunction } from "@remix-run/node";
import { sessionStorage } from "~/services/session.server";

export const action: ActionFunction = async ({ request }) => {
  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionStorage.destroySession(
        await sessionStorage.getSession(request.headers.get("cookie")),
      ),
    },
  });
};

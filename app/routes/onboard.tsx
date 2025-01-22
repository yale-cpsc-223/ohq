import { type LoaderFunctionArgs, type ActionFunction } from "@remix-run/node";
import { Form, redirect } from "@remix-run/react";
import { users } from "~/services/db-schema.server";
import { db } from "~/services/db.server";
import { sessionStorage, type SessionData } from "~/services/session.server";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const session = await sessionStorage.getSession(
    request.headers.get("cookie"),
  );
  const incumbentUser = session.get("incumbentUser")!;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const email = formData.get("email") as string;
  const year = formData.get("year") as string;
  const user: SessionData["user"] = {
    netId: incumbentUser,
    firstName,
    lastName,
    email,
    year: year ? parseInt(year, 10) : null,
    role: "student",
  };
  await db.insert(users).values(user);
  session.set("user", user);
  session.unset("incumbentUser");
  return redirect("/", {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(session),
    },
  });
};

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await sessionStorage.getSession(
    request.headers.get("cookie"),
  );
  if (!session.get("incumbentUser")) {
    return redirect("/");
  }
  return null;
}

export default function Onboard() {
  return (
    <Form method="post">
      <p>
        You are here because we can't automatically create a profile for you. We
        just need to ask for some basic information.
      </p>
      <label>
        First Name:
        <input type="text" name="firstName" required />
      </label>
      <label>
        Last Name:
        <input type="text" name="lastName" required />
      </label>
      <label>
        Email (<code>@yale.edu</code> recommended):
        <input type="email" name="email" required />
      </label>
      <label>
        Graduation year (for undergraduates):
        <input type="number" name="year" />
      </label>
      <button type="submit">Submit</button>
    </Form>
  );
}

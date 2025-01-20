import type { MetaFunction, ActionFunction } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { authenticator } from "~/services/auth.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Login" },
    { name: "description", content: "Log in to OHQ" },
  ];
};

export const action: ActionFunction = async ({ request }) => {
  await authenticator.authenticate("cas", request);
  return null;
  // const session = await sessionStorage.getSession(request.headers.get("cookie"));
  // session.set("user", user);
};

export default function Login() {
  return (
    <div>
      <h1>Login</h1>
      <p>
        Hi there! We are happy to see you. Please log in with your Yale NetID.
      </p>
      <Form method="post">
        <button type="submit">Log in</button>
      </Form>
    </div>
  );
}

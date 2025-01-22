import {
  type MetaFunction,
  type ActionFunction,
  type LoaderFunctionArgs,
  redirect,
} from "@remix-run/node";
import { Form } from "@remix-run/react";
import { sessionStorage } from "~/services/session.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Login" },
    { name: "description", content: "Log in to OHQ" },
  ];
};

export const action: ActionFunction = async ({ request }) => {
  const redirectURL = new URL("https://secure.its.yale.edu/cas/login");
  // Copy query parameters from original request.
  redirectURL.search = new URL(request.url).search;
  redirectURL.searchParams.set(
    "service",
    `${process.env.ORIGIN}/login/callback`,
  );
  throw redirect(redirectURL.toString(), 302);
};

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await sessionStorage.getSession(
    request.headers.get("cookie"),
  );
  const user = session.get("user");
  if (user) throw redirect("/");
  return null;
}

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

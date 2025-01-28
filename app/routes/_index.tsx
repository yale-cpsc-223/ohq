import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Link, Form } from "@remix-run/react";
import { db } from "~/services/db.server";
import { sessionStorage } from "~/services/session.server";

export const meta: MetaFunction = () => {
  return [
    { title: "OHQ" },
    { name: "description", content: "Queue your Office Hours" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await sessionStorage.getSession(
    request.headers.get("cookie"),
  );
  const user = session.get("user");
  const courses = await db.query.courses.findMany();
  return { user, courses };
}

export default function Index() {
  const data = useLoaderData<typeof loader>();
  return (
    <div>
      <h1>
        Hello{data.user ? `, ${data.user.firstName} ${data.user.lastName}` : ""}
        !
      </h1>
      {data.user ? (
        <Form method="post" action="/logout">
          <button type="submit">Logout</button>
        </Form>
      ) : (
        <Form method="post" action="/login">
          <button type="submit">Login with CAS</button>
        </Form>
      )}
      <ul>
        {data.courses.map((c) => (
          <li key={c.courseId}>
            <Link to={`/courses/${c.courseId}`}>{c.code}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

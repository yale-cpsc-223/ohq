import type { MetaFunction, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Link } from "@remix-run/react";
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
      <h1>Hello, {data.user}</h1>
      <ul>
        {data.courses.map((c) => (
          <li>
            <Link to={`/courses/${c.courseId}`}>{c.code}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

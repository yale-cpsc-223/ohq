import type { MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Link } from "@remix-run/react";
import { db } from "~/services/db.server";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export async function loader() {
  const courses = await db.query.courses.findMany();
  return { courses };
}

export default function Index() {
  const data = useLoaderData<typeof loader>();
  return (
    <div>
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

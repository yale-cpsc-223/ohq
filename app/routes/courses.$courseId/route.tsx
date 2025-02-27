import { type LoaderFunctionArgs } from "@remix-run/node";
import {
  Link,
  Outlet,
  useLoaderData,
  isRouteErrorResponse,
  useRouteError,
} from "@remix-run/react";
import { eq } from "drizzle-orm";
import { courses } from "~/services/db-schema.server";
import { db } from "~/services/db.server";
import styles from "./styles.module.css";

export async function loader({ params }: LoaderFunctionArgs) {
  const course = await db
    .selectDistinct({
      courseId: courses.courseId,
      code: courses.code,
      season: courses.season,
    })
    .from(courses)
    .where(eq(courses.courseId, params.courseId!));
  if (course.length === 0) {
    throw Response.json({ message: "Course not found" }, { status: 404 });
  }
  return { course: course[0] };
}

export default function CourseHome() {
  const data = useLoaderData<typeof loader>();
  return (
    <div>
      <Link to="/">Home</Link>
      <h1>{data.course.code}</h1>
      <nav className={styles.courseNav}>
        <ul>
          <li>
            <Link to={`/courses/${data.course.courseId}/events`}>Events</Link>
          </li>
          <li>
            <Link to={`/courses/${data.course.courseId}/queue`}>Queue</Link>
          </li>
          <li>
            <Link to={`/courses/${data.course.courseId}/settings`}>
              Settings
            </Link>
          </li>
        </ul>
      </nav>
      <Outlet />
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    switch (error.status) {
      case 404:
        return <h1>Course not found!</h1>;
    }

    return (
      <h1>
        Something went wrong: {error.status} {error.statusText}
      </h1>
    );
  }

  return (
    <h1>
      Something went wrong: {(error as Error)?.message || "Unknown Error"}
    </h1>
  );
}

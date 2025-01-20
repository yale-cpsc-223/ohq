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
      <h1>{data.course.code}</h1>
      <Link to={`/courses/${data.course.courseId}/events`}>Events</Link>
      <Outlet />
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    switch (error.status) {
      case 404:
        return <div>Course not found!</div>;
    }

    return (
      <div>
        Something went wrong: {error.status} {error.statusText}
      </div>
    );
  }

  return (
    <div>
      Something went wrong: {(error as Error)?.message || "Unknown Error"}
    </div>
  );
}

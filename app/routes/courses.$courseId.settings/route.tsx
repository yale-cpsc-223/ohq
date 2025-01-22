import type { LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { eq } from "drizzle-orm";
import { ohSessions } from "~/services/db-schema.server";
import { db } from "~/services/db.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const sessions = await db
    .select({
      eventId: ohSessions.eventId,
      startTime: ohSessions.startTime,
      endTime: ohSessions.endTime,
    })
    .from(ohSessions)
    .where(eq(ohSessions.courseId, params.courseId!));
  return { courseId: params.courseId!, sessions };
}

export default function CourseHome() {
  const data = useLoaderData<typeof loader>();
  return (
    <ul>
      {data.sessions.map((session) => (
        <li key={session.eventId}>
          <Link to={`/courses/${data.courseId}/events/${session.eventId}`}>
            {session.startTime.toLocaleString()} –{" "}
            {session.endTime.toLocaleString()}
          </Link>
        </li>
      ))}
    </ul>
  );
}

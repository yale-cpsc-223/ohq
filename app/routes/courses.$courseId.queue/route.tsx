import { type LoaderFunctionArgs } from "@remix-run/node";
import {
  useLoaderData,
  isRouteErrorResponse,
  useRouteError,
} from "@remix-run/react";
import { eq } from "drizzle-orm";
import { ohSessionQueue } from "~/services/db-schema.server";
import { db } from "~/services/db.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const queue = await db
    .selectDistinct({
      netId: ohSessionQueue.netId,
      problem: ohSessionQueue.problem,
      notes: ohSessionQueue.notes,
      joinTime: ohSessionQueue.joinTime,
    })
    .from(ohSessionQueue)
    .where(eq(ohSessionQueue.courseId, params.courseId!));
  return { queue };
}

export default function CourseQueue() {
  const data = useLoaderData<typeof loader>();
  return data.queue.length ? (
    <ul>
      {data.queue.map((entry) => (
        <li key={entry.netId}>
          <h2>{entry.netId}</h2>
          <p>{entry.problem}</p>
          <p>{entry.notes}</p>
          <p>{entry.joinTime.toTemporalInstant().toLocaleString()}</p>
        </li>
      ))}
    </ul>
  ) : (
    <b>No one in the queue!</b>
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

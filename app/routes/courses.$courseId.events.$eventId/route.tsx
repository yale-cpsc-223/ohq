import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { eq } from "drizzle-orm";
import { db } from "~/services/db.server";
import { ohSessionQueue } from "~/services/db-schema.server";

export async function loader({ params }: LoaderFunctionArgs) {
  const queue = await db
    .select()
    .from(ohSessionQueue)
    .where(eq(ohSessionQueue.eventId, params.eventId!))
    .orderBy(ohSessionQueue.joinTime);
  return { queue };
}

export default function EventLanding() {
  const data = useLoaderData<typeof loader>();
  return (
    <ul>
      {data.queue.map((q) => (
        <li key={q.netId}>{JSON.stringify(q)}</li>
      ))}
    </ul>
  );
}

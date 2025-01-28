import { useState } from "react";
import { type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Link, useLoaderData, useSearchParams } from "@remix-run/react";
import { Temporal } from "temporal-polyfill";
import { eq, and, gte } from "drizzle-orm";
import Calendar from "./Calendar";

import { ohSessions } from "~/services/db-schema.server";
import { db } from "~/services/db.server";
import { sessionStorage } from "~/services/session.server";

export async function loader({ params, request }: LoaderFunctionArgs) {
  const session = await sessionStorage.getSession(
    request.headers.get("cookie"),
  );
  const user = session.get("user");
  if (!user) return redirect("/");
  const startDateQuery = new URL(request.url).searchParams.get("startDate");
  const startDate = startDateQuery
    ? Temporal.Instant.from(startDateQuery)
    : Temporal.Now.zonedDateTimeISO(user.timeZone).startOfDay();
  const sessions = await db
    .select({
      eventId: ohSessions.eventId,
      startTime: ohSessions.startTime,
      endTime: ohSessions.endTime,
      location: ohSessions.location,
    })
    .from(ohSessions)
    .where(
      and(
        gte(ohSessions.startTime, new Date(startDate.epochMilliseconds)),
        eq(ohSessions.courseId, params.courseId!),
      ),
    )
    .orderBy(ohSessions.startTime);
  return { timeZone: user.timeZone, courseId: params.courseId!, sessions };
}

export default function CourseHome() {
  const data = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const today = Temporal.Now.plainDateISO(data.timeZone);
  const [startDate, setStartDate] = useState(today);
  const sessions = data.sessions.map((s) => ({
    ...s,
    startTime: s.startTime
      .toTemporalInstant()
      .toZonedDateTimeISO(data.timeZone),
    endTime: s.endTime.toTemporalInstant().toZonedDateTimeISO(data.timeZone),
  }));
  return (
    <Calendar
      events={sessions}
      startDate={startDate}
      setStartDate={(newDate) => {
        setStartDate(newDate);
        if (newDate.equals(today)) {
          setSearchParams({});
        } else {
          setSearchParams({
            startDate: newDate
              .toZonedDateTime({ timeZone: data.timeZone })
              .toInstant()
              .toString(),
          });
        }
      }}
    />
  );
}

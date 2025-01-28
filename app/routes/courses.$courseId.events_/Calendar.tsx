import { Link } from "@remix-run/react";
import { Temporal } from "temporal-polyfill";
import styles from "./Calendar.module.css";

type CalendarEvent = {
  readonly eventId: string;
  readonly startTime: Temporal.ZonedDateTime;
  readonly endTime: Temporal.ZonedDateTime;
  readonly location: string;
};

export default function Calendar({
  events,
  startDate,
  setStartDate,
}: {
  readonly events: CalendarEvent[];
  readonly startDate: Temporal.PlainDate;
  readonly setStartDate: (date: Temporal.PlainDate) => void;
}) {
  const days = new Map<string, CalendarEvent[]>();
  for (let i = 0; i < startDate.daysInWeek; i++) {
    const date = startDate.add({ days: i });
    days.set(date.toString(), []);
  }
  for (const event of events) {
    const date = event.startTime.toPlainDate().toString();
    if (days.has(date)) {
      days.get(date)!.push(event);
    }
  }
  const dayLength = 24 * 60;
  const days2 = [...days].map(
    ([date, events]) => [Temporal.PlainDate.from(date), events] as const,
  );
  return (
    <div className={styles.container}>
      <button
        type="button"
        onClick={() =>
          setStartDate(startDate.subtract({ days: startDate.daysInWeek }))
        }>
        Previous week
      </button>
      <button
        type="button"
        onClick={() =>
          setStartDate(startDate.add({ days: startDate.daysInWeek }))
        }>
        Next week
      </button>
      <ul className={styles.calendar}>
        {days2.map(([date, events]) => (
          <li key={date.toString()} className={styles.calendarDayCol}>
            <div className={styles.calendarDayHeader}>
              <h2>{date.day}</h2>
              <div>{date.toLocaleString("en-US", { weekday: "short" })}</div>
            </div>
            <ul className={styles.calendarDayEvents}>
              {events.map((event) => (
                <li
                  key={event.eventId}
                  className={styles.calendarEvent}
                  style={{
                    top: `${(event.startTime.toPlainTime().since("00:00").total("minutes") / dayLength) * 100}%`,
                    height: `${(event.startTime.until(event.endTime).total("minutes") / dayLength) * 100}%`,
                  }}>
                  <Link to={event.eventId} className={styles.calendarEventBody}>
                    <time>
                      {event.startTime
                        .toPlainTime()
                        .toString({ smallestUnit: "minutes" })}
                    </time>
                    –
                    <time>
                      {event.endTime
                        .toPlainTime()
                        .toString({ smallestUnit: "minutes" })}
                    </time>
                    <div>
                      <strong>{event.location}</strong>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

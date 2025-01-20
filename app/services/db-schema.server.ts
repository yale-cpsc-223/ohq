import { relations } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  text,
  primaryKey,
  timestamp,
} from "drizzle-orm/pg-core";

export const courses = pgTable("courses", {
  courseId: text().notNull().primaryKey(),
  season: text().notNull(),
  code: text().notNull(),
});

export const coursesRelations = relations(courses, ({ many }) => ({
  courseUsers: many(courseUsers),
  ohSessions: many(ohSession),
}));

export const users = pgTable("users", {
  netId: text().notNull().primaryKey(),
  name: text().notNull(),
  email: text().notNull(),
  year: integer().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  courseUsers: many(courseUsers),
}));

export const roleEnum = pgEnum("role", ["student", "ula", "instructor"]);

export const courseUsers = pgTable(
  "courseUsers",
  {
    courseId: text()
      .notNull()
      .references(() => courses.courseId),
    netId: text()
      .notNull()
      .references(() => users.netId),
    role: roleEnum(),
  },
  (t) => [primaryKey({ columns: [t.courseId, t.netId] })],
);

export const courseUsersRelations = relations(courseUsers, ({ one }) => ({
  course: one(courses),
  user: one(users),
}));

export const ohSession = pgTable("ohSession", {
  courseId: text()
    .notNull()
    .references(() => courses.courseId),
  eventId: text().notNull().primaryKey(),
  startTime: timestamp().notNull(),
  endTime: timestamp().notNull(),
});

export const ohSessionRelations = relations(ohSession, ({ one }) => ({
  course: one(courses),
}));

export const ohSessionQueue = pgTable(
  "ohSessionQueue",
  {
    eventId: text()
      .notNull()
      .references(() => ohSession.eventId),
    netId: text()
      .notNull()
      .references(() => users.netId),
    problem: text().notNull(),
    joinTime: timestamp().notNull(),
  },
  (t) => [primaryKey({ columns: [t.eventId, t.netId] })],
);

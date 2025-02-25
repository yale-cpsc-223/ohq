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
  entryCode: text().notNull(),
});

export const coursesRelations = relations(courses, ({ one, many }) => ({
  queue: one(ohSessionQueue),
  courseUsers: many(courseUsers),
  ohSessions: many(ohSessions),
}));

export const userRoleEnum = pgEnum("userRole", [
  "student",
  "instructor",
  "admin",
]);

export const users = pgTable("users", {
  netId: text().notNull().primaryKey(),
  firstName: text().notNull(),
  lastName: text().notNull(),
  email: text().notNull(),
  year: integer(),
  timeZone: text().default("America/New_York").notNull(),
  role: userRoleEnum().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  courseUsers: many(courseUsers),
}));

export const courseRoleEnum = pgEnum("courseRole", [
  "student",
  "ula",
  "instructor",
]);

export const courseUsers = pgTable(
  "courseUsers",
  {
    courseId: text()
      .notNull()
      .references(() => courses.courseId),
    netId: text()
      .notNull()
      .references(() => users.netId),
    role: courseRoleEnum(),
  },
  (t) => [primaryKey({ columns: [t.courseId, t.netId] })],
);

export const courseUsersRelations = relations(courseUsers, ({ one }) => ({
  course: one(courses),
  user: one(users),
}));

export const ohSessions = pgTable("ohSessions", {
  courseId: text()
    .notNull()
    .references(() => courses.courseId),
  helper: text()
    .notNull()
    .references(() => users.netId),
  eventId: text().notNull().primaryKey(),
  startTime: timestamp().notNull(),
  endTime: timestamp().notNull(),
  location: text().notNull(),
});

export const ohSessionsRelations = relations(ohSessions, ({ one, many }) => ({
  course: one(courses),
}));

export const ohSessionQueue = pgTable(
  "ohSessionQueue",
  {
    courseId: text()
      .notNull()
      .references(() => courses.courseId),
    netId: text()
      .notNull()
      .references(() => users.netId),
    problem: text().notNull(),
    notes: text(),
    joinTime: timestamp().notNull(),
  },
  (t) => [primaryKey({ columns: [t.courseId, t.netId] })],
);

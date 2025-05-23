import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Podcasts table
export const podcasts = pgTable("podcasts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  host: text("host").notNull(),
  category: text("category").notNull(),
  coverImageUrl: text("cover_image_url"),
  listenerCount: integer("listener_count").default(0),
  website: text("website"),
  contactEmail: text("contact_email"),
  averageRating: real("average_rating").default(0),
  status: text("status").default("active"), // active, inactive, pending
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Podcast bookings/applications
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  podcastId: integer("podcast_id").notNull().references(() => podcasts.id),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, completed
  pitchAngle: text("pitch_angle"),
  mediaKitUrl: text("media_kit_url"),
  questionnaire: jsonb("questionnaire"), // Store questionnaire responses as JSON
  scheduledDate: timestamp("scheduled_date"),
  recordingDate: timestamp("recording_date"),
  publishDate: timestamp("publish_date"),
  episodeUrl: text("episode_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User questionnaire responses
export const questionnaireResponses = pgTable("questionnaire_responses", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  responses: jsonb("responses").notNull(), // Store all questionnaire data as JSON
  completedAt: timestamp("completed_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Media kits
export const mediaKits = pgTable("media_kits", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  bio: text("bio"),
  expertise: text("expertise").array(),
  achievements: text("achievements").array(),
  previousMedia: jsonb("previous_media"), // Array of media appearances
  websiteUrl: text("website_url"),
  socialLinks: jsonb("social_links"), // Object with platform: url pairs
  headshots: text("headshots").array(), // Array of image URLs
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campaign tracking
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  targetAudience: text("target_audience"),
  goals: text("goals").array(),
  budget: integer("budget"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  status: text("status").default("active"), // active, completed, paused
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  questionnaireResponses: many(questionnaireResponses),
  mediaKits: many(mediaKits),
  campaigns: many(campaigns),
}));

export const podcastsRelations = relations(podcasts, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  podcast: one(podcasts, {
    fields: [bookings.podcastId],
    references: [podcasts.id],
  }),
}));

export const questionnaireResponsesRelations = relations(questionnaireResponses, ({ one }) => ({
  user: one(users, {
    fields: [questionnaireResponses.userId],
    references: [users.id],
  }),
}));

export const mediaKitsRelations = relations(mediaKits, ({ one }) => ({
  user: one(users, {
    fields: [mediaKits.userId],
    references: [users.id],
  }),
}));

export const campaignsRelations = relations(campaigns, ({ one }) => ({
  user: one(users, {
    fields: [campaigns.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertPodcastSchema = createInsertSchema(podcasts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuestionnaireResponseSchema = createInsertSchema(questionnaireResponses).omit({
  id: true,
  completedAt: true,
  updatedAt: true,
});

export const insertMediaKitSchema = createInsertSchema(mediaKits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Podcast = typeof podcasts.$inferSelect;
export type InsertPodcast = z.infer<typeof insertPodcastSchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type QuestionnaireResponse = typeof questionnaireResponses.$inferSelect;
export type InsertQuestionnaireResponse = z.infer<typeof insertQuestionnaireResponseSchema>;
export type MediaKit = typeof mediaKits.$inferSelect;
export type InsertMediaKit = z.infer<typeof insertMediaKitSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

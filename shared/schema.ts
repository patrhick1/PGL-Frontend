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
  uuid,
  date,
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
// PGL Media/Podcast table - matches your PGL backend system
export const podcasts = pgTable("podcasts", {
  id: serial("media_id").primaryKey(),
  name: text("name"),
  title: text("title"),
  status: text("status").default("active"),
  rssUrl: text("rss_url"),
  rssFeedUrl: text("rss_feed_url"),
  website: text("website"),
  description: text("description"),
  aiDescription: text("ai_description"),
  contactEmail: text("contact_email"),
  language: text("language"),
  category: text("category"),
  imageUrl: text("image_url"),
  
  // Company and stats
  companyId: integer("company_id"),
  avgDownloads: integer("avg_downloads"),
  audienceSize: integer("audience_size"),
  totalEpisodes: integer("total_episodes"),
  
  // Platform IDs
  itunesId: text("itunes_id"),
  spotifyId: text("podcast_spotify_id"),
  
  // Ratings and scores
  listenScore: real("listen_score"),
  listenScoreGlobalRank: integer("listen_score_global_rank"),
  itunesRatingAverage: real("itunes_rating_average"),
  itunesRatingCount: integer("itunes_rating_count"),
  spotifyRatingAverage: real("spotify_rating_average"),
  spotifyRatingCount: integer("spotify_rating_count"),
  
  // Status fields
  fetchedEpisodes: boolean("fetched_episodes").default(false),
  sourceApi: text("source_api"), // "ListenNotes", "PodscanFM", "Mixed"
  apiId: text("api_id"),
  listenerCount: integer("listener_count"),
  
  // Dates
  lastPostedAt: timestamp("last_posted_at"),
  
  // Social media links
  twitterUrl: text("podcast_twitter_url"),
  linkedinUrl: text("podcast_linkedin_url"),
  instagramUrl: text("podcast_instagram_url"),
  facebookUrl: text("podcast_facebook_url"),
  youtubeUrl: text("podcast_youtube_url"),
  tiktokUrl: text("podcast_tiktok_url"),
  otherSocialUrl: text("podcast_other_social_url"),
  
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

// PGL Campaigns table - matches your PGL backend system
export const campaigns = pgTable("campaigns", {
  id: uuid("campaign_id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  attioClientId: uuid("attio_client_id"),
  campaignName: text("campaign_name").notNull(),
  campaignType: text("campaign_type"),
  campaignBio: text("campaign_bio"), // Link to GDoc or text
  campaignAngles: text("campaign_angles"), // Link to GDoc or text
  campaignKeywords: text("campaign_keywords").array(), // TEXT[] array
  compiledSocialPosts: text("compiled_social_posts"), // Link to GDoc or text
  podcastTranscriptLink: text("podcast_transcript_link"), // Link to GDoc
  compiledArticlesLink: text("compiled_articles_link"), // Link to GDoc
  mockInterviewTranscript: text("mock_interview_transcript"), // Link to GDoc or text
  startDate: date("start_date"),
  endDate: date("end_date"),
  goalNote: text("goal_note"),
  mediaKitUrl: text("media_kit_url"),
  status: text("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// PGL Match Suggestions table - podcast discovery matches
export const matchSuggestions = pgTable("match_suggestions", {
  id: serial("match_id").primaryKey(),
  campaignId: uuid("campaign_id").notNull().references(() => campaigns.id),
  mediaId: integer("media_id").notNull().references(() => podcasts.id),
  matchScore: real("match_score"),
  matchedKeywords: text("matched_keywords").array(), // TEXT[] array
  aiReasoning: text("ai_reasoning"),
  status: text("status").default("pending"), // pending, approved, rejected
  clientApproved: boolean("client_approved").default(false),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
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

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  user: one(users, {
    fields: [campaigns.userId],
    references: [users.id],
  }),
  matchSuggestions: many(matchSuggestions),
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

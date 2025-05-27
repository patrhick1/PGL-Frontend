import {
  users,
  podcasts,
  bookings,
  questionnaireResponses,
  mediaKits,
  campaigns,
  type User,
  type UpsertUser,
  type Podcast,
  type InsertPodcast,
  type Booking,
  type InsertBooking,
  type QuestionnaireResponse,
  type InsertQuestionnaireResponse,
  type MediaKit,
  type InsertMediaKit,
  type Campaign,
  type InsertCampaign,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Podcast operations
  getPodcasts(filters?: { category?: string; search?: string }): Promise<Podcast[]>;
  getPodcast(id: number): Promise<Podcast | undefined>;
  createPodcast(podcast: InsertPodcast): Promise<Podcast>;
  updatePodcast(id: number, podcast: Partial<InsertPodcast>): Promise<Podcast>;

  // Booking operations
  getUserBookings(userId: string): Promise<(Booking & { podcast: Podcast })[]>;
  getBooking(id: number): Promise<(Booking & { podcast: Podcast }) | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, booking: Partial<InsertBooking>): Promise<Booking>;

  // Questionnaire operations
  getUserQuestionnaire(userId: string): Promise<QuestionnaireResponse | undefined>;
  upsertQuestionnaire(questionnaire: InsertQuestionnaireResponse): Promise<QuestionnaireResponse>;

  // Media Kit operations
  getUserMediaKits(userId: string): Promise<MediaKit[]>;
  getMediaKit(id: number): Promise<MediaKit | undefined>;
  createMediaKit(mediaKit: InsertMediaKit): Promise<MediaKit>;
  updateMediaKit(id: number, mediaKit: Partial<InsertMediaKit>): Promise<MediaKit>;

  // Campaign operations
  getUserCampaigns(userId: string): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, campaign: Partial<InsertCampaign>): Promise<Campaign>;

  // Dashboard stats
  getUserStats(userId: string): Promise<{
    activeCampaigns: number;
    approvedBookings: number;
    pendingReview: number;
    successRate: number;
  }>;

  // Admin client management
  getAllClients(): Promise<User[]>;
  createClient(clientData: any): Promise<User>;
  deleteClient(clientId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Podcast operations
  async getPodcasts(filters?: { category?: string; search?: string }): Promise<Podcast[]> {
    let whereConditions = [eq(podcasts.status, "active")];

    if (filters?.category) {
      whereConditions.push(eq(podcasts.category, filters.category));
    }

    if (filters?.search) {
      whereConditions.push(ilike(podcasts.name, `%${filters.search}%`));
    }

    return await db.select().from(podcasts)
      .where(and(...whereConditions));
  }

  async getPodcast(id: number): Promise<Podcast | undefined> {
    const [podcast] = await db.select().from(podcasts).where(eq(podcasts.id, id));
    return podcast;
  }

  async createPodcast(podcast: InsertPodcast): Promise<Podcast> {
    const [newPodcast] = await db.insert(podcasts).values(podcast).returning();
    return newPodcast;
  }

  async updatePodcast(id: number, podcast: Partial<InsertPodcast>): Promise<Podcast> {
    const [updatedPodcast] = await db
      .update(podcasts)
      .set({ ...podcast, updatedAt: new Date() })
      .where(eq(podcasts.id, id))
      .returning();
    return updatedPodcast;
  }

  // Booking operations
  async getUserBookings(userId: string): Promise<(Booking & { podcast: Podcast })[]> {
    const result = await db
      .select()
      .from(bookings)
      .innerJoin(podcasts, eq(bookings.podcastId, podcasts.id))
      .where(eq(bookings.userId, userId))
      .orderBy(desc(bookings.createdAt));

    return result.map(row => ({
      ...row.bookings,
      podcast: row.podcasts
    }));
  }

  async getBooking(id: number): Promise<(Booking & { podcast: Podcast }) | undefined> {
    const [result] = await db
      .select()
      .from(bookings)
      .innerJoin(podcasts, eq(bookings.podcastId, podcasts.id))
      .where(eq(bookings.id, id));

    if (!result) return undefined;

    return {
      ...result.bookings,
      podcast: result.podcasts
    };
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(booking).returning();
    return newBooking;
  }

  async updateBooking(id: number, booking: Partial<InsertBooking>): Promise<Booking> {
    const [updatedBooking] = await db
      .update(bookings)
      .set({ ...booking, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking;
  }

  // Questionnaire operations
  async getUserQuestionnaire(userId: string): Promise<QuestionnaireResponse | undefined> {
    const [questionnaire] = await db
      .select()
      .from(questionnaireResponses)
      .where(eq(questionnaireResponses.userId, userId))
      .orderBy(desc(questionnaireResponses.updatedAt));
    return questionnaire;
  }

  async upsertQuestionnaire(questionnaire: InsertQuestionnaireResponse): Promise<QuestionnaireResponse> {
    const existing = await this.getUserQuestionnaire(questionnaire.userId);
    
    if (existing) {
      const [updated] = await db
        .update(questionnaireResponses)
        .set({ ...questionnaire, updatedAt: new Date() })
        .where(eq(questionnaireResponses.userId, questionnaire.userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(questionnaireResponses)
        .values(questionnaire)
        .returning();
      return created;
    }
  }

  // Media Kit operations
  async getUserMediaKits(userId: string): Promise<MediaKit[]> {
    return await db
      .select()
      .from(mediaKits)
      .where(eq(mediaKits.userId, userId))
      .orderBy(desc(mediaKits.updatedAt));
  }

  async getMediaKit(id: number): Promise<MediaKit | undefined> {
    const [mediaKit] = await db.select().from(mediaKits).where(eq(mediaKits.id, id));
    return mediaKit;
  }

  async createMediaKit(mediaKit: InsertMediaKit): Promise<MediaKit> {
    const [newMediaKit] = await db.insert(mediaKits).values(mediaKit).returning();
    return newMediaKit;
  }

  async updateMediaKit(id: number, mediaKit: Partial<InsertMediaKit>): Promise<MediaKit> {
    const [updatedMediaKit] = await db
      .update(mediaKits)
      .set({ ...mediaKit, updatedAt: new Date() })
      .where(eq(mediaKits.id, id))
      .returning();
    return updatedMediaKit;
  }

  // Campaign operations
  async getUserCampaigns(userId: string): Promise<Campaign[]> {
    return await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.userId, userId))
      .orderBy(desc(campaigns.createdAt));
  }

  async createCampaign(campaign: InsertCampaign): Promise<Campaign> {
    const campaignData = {
      ...campaign,
      id: crypto.randomUUID()
    };
    const [newCampaign] = await db.insert(campaigns).values(campaignData).returning();
    return newCampaign;
  }

  async updateCampaign(id: string, campaign: Partial<InsertCampaign>): Promise<Campaign> {
    const [updatedCampaign] = await db
      .update(campaigns)
      .set({ ...campaign, updatedAt: new Date() })
      .where(eq(campaigns.id, id))
      .returning();
    return updatedCampaign;
  }

  // Dashboard stats
  async getUserStats(userId: string): Promise<{
    activeCampaigns: number;
    approvedBookings: number;
    pendingReview: number;
    successRate: number;
  }> {
    // Get active campaigns count
    const [activeCampaignsResult] = await db
      .select({ count: count() })
      .from(campaigns)
      .where(and(eq(campaigns.userId, userId), eq(campaigns.status, "active")));

    // Get approved bookings count
    const [approvedBookingsResult] = await db
      .select({ count: count() })
      .from(bookings)
      .where(and(eq(bookings.userId, userId), eq(bookings.status, "approved")));

    // Get pending review count
    const [pendingReviewResult] = await db
      .select({ count: count() })
      .from(bookings)
      .where(and(eq(bookings.userId, userId), eq(bookings.status, "pending")));

    // Calculate success rate
    const [totalBookingsResult] = await db
      .select({ count: count() })
      .from(bookings)
      .where(eq(bookings.userId, userId));

    const successRate = totalBookingsResult.count > 0 
      ? Math.round((approvedBookingsResult.count / totalBookingsResult.count) * 100)
      : 0;

    return {
      activeCampaigns: activeCampaignsResult.count,
      approvedBookings: approvedBookingsResult.count,
      pendingReview: pendingReviewResult.count,
      successRate,
    };
  }

  // Admin client management
  async getAllClients(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async createClient(clientData: any): Promise<User> {
    const userData = {
      id: `client_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      email: clientData.email,
      firstName: clientData.firstName,
      lastName: clientData.lastName,
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async deleteClient(clientId: string): Promise<void> {
    await db.delete(users).where(eq(users.id, clientId));
  }
}

export const storage = new DatabaseStorage();


import { db } from "./db";
import { podcasts, campaigns, bookings, users } from "@shared/schema";

export const seedMockData = async () => {
  try {
    // Check if data already exists
    const existingPodcasts = await db.select().from(podcasts).limit(1);
    if (existingPodcasts.length > 0) {
      console.log("Mock data already exists, skipping seed...");
      return;
    }

    // Insert mock podcasts
    const mockPodcasts = await db.insert(podcasts).values([
      {
        name: "The Tim Ferriss Show",
        description: "Tim Ferriss interviews world-class performers from eclectic areas",
        category: "Business",
        status: "active",
        audienceSize: 1000000,
        avgDownloads: 500000,
        totalEpisodes: 700,
        contactEmail: "contact@tim.blog",
        website: "https://tim.blog/podcast",
        imageUrl: "https://example.com/tim-ferriss.jpg",
        listenScore: 85,
      },
      {
        name: "How I Built This",
        description: "Guy Raz interviews entrepreneurs about how they built their companies",
        category: "Business",
        status: "active",
        audienceSize: 800000,
        avgDownloads: 400000,
        totalEpisodes: 500,
        contactEmail: "contact@npr.org",
        website: "https://www.npr.org/series/490248027/how-i-built-this",
        imageUrl: "https://example.com/how-i-built-this.jpg",
        listenScore: 90,
      },
      {
        name: "Masters of Scale",
        description: "Reid Hoffman shows how companies grow from zero to a gazillion",
        category: "Business",
        status: "active",
        audienceSize: 600000,
        avgDownloads: 300000,
        totalEpisodes: 200,
        contactEmail: "contact@mastersofscale.com",
        website: "https://mastersofscale.com",
        imageUrl: "https://example.com/masters-of-scale.jpg",
        listenScore: 88,
      }
    ]).returning();

    console.log(`Seeded ${mockPodcasts.length} mock podcasts`);
  } catch (error) {
    console.error("Error seeding mock data:", error);
  }
};

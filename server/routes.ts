import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertPodcastSchema, 
  insertBookingSchema, 
  insertQuestionnaireResponseSchema,
  insertMediaKitSchema,
  insertCampaignSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Podcast routes
  app.get('/api/podcasts', isAuthenticated, async (req, res) => {
    try {
      const { category, search } = req.query;
      const podcasts = await storage.getPodcasts({
        category: category as string,
        search: search as string,
      });
      res.json(podcasts);
    } catch (error) {
      console.error("Error fetching podcasts:", error);
      res.status(500).json({ message: "Failed to fetch podcasts" });
    }
  });

  app.get('/api/podcasts/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const podcast = await storage.getPodcast(id);
      if (!podcast) {
        return res.status(404).json({ message: "Podcast not found" });
      }
      res.json(podcast);
    } catch (error) {
      console.error("Error fetching podcast:", error);
      res.status(500).json({ message: "Failed to fetch podcast" });
    }
  });

  app.post('/api/podcasts', isAuthenticated, async (req, res) => {
    try {
      const podcastData = insertPodcastSchema.parse(req.body);
      const podcast = await storage.createPodcast(podcastData);
      res.status(201).json(podcast);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid podcast data", errors: error.errors });
      }
      console.error("Error creating podcast:", error);
      res.status(500).json({ message: "Failed to create podcast" });
    }
  });

  // Booking routes
  app.get('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookings = await storage.getUserBookings(userId);
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get('/api/bookings/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const booking = await storage.getBooking(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }
      res.json(booking);
    } catch (error) {
      console.error("Error fetching booking:", error);
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  app.post('/api/bookings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const bookingData = insertBookingSchema.parse({ ...req.body, userId });
      const booking = await storage.createBooking(bookingData);
      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid booking data", errors: error.errors });
      }
      console.error("Error creating booking:", error);
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.patch('/api/bookings/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const booking = await storage.updateBooking(id, updateData);
      res.json(booking);
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  // Questionnaire routes
  app.get('/api/questionnaire', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const questionnaire = await storage.getUserQuestionnaire(userId);
      res.json(questionnaire || null);
    } catch (error) {
      console.error("Error fetching questionnaire:", error);
      res.status(500).json({ message: "Failed to fetch questionnaire" });
    }
  });

  app.post('/api/questionnaire', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const questionnaireData = insertQuestionnaireResponseSchema.parse({ ...req.body, userId });
      const questionnaire = await storage.upsertQuestionnaire(questionnaireData);
      res.json(questionnaire);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid questionnaire data", errors: error.errors });
      }
      console.error("Error saving questionnaire:", error);
      res.status(500).json({ message: "Failed to save questionnaire" });
    }
  });

  // Media Kit routes
  app.get('/api/media-kits', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const mediaKits = await storage.getUserMediaKits(userId);
      res.json(mediaKits);
    } catch (error) {
      console.error("Error fetching media kits:", error);
      res.status(500).json({ message: "Failed to fetch media kits" });
    }
  });

  app.get('/api/media-kits/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const mediaKit = await storage.getMediaKit(id);
      if (!mediaKit) {
        return res.status(404).json({ message: "Media kit not found" });
      }
      res.json(mediaKit);
    } catch (error) {
      console.error("Error fetching media kit:", error);
      res.status(500).json({ message: "Failed to fetch media kit" });
    }
  });

  app.post('/api/media-kits', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const mediaKitData = insertMediaKitSchema.parse({ ...req.body, userId });
      const mediaKit = await storage.createMediaKit(mediaKitData);
      res.status(201).json(mediaKit);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid media kit data", errors: error.errors });
      }
      console.error("Error creating media kit:", error);
      res.status(500).json({ message: "Failed to create media kit" });
    }
  });

  app.patch('/api/media-kits/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const mediaKit = await storage.updateMediaKit(id, updateData);
      res.json(mediaKit);
    } catch (error) {
      console.error("Error updating media kit:", error);
      res.status(500).json({ message: "Failed to update media kit" });
    }
  });

  // Campaign routes
  app.get('/api/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaigns = await storage.getUserCampaigns(userId);
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  });

  app.post('/api/campaigns', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const campaignData = insertCampaignSchema.parse({ ...req.body, userId });
      const campaign = await storage.createCampaign(campaignData);
      res.status(201).json(campaign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid campaign data", errors: error.errors });
      }
      console.error("Error creating campaign:", error);
      res.status(500).json({ message: "Failed to create campaign" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Admin routes for client management
  app.get('/api/admin/clients', isAuthenticated, async (req, res) => {
    try {
      const clients = await storage.getAllClients();
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.post('/api/admin/clients', isAuthenticated, async (req, res) => {
    try {
      const clientData = req.body;
      const client = await storage.createClient(clientData);
      res.json(client);
    } catch (error) {
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.delete('/api/admin/clients/:id', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteClient(id);
      res.json({ message: "Client deleted successfully" });
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

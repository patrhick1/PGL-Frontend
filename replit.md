# PGL Podcast Outreach System

## Overview

This is a full-stack web application built for PGL (Podcast Guest Lead generation) that automates podcast discovery, vetting, and outreach for clients. The system uses AI-powered matching to connect clients with relevant podcast opportunities and streamlines the entire podcast booking workflow.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Build Tool**: Vite for development and production builds
- **Authentication**: Cookie-based session management

### Backend Architecture
- **Framework**: FastAPI (Python) - inferred from API patterns
- **Authentication**: Session-based with OAuth-style token handling
- **API Design**: RESTful endpoints with comprehensive error handling
- **Real-time Features**: WebSocket notifications for live updates

### Key Design Decisions
- **Monorepo Structure**: Client and server code organized in separate directories with shared TypeScript interfaces
- **Component-First UI**: Extensive use of reusable shadcn/ui components for consistent design
- **Role-Based Access Control**: Different interfaces for clients, staff, and admin users
- **Progressive Enhancement**: Features like real-time notifications are optional and gracefully degrade

## Key Components

### User Management
- Multi-role system (client, staff, admin)
- Profile management with social media links
- Public media kit generation with custom slugs
- Password reset and signup flows

### Campaign Management
- Campaign creation and editing for clients
- AI-powered bio and angle generation
- Questionnaire system for client onboarding
- Media kit builder with image upload support

### Podcast Discovery & Matching
- Automated podcast discovery via external APIs
- AI-powered vetting and scoring system
- Match suggestion workflow with approval process
- Discovery progress tracking with real-time updates

### Content Generation
- AI-generated pitch templates
- Customizable pitch outreach system
- Bio and talking points generation
- Media kit creation with multiple themes

### Workflow Management
- Review task system for staff approvals
- Placement tracking throughout the booking process
- Progress funnels for campaign performance
- Notification system for status updates

## Data Flow

1. **Client Onboarding**: Users complete questionnaire → AI generates bio/angles → Media kit created
2. **Discovery**: Keywords trigger podcast search → AI vetting → Match suggestions generated
3. **Approval Workflow**: Staff review matches → Client approves final selections → Pitches sent
4. **Tracking**: Placement status tracked from initial contact to live recording
5. **Analytics**: Campaign performance measured through conversion funnels

## External Dependencies

### Frontend Dependencies
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **Form Management**: React Hook Form with Zod validation
- **Data Fetching**: TanStack Query for API state management
- **Animation**: Framer Motion for UI transitions
- **Date Handling**: date-fns for date manipulation
- **File Upload**: Custom image upload component

### Backend Integrations (Inferred)
- **Podcast APIs**: Listen Notes and PodScan for discovery
- **AI Services**: OpenAI or similar for content generation
- **Document Storage**: Google Docs integration for bio/angle storage
- **Real-time Communication**: WebSocket support for notifications

## Deployment Strategy

- **Platform**: Replit-optimized with autoscale deployment
- **Build Process**: Vite builds static assets to `dist/public`
- **Serving**: Frontend served as static files, API proxied through Vite dev server
- **Environment**: Node.js 20 runtime with web module support
- **Port Configuration**: Application runs on port 5000, exposed on port 80

### Development Workflow
- Hot reload enabled for rapid development
- TypeScript checking without emit for faster builds
- Path aliases configured for clean imports
- Comprehensive error overlay integration

## Changelog
- December 22, 2024. Successfully migrated from Replit Agent to Replit environment
- June 24, 2025. Initial setup

## Recent Changes
- ✓ Configured Vite development server to run on port 5000 with host 0.0.0.0 for Replit compatibility
- ✓ Verified all dependencies are properly installed
- ✓ Application now runs cleanly in Replit environment with proper security practices
- ✓ Maintained client/server separation and robust architecture
- ✓ Created custom production startup script (start-production.js) to resolve Replit deployment host blocking issue
- ✓ Addressed Vite preview server allowed hosts configuration for successful deployment

## User Preferences

Preferred communication style: Simple, everyday language.
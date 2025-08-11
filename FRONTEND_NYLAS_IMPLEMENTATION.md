
# Frontend Plan: Nylas & Booking Assistant Integration

This document outlines the frontend development plan for integrating the Nylas email service and the Booking Assistant API into the PGL podcast outreach platform.

## 1. Overview

The goal of this integration is to provide a seamless email management experience within the PGL platform, allowing users to send pitches, manage their inbox, and track the status of their outreach efforts without leaving the application.

## 2. Core Features

*   **Email Synchronization:** Two-way synchronization of emails and threads with the user's connected email account via Nylas.
*   **AI-Powered Inbox:** Automatic classification of incoming emails using the Booking Assistant API.
*   **Smart Replies:** AI-generated draft replies for common scenarios.
*   **Pitch & Placement Analytics:** Dashboards for visualizing the performance of outreach campaigns.

## 3. Frontend Architecture

We will use the existing React frontend and integrate the new features as a new "Inbox" section.

### 3.1. State Management

We will use a combination of React Query and a global state management library (like Zustand or Redux) to manage the state of the inbox.

*   **React Query:** For fetching, caching, and updating email data from the backend.
*   **Zustand/Redux:** For managing global state, such as the current user, selected thread, and UI state.

### 3.2. UI Components

The following React components will need to be created:

*   **`InboxView.tsx`:** The main view for the inbox, displaying a list of email threads.
*   **`ThreadView.tsx`:** A view for displaying the messages within a single email thread.
*   **`Message.tsx`:** A component for displaying a single email message.
*   **`ComposeModal.tsx`:** A modal for composing new emails and replies.
*   **`PitchAnalyticsDashboard.tsx`:** A dashboard for displaying pitch analytics.
*   **`PlacementAnalyticsDashboard.tsx`:** A dashboard for displaying placement analytics.

## 4. Nylas Integration

The frontend will interact with the Nylas API through our backend.

### 4.1. Authentication

*   The frontend will need to provide a way for users to connect their email accounts to Nylas. This will involve redirecting the user to a Nylas-hosted authentication page.
*   The backend will handle the OAuth 2.0 flow and store the Nylas API tokens securely.

### 4.2. Email Synchronization

*   The frontend will use a WebSocket connection to receive real-time updates from the backend when new emails are received.
*   The `InboxView` will use React Query to fetch the initial list of email threads and to paginate through the inbox.

## 5. Booking Assistant Integration

The frontend will use the Booking Assistant API to classify emails and generate drafts.

### 5.1. Email Classification

*   When a new email is received, the backend will automatically call the Booking Assistant API to classify it.
*   The frontend will display the classification (e.g., "Booking Confirmation", "Rejection", "Question") as a badge next to the email in the `InboxView`.

### 5.2. Smart Replies

*   When the user views an email thread, the frontend will display an AI-generated draft reply from the Booking Assistant.
*   The user will be able to edit the draft and send it as a reply.

## 6. Analytics

The frontend will display analytics for pitches and placements.

### 6.1. Pitch Analytics

*   The `PitchAnalyticsDashboard` will display the following metrics:
    *   Number of pitches sent
    *   Open rate
    *   Reply rate
    *   Acceptance rate

### 6.2. Placement Analytics

*   The `PlacementAnalyticsDashboard` will display the following metrics:
    *   Number of placements secured
    *   Placement rate (placements per pitch)
    *   A list of all placements with their status (e.g., "Scheduled", "Completed", "Cancelled").

## 7. API Endpoints

The frontend will need to interact with the following backend endpoints:

### 7.1. Inbox Endpoints (NO /api/ prefix)
*   `GET /inbox/messages`: Get a paginated list of email messages.
*   `GET /inbox/threads/{thread_id}`: Get the messages within a single email thread.
*   `POST /inbox/classify/{message_id}`: Manually trigger classification for a message.
*   `GET /inbox/classifications/summary`: Get classification summary.
*   `GET /inbox/review-tasks`: Get review tasks for the booking assistant.
*   `PUT /inbox/review-tasks/{task_id}/status`: Update task status.
*   `POST /inbox/sync`: Sync messages from Nylas.

### 7.2. Pitches Endpoints (NO /api/ prefix)
*   `POST /pitches/send-nylas/{pitch_gen_id}`: Send a pitch via Nylas.
*   `POST /pitches/send-instantly/{pitch_gen_id}`: Send a pitch via Instantly.
*   `POST /pitches/send-batch-nylas`: Batch send via Nylas.
*   `GET /pitches/{pitch_id}`: Get pitch details.
*   `GET /pitches/generations/{pitch_gen_id}`: Get generation details.

### 7.3. Metrics Endpoints (WITH /api/ prefix)
*   `GET /api/campaigns/{campaign_id}/metrics`: Get campaign-level metrics.
*   `GET /api/pitches/{pitch_id}/events`: Get the event timeline for a specific pitch.
*   `GET /api/campaigns/{campaign_id}/deliverability`: Get deliverability metrics.
*   `GET /api/grants/{grant_id}/health`: Monitor Nylas grant health.

### 7.4. Authentication & Webhooks
*   `POST /email-accounts/nylas-auth-callback`: OAuth callback for Nylas.
*   `POST /webhooks/nylas/challenge`: Webhook challenge endpoint.
*   `POST /webhooks/nylas/events`: Webhook events endpoint.

**⚠️ Important Notes:**
- **Authentication Required:** All endpoints require authentication via session cookie.
- **Prefix Usage:** Most endpoints do NOT use `/api/` prefix. Only the metrics router uses `/api/` prefix.
- **Booking Assistant:** The booking assistant is integrated into the classification system, not as separate endpoints.

## 8. Implementation Roadmap

### Phase 1: Nylas Integration (1-2 weeks)

*   Implement the Nylas authentication flow.
*   Create the `InboxView` and `ThreadView` components.
*   Implement email synchronization with the backend.

### Phase 2: Booking Assistant Integration (1 week)

*   Display email classifications in the `InboxView`.
*   Display smart replies in the `ThreadView`.

### Phase 3: Analytics (1 week)

*   Create the `PitchAnalyticsDashboard` and `PlacementAnalyticsDashboard` components.
*   Integrate with the analytics API endpoints.

This plan provides a clear path forward for integrating the Nylas and Booking Assistant services into the frontend, enabling a powerful and intelligent email management experience for our users.

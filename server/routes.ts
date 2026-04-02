// @ts-nocheck
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import WebSocket, { WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";
import { storage } from "./storage";
import { goalsStorage } from "./storage-goals";
import { officialsStorage } from "./storage-officials";
import { userActivityStorage } from "./storage-user-activity";
import { trendingStorage } from "./storage-trending";
import { powerInfluencersStorage } from "./storage-power-influencers";
import { setupAuth, getAuthenticatedUserFromRequest } from "./auth";
import { registerAwsRoutes } from "./routes/aws-routes";
import { registerLegislationRoutes } from "./routes/legislation-routes";
import { registerAdvocacyRoutes } from "./routes/advocacy-routes"; 
import { registerWarRoomRoutes } from "./routes/war-room-routes";
import { registerTexasLegislatureRoutes } from "./routes/texas-legislature-routes";
import { registerActionCirclesRoutes } from "./routes/action-circles-routes";
import { registerBillInteractionsRoutes } from "./routes/bill-interactions-routes";
import { registerSocialNetworkRoutes } from "./routes/social-network-routes";
import { registerVerificationRoutes } from "./routes/verification-routes";
import { registerImpactRoutes } from "./routes/impact-routes";
import { registerSuperUserRoutes } from "./routes/super-user-routes";
import { registerAiAssistantRoutes } from "./routes/ai-assistant-routes";
import { registerCivicEngagementRoutes } from "./routes/civic-engagement-routes";
import { registerCommitteeRoutes } from "./routes/committee-routes-fixed";
import { registerTrendingBillsRoutes } from "./routes/trending-bills-routes";
import { registerCivicActionRoutes } from "./routes-civic-actions";
import { registerNotificationRoutes } from "./routes-notifications";
import { registerCollaborativeAnnotationsRoutes } from "./routes-collaborative-annotations";
import { registerSentimentRoutes } from "./routes-sentiment";
import { registerAnnotationRoutes } from "./routes-annotations";
import { registerDiscussionRoutes } from "./routes-discussions";
import { registerInsiderRoutes } from "./routes-insider";
import { registerPointOfOrderRoutes } from "./routes-point-of-order";
import { registerCommitteeVideoRoutes } from "./routes-committee-videos";
import { registerEnhancedCommitteeVideoRoutes } from "./routes-committee-videos-enhanced";
import { registerHistoricalCommitteeVideoRoutes } from "./routes-historical-committee-videos";
import { registerCivicTermsRoutes } from "./routes-civic-terms";
import { registerBillSummaryRoutes } from "./routes-bill-summaries";
import { registerBillAnalysisRoutes } from "./routes-bill-analysis";
import { registerBillComparisonRoutes } from "./routes-bill-comparison";
import { registerBillComparisonEnhancedRoutes } from "./routes-bill-comparison-enhanced";
import { registerRealTimeTimelineRoutes } from "./routes-real-time-timeline";
import { registerBillTranslatorRoutes } from "./routes-bill-translator";
import { registerSmartAlertsRoutes } from "./routes-smart-alerts-demo";
import { registerSmartAlertsEnhancedRoutes } from "./routes-smart-alerts-enhanced";
import { registerShareableGraphicsRoutes } from "./routes-shareable-graphics";
import { registerDataUploadRoutes } from "./routes/data-upload-routes";
import { registerInteractiveBillComparisonRoutes } from "./routes-interactive-bill-comparison";
import { registerBillComplexityTranslatorRoutes } from "./routes-bill-complexity-translator";
import { registerTexasLegislatureScraperRoutes } from "./routes-texas-legislature-scraper";
import { registerTexasLegislatorsScraperRoutes } from "./routes-texas-legislators-scraper";
import { registerOpenStatesLegislatorsRoutes } from "./routes-openstates-legislators";
import { registerOpenStatesBillsRoutes } from "./routes-openstates-bills";
import { registerOpenStatesComprehensiveRoutes } from "./routes-openstates-comprehensive";
import { registerComprehensiveTexasScraperRoutes } from "./routes-comprehensive-texas-scraper";
import { registerEnhancedTexasScraperRoutes } from "./routes-enhanced-texas-scraper";
import databasePersistenceRoutes from "./routes-database-persistence";
import notificationsEnhancedRoutes from "./routes-notifications-enhanced";
// H8: Enhanced AI imports removed — modules disabled for platform stability
import { applySafetyStandards } from "./middleware/safety-standards-middleware";
import { registerBatchProcessingRoutes } from "./routes-batch-processing";
import multimodalAnalysisRoutes from "./routes-multimodal-analysis";
import { registerNameProcessorRoutes } from "./routes-name-processor";
import { registerModeratorRoutes } from "./routes-moderator";
import { registerLegislativeUpdatesRoutes, refreshRssFeeds } from "./routes-legislative-updates";
import scoutBotFrameworkRoutes from "./routes-scout-bot-framework";
import legiscanRoutes from "./routes-legiscan";
import integratorRoutes from "./routes-integrator";
import communitySuggestionsRouter from "./routes-community-suggestions";
import recommendationsRoutes from "./routes-recommendations";
import committeeVideoRoutes from "./routes/committee-video-routes";
import liveStreamRoutes from "./routes/live-stream-routes";
import emotionThemeRoutes from "./routes/emotion-theme-routes";
import { registerAdvancedSearchRoutes } from "./routes/advanced-search-routes";
import { registerTrendingRoutes } from "./routes-trending";
import { registerGoalsRoutes } from "./routes-goals";
import { router as tecFileUploadRouter } from "./routes-tec-file-upload";
import collaborativeRoutes from "./routes-collaborative";
import contextualBillAnalysisRoutes from "./routes-contextual-bill-analysis";
import { initializeCollaborativeWebsockets } from "./websocket-collaborative";
import { initializeCollaborativeBillWebSockets } from "./websocket-collaborative-bill";
// import collaborativeAnnotationsRoutes from "./routes-collaborative-annotations"; // H8: unused
import { authenticateWebSocket, startHeartbeat } from "./websocket-auth";
import { registerFeedRoutes } from "./routes-feed";
import { registerLearningRoutes } from "./routes-learning";
import { rssFeedService } from "./services/rss-feed-service";
import { registerAvatarRoutes } from "./routes/avatar-routes";
import { registerUserActivityRoutes } from "./routes/user-activity-routes";
import { registerOnboardingRoutes } from "./routes-onboarding";
import { registerInfographicsRoutes } from "./routes-infographics";
import { registerDocumentRoutes } from "./routes-documents";
import interestsRoutes from "./routes-interests";
import { registerTimelineRoutes } from "./routes-timeline";
import { registerOpenAIStatusRoutes } from "./routes-openai-status";
import { registerMultimodalAssistantRoutes } from "./routes-multimodal-assistant";
import { registerFeedbackRoutes } from "./routes-feedback";
import { registerDebugRoutes } from "./routes-debug";
import { registerLiveDataRoutes } from "./routes-live-data";
import { registerMobileOptimizationRoutes } from "./routes-mobile-optimization";
import { registerUXEnhancementRoutes } from "./routes-ux-enhancements";
import { registerComprehensiveDataExpansionRoutes } from "./routes-comprehensive-data-expansion";
import { registerRealTimeAlertsRoutes } from "./routes-real-time-alerts";
import { registerSocialSharingRoutes } from "./routes-social-sharing";
import civicChatbotRoutes from "./routes-civic-chatbot";
import { registerAmendmentPlaygroundRoutes } from "./routes-amendment-playground";
import setupAdvancedAnalyticsRoutes from "./routes-advanced-analytics";
import enhancedAnalyticsRoutes from "./routes-analytics-enhanced";
import { registerTexasDataRoutes } from "./routes-texas-data";
import { registerLegislativeImpactRoutes } from "./routes-legislative-impact";
import legislativeMapRoutes from "./routes-legislative-map";
import { openAIStatusMiddleware } from "./middleware/openai-status";
// import { texasLegislatureScraper } from "./services/texas-legislature-scraper";
import liveCommitteeStream from "./services/live-committee-stream";
import stateAgencyTracker from "./services/state-agency-tracker";
import enhancedCommitteeVideoAnalyzer from "./services/enhanced-committee-video-analyzer";
import { registerStateAgencyRoutes } from "./routes-state-agencies";
import { registerPointsOfOrderStatsRoutes } from "./routes-points-of-order-stats";
import { registerEnhancedPointOfOrderRoutes } from "./routes-enhanced-point-of-order";
import { registerEthicsRoutes } from "./routes-ethics";
import { registerFilingAssistantRoutes } from "./routes-filing-assistant";
import { registerVoteRoutes } from "./routes-votes";
import { registerVoiceSearchRoutes } from "./routes-voice-search";
import { registerPowerInfluencersRoutes } from "./routes-power-influencers";
import { registerBillStatusRoutes } from "./routes-bill-status";
import { registerLegislatorRoutes } from "./routes-legislators";
import { registerScoutBotRoutes } from "./routes-scout-bot";
import { registerExtendedScoutBotRoutes } from "./routes-scout-bot-extended";
import { registerScoutBotNetworkRoutes } from "./routes-scout-bot-network";
import { registerScoutBotAnalyticsRoutes } from "./routes-scout-bot-analytics";
import setupScoutBotAiRoutes from "./routes-scout-bot-ai";
import { registerCommunityRoutes } from "./routes-community";
import { registerCharacterProfileRoutes } from "./routes-character-profiles";
// import { registerCollaborativeAnnotationsRoutes } from "./routes-collaborative-annotations-setup";
import legiScanRoutes from "./routes-legiscan-importer";
import collaborativeAmendmentsRoutes from "./routes-collaborative-amendments";
import emojiSentimentRoutes from "./routes-emoji-sentiment";
import nodeCron from "node-cron";
import { createLogger } from "./logger";
import { RATE_LIMITS } from "./config";
const log = createLogger("routes");


export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication with Passport.js
  setupAuth(app);
  
  // ---- AUTH, USER, CHALLENGE, REPRESENTATIVE, METRICS ROUTES (extracted) ----
  const authRoutes = (await import("./routes/auth-routes")).default;
  app.use("/api/auth", authRoutes);

  const userProfileRoutes = (await import("./routes/user-profile-routes")).default;
  app.use("/api", userProfileRoutes);

  const challengeRoutes = (await import("./routes/challenge-routes")).default;
  app.use("/api", challengeRoutes);

  const representativeRoutes = (await import("./routes/representative-routes")).default;
  app.use("/api", representativeRoutes);

  const metricsRoutes = (await import("./routes/metrics-routes")).default;
  app.use("/api", metricsRoutes);

  // ---- USER, ROLE, MILESTONE routes moved to user-profile-routes.ts ----

  // ---- CHALLENGE routes moved to challenge-routes.ts ----

  // ---- ACTION CIRCLE routes managed in action-circles-routes.ts ----

  // ---- REPRESENTATIVE routes moved to representative-routes.ts ----
  // ---- METRICS routes moved to metrics-routes.ts ----

  // ---- POLICY INTEL BRIDGE ROUTES (extracted) ----
  const policyIntelBridgeRoutes = (await import("./routes/policy-intel-bridge-routes")).default;
  app.use("/api/integrations/policy-intel", policyIntelBridgeRoutes);
  
  // Register AWS-related routes
  registerAwsRoutes(app);
  
  // Register TEC file upload routes
  app.use('/api/tec', tecFileUploadRouter);
  
  // Register collaborative document editing routes
  app.use('/api/collaborative', collaborativeRoutes);
  
  // Register collaborative annotations routes
  registerCollaborativeAnnotationsRoutes(app);
  
  // Register community suggestions routes
  app.use('/api/community', communitySuggestionsRouter);
  
  // Register legislative updates routes
  registerLegislativeUpdatesRoutes(app);
  
  // Start RSS feed service (using our scheduleRssFeedRefresh function)
  try {
    rssFeedService.scheduleRssFeedRefresh(30); // Refresh every 30 minutes
    log.info("RSS feed scheduler initialized");
  } catch (error: any) {
    log.error({ err: error }, "Failed to initialize RSS feed scheduler");
  }
  
  // ---- BILLS & LEGISLATORS routes (extracted) ----
  const billsLegislatorsRoutes = (await import("./routes/bills-legislators-routes")).default;
  app.use("/api", billsLegislatorsRoutes);
  
  // ---- SEARCH routes (extracted) ----
  const searchRoutes = (await import("./routes/search-routes")).default;
  app.use("/api", searchRoutes);

  // ---- API DOCS (OpenAPI/Swagger UI) ----
  const apiDocsRoutes = (await import("./routes/api-docs-routes")).default;
  app.use("/api", apiDocsRoutes);

  // Register Legislation-related routes
  registerLegislationRoutes(app);
  
  // Register Advocacy-related routes
  registerAdvocacyRoutes(app);
  
  // Register War Room-related routes
  registerWarRoomRoutes(app);
  
  // Register Texas Legislature-related routes
  registerTexasLegislatureRoutes(app);
  
  // Action Circles routes registered below with other annotation routes
  
  // Register Bill Interactions Routes (Notes, Highlights, Shares)
  registerBillInteractionsRoutes(app);
  
  // Register Social Network Routes (Invitations, Connections, Sharing)
  registerSocialNetworkRoutes(app);
  
  // Register Verification System Routes
  registerVerificationRoutes(app);
  
  // Register Impact Analysis Routes
  registerImpactRoutes(app);
  
  // Register Super User Dashboard Routes
  registerSuperUserRoutes(app);
  
  // Register AI Assistant Routes
  registerAiAssistantRoutes(app);
  
  // Register Civic Engagement Routes
  registerCivicEngagementRoutes(app);
  
  // Register committee routes
  registerCommitteeRoutes(app);
  
  // Register enhanced point of order analysis routes
  registerPointOfOrderRoutes(app);
  registerPointsOfOrderStatsRoutes(app);
  registerEnhancedPointOfOrderRoutes(app);
  
  // Register enhanced committee video analysis routes
  registerCommitteeVideoRoutes(app);
  
  // Register committee video processing routes (legacy)
  app.use("/api", committeeVideoRoutes);
  app.use("/api", liveStreamRoutes);
  app.use("/api/theme", emotionThemeRoutes);
  app.use("/api/recommendations", recommendationsRoutes);
  app.use("/api", interestsRoutes);
  
  // Register community bill suggestion routes
  registerCommunityRoutes(app);
  
  // Register trending bills routes
  registerTrendingBillsRoutes(app);
  
  // Register annotation, civic action, and action circles routes
  registerAnnotationRoutes(app);
  registerCivicActionRoutes(app);
  registerActionCirclesRoutes(app);
  registerNotificationRoutes(app);
  registerSentimentRoutes(app);
  registerTrendingRoutes(app); // Add our new trending routes with passage probability
  registerGoalsRoutes(app); // Add our new user goals and team lobbying routes
  registerFeedRoutes(app); // Register social media and news feed routes
  registerDiscussionRoutes(app); // Register group discussion and commenting routes
  registerInsiderRoutes(app); // Register insider updates and verified information routes
  registerCivicTermsRoutes(app); // Register civic terms and learning module routes
  registerLearningRoutes(app); // Register contextual AI-powered civic learning module routes
  registerAdvancedSearchRoutes(app);
  registerAvatarRoutes(app); // Register cartoon avatar generation routes for officials
  registerUserActivityRoutes(app); // Register user activity tracking and analytics routes
  registerOnboardingRoutes(app); // Register gamified onboarding experience routes
  registerInfographicsRoutes(app); // Register shareable infographics generator routes
  registerDocumentRoutes(app); // Register document management API routes
  
  // Register database persistence routes
  app.use(databasePersistenceRoutes);
  
  // Register enhanced notification routes
  app.use(notificationsEnhancedRoutes);
  
  // ---- HEALTH routes (extracted) ----
  const healthRoutes = (await import("./routes/health-routes")).default;
  app.use("/api", healthRoutes);
  app.use(healthRoutes); // /tech-stack and /act_up_technical_stack.md are served at root
  
  // Serve the built frontend files for any undefined routes (including the root route)
  app.use((req, res, next) => {
    // If this is an API request or a defined route, skip to the next middleware
    if (req.path.startsWith('/api') || req.path === '/api/health') {
      return next();
    }
    
    // For all other routes, let Vite or static file middleware handle it
    // which will serve our client-side React app
    next();
  });
  
  // Initialize Texas Legislature scraper service
  // TODO: Re-enable when external connection issues are resolved
  // Requires: initTexasLegislatureScraper, liveCommitteeStream,
  //           enhancedCommitteeVideoAnalyzer, stateAgencyTracker
  
  // Register state agency routes
  registerStateAgencyRoutes(app);
  
  // Register AI-powered bill summary routes
  registerBillSummaryRoutes(app);
  registerBillAnalysisRoutes(app);
  registerBillComparisonRoutes(app);
  registerVoteRoutes(app);
  
  // Register enhanced committee video analysis routes
  registerEnhancedCommitteeVideoRoutes(app);
  
  // Register historical committee videos routes
  registerHistoricalCommitteeVideoRoutes(app);
  
  // Register timeline routes
  registerTimelineRoutes(app);
  
  // Register OpenAI status routes
  registerOpenAIStatusRoutes(app);
  
  // Register expanded data collection routes
  log.info("🚀 Setting up expanded data collection routes...");
  const expandedDataRoutes = (await import("./routes-expanded-data")).default;
  app.use("/api/expanded-data", expandedDataRoutes);
  log.info("🚀 Expanded data collection routes registered successfully!");

  // Register enhanced user authentication routes
  log.info("👤 Setting up enhanced user authentication & customization routes...");
  const userAuthRoutes = (await import("./routes-user-auth")).default;
  app.use("/api/auth", userAuthRoutes);
  app.use("/api/user", userAuthRoutes);
  log.info("👤 Enhanced user authentication routes registered successfully!");

  // Register real OAuth routes (Google, GitHub)
  const oauthRoutes = (await import("./routes-oauth")).default;
  app.use("/api/auth", oauthRoutes);
  log.info("🔐 OAuth authentication routes registered (Google, GitHub)");

  // Register policy impact simulator routes
  log.info("🧮 Setting up One-Click Policy Impact Simulator routes...");
  const policyImpactRoutes = (await import("./routes-policy-impact")).default;
  app.use("/api/policy-impact", policyImpactRoutes);
  log.info("🧮 Policy Impact Simulator routes registered successfully!");

  // Register multimodal AI assistant routes
  registerMultimodalAssistantRoutes(app);
  
  // TODO(H8): Enhanced AI routes (Anthropic/Pinecone) disabled for platform stability
  // TODO(H8): Community suggestions disabled due to schema conflicts
  // TODO(H8): Advanced analysis disabled due to require conflicts
  
  // Register batch processing routes for parallel operations
  registerBatchProcessingRoutes(app);
  
  // Register user feedback routes
  registerFeedbackRoutes(app);
  
  // Register social sharing routes
  // TODO(H8): Re-enable when deployment issues are resolved
  
  // Register Texas legislative data routes
  registerTexasDataRoutes(app);

  // Register legislative impact analysis routes
  registerLegislativeImpactRoutes(app);
  
  // Register legislative map routes
  app.use('/api', legislativeMapRoutes);
  
  // Register emoji sentiment analysis routes
  app.use('/api', emojiSentimentRoutes);
  log.info("😊 Emoji sentiment analysis routes registered successfully!");
  
  // TODO(H8): RSS feed scheduler disabled — re-enable when server issues resolved
  
  // Register debug routes
  registerDebugRoutes(app);
  
  // Register live data management routes
  registerLiveDataRoutes(app);
  
  // Register mobile optimization routes
  registerMobileOptimizationRoutes(app);
  
  // Register bill status routes for real-time legislative updates
  registerBillStatusRoutes(app);
  
  // Register ethics transparency routes
  registerEthicsRoutes(app);
  registerFilingAssistantRoutes(app);
  registerPowerInfluencersRoutes(app);
  
  // Register LegiScan API routes
  app.use(legiscanRoutes);
  app.use(integratorRoutes);
  app.use('/api/multimodal', multimodalAnalysisRoutes);
  app.use('/api/contextual', contextualBillAnalysisRoutes);
  
  // Register Bill Translator routes
  registerBillTranslatorRoutes(app);
  
  // Register Enhanced Bill Comparison routes  
  registerBillComparisonEnhancedRoutes(app);
  
  // Register Real-Time Timeline routes
  registerRealTimeTimelineRoutes(app);
  
  // Register Smart Bill Alerts routes
  registerSmartAlertsRoutes(app);
  
  // Register Enhanced Smart Alerts routes
  registerSmartAlertsEnhancedRoutes(app);
  
  // Register Shareable Graphics routes
  registerShareableGraphicsRoutes(app);
  
  // Register Interactive Bill Comparison routes
  registerInteractiveBillComparisonRoutes(app);
  
  // Register AI Bill Complexity Translator routes
  registerBillComplexityTranslatorRoutes(app);
  
  // Register Texas Legislature Scraper routes
  registerTexasLegislatureScraperRoutes(app);
  
  // Register Texas Legislators Scraper routes
  registerTexasLegislatorsScraperRoutes(app);
  
  // Register OpenStates Legislators routes
  registerOpenStatesLegislatorsRoutes(app);
  
  // Register OpenStates Bills & Voting Records routes
  registerOpenStatesBillsRoutes(app);
  
  // Register OpenStates Comprehensive Infrastructure routes
  registerOpenStatesComprehensiveRoutes(app);
  
  // Register Comprehensive Texas Legislature Scraper routes
  registerComprehensiveTexasScraperRoutes(app);
  
  // Register Enhanced Texas Legislature Scraper routes
  registerEnhancedTexasScraperRoutes(app);
  
  // Register Real-Time Legislative Alerts routes
  registerRealTimeAlertsRoutes(app);
  
  // Register Scout Bot routes
  registerScoutBotRoutes(app);
  registerExtendedScoutBotRoutes(app);
  registerScoutBotNetworkRoutes(app);
  registerScoutBotAnalyticsRoutes(app);
  setupScoutBotAiRoutes(app);

  // Register social media sharing routes
  const setupSocialSharingRoutes = (await import('./routes-social-sharing')).default;
  setupSocialSharingRoutes(app);
  
  // TODO(H8): Enhanced AI routes — disabled for server stability

  // Register enhanced analytics routes  
  log.info("📈 Setting up enhanced analytics with authentic data...");
  app.use("/api", enhancedAnalyticsRoutes);
  log.info("📈 Enhanced analytics routes registered successfully!");
  registerCharacterProfileRoutes(app);
  registerNameProcessorRoutes(app);
  registerModeratorRoutes(app);
  
  // Register Legislator routes
  registerLegislatorRoutes(app);
  
  // Register Community routes
  registerCommunityRoutes(app);
  
  // Register Collaborative Annotations routes
  // Routes are registered earlier in the file via registerCollaborativeAnnotationsRoutes(app);
  
  // Apply OpenAI status middleware (after routes so it doesn't interfere with status endpoints)
  app.use(openAIStatusMiddleware);

  // Create HTTP server
  const httpServer = createServer(app);
  
  // Add WebSocket support for collaborative annotations
  
  // Define collaborative annotations WebSocket handler
  function setupCollaborativeAnnotationsWebSocket(httpServer: Server) {
    try {
      // Create a WebSocket server for annotations
      const wss = new WebSocketServer({ server: httpServer, path: '/ws/annotations' });
      log.info("WebSocket server created for collaborative annotations");
      
      // Keep track of connected clients and their states
      const connectedClients = new Map();
      
      // Handle WebSocket connections
      wss.on('connection', async (ws: WebSocket, req) => {
        log.info('New WebSocket connection established for collaborative annotations');

        const auth = await authenticateWebSocket(ws, req);
        if (!auth) return;
        
        const stopHeartbeat = startHeartbeat(ws);
        const clientId = uuidv4();
        let documentId: number | null = null;
        const userId = auth.user.id;
        const username = auth.user.displayName || auth.user.username;
        
        // Client is now connected
        connectedClients.set(clientId, { ws, documentId, userId });
        
        // Send a welcome message
        ws.send(JSON.stringify({ 
          type: 'connection_established',
          payload: { message: 'Connected to Act Up collaborative annotations service' }
        }));
        
        // Handle incoming messages
        ws.on('message', (message: string | Buffer | ArrayBuffer | Buffer[]) => {
          try {
            const data = JSON.parse(message.toString());
            log.info({ detail: data.type }, 'Received annotation message');
            
            // Handle different message types
            switch (data.type) {
              case 'join_document':
                // User joined a document
                documentId = Number(data.documentId);
                if (!Number.isInteger(documentId) || documentId <= 0) {
                  break;
                }
                
                // Update client info
                connectedClients.set(clientId, { ws, documentId, userId });
                
                // Broadcast to other users in the same document
                broadcastToDocument(documentId, {
                  type: 'user_activity',
                  userId: userId,
                  payload: {
                    action: 'joined',
                    username
                  }
                }, clientId);
                break;
                
              case 'leave_document':
                // User left a document
                broadcastToDocument(documentId, {
                  type: 'user_activity',
                  userId: userId,
                  payload: {
                    action: 'left',
                    username
                  }
                }, clientId);
                
                // Reset document association
                documentId = null;
                connectedClients.set(clientId, { ws, documentId, userId });
                break;
                
              case 'cursor_position':
                // User cursor position update
                broadcastToDocument(documentId, {
                  type: 'cursor_position',
                  userId,
                  payload: data.payload
                }, clientId);
                break;
                
              case 'create_annotation':
              case 'update_annotation':
              case 'delete_annotation':
                // Annotation actions - broadcast to others
                broadcastToDocument(documentId, {
                  ...data,
                  userId,
                  payload: data.payload ?? {}
                }, clientId);
                break;
                
              default:
                log.info({ detail: data.type }, 'Unknown message type');
            }
          } catch (error: any) {
            log.error({ err: error }, 'Error processing annotation WebSocket message');
          }
        });
        
        // Handle disconnections
        ws.on('close', () => {
          log.info('WebSocket connection closed for collaborative annotations');
          stopHeartbeat();
          
          // If client was in a document, notify others
          if (documentId && userId) {
            broadcastToDocument(documentId, {
              type: 'user_activity',
              userId: userId,
              payload: {
                action: 'left',
                username
              }
            }, clientId);
          }
          
          // Remove client from connected list
          connectedClients.delete(clientId);
        });
        
        // Handle errors
        ws.on('error', (error: Error) => {
          log.error({ err: error }, 'WebSocket error in collaborative annotations');
        });
      });
      
      // Function to broadcast a message to all clients viewing the same document
      function broadcastToDocument(documentId: number | null, message: any, excludeClientId?: string) {
        if (!documentId) return;
        
        connectedClients.forEach((client, id) => {
          // Skip the sender and clients not in this document
          if (id === excludeClientId || client.documentId !== documentId) return;
          
          // Send to this client if connection is active
          if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify(message));
          }
        });
      }
      
      return wss;
    } catch (error: any) {
      log.error({ err: error }, "Failed to initialize collaborative annotations WebSocket");
    }
  }
  
  // TODO(H8): Other WebSocket connections disabled to fix blank page issue
  
  // Create WebSocket server for legislative updates on a distinct path to avoid conflicts
  // TODO(H8): Re-enable when WebSocket stability is confirmed
  
  // Initialize collaborative editing WebSockets
  // TODO(H8): Re-enable initializeCollaborativeWebsockets when ready
  
  // Initialize collaborative bill editing WebSockets
  initializeCollaborativeBillWebSockets(httpServer);
  
  // Initialize collaborative annotations WebSockets
  setupCollaborativeAnnotationsWebSocket(httpServer);
  
  // TODO(H8): Legislative updates WebSocket — re-enable when ready
  
  // TODO(H8): Voice Search Routes — disabled to fix blank page issue
  
  // TODO(H8): RSS feed scheduler (cron) — disabled for stability
  
  // Register LegiScan import routes
  app.use(legiScanRoutes);
  log.info("📋 LegiScan data import routes registered successfully!");
  
  // Register Data Upload routes
  registerDataUploadRoutes(app);
  log.info("📤 Texas legislative data upload routes registered successfully!");
  
  // Register Collaborative Amendments routes
  app.use(collaborativeAmendmentsRoutes);
  log.info("🤝 Collaborative Amendment Playground routes registered successfully!");

  // ---- DATA IMPORT routes (extracted) ----
  const dataImportRoutes = (await import("./routes/data-import-routes")).default;
  app.use("/api", dataImportRoutes);
  
  // Register Enhanced UX Routes
  registerUXEnhancementRoutes(app);
  
  // Register Comprehensive Data Expansion Routes
  registerComprehensiveDataExpansionRoutes(app);
  
  return httpServer;
}

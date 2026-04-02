// @ts-nocheck

import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from "./context/UserContext";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

import HomePage from "./pages/modern-home";
import TexasCampaignFinance from "./pages/texas-campaign-finance";
import EnhancedCampaignFinance from "./pages/enhanced-campaign-finance";

import BillDetail from "./pages/bill-detail";
import LegislatorProfile from "./pages/legislator-profile";
import ComprehensiveAnalysisDashboard from "./pages/comprehensive-analysis-dashboard";
import PointsOfOrderDashboard from "./pages/points-of-order-dashboard";
import PointOfOrderDetail from "./pages/point-of-order-detail";
import PointsOfOrderValidation from "./pages/points-of-order-validation";
import VoteDashboard from "./pages/vote-dashboard";
import AdvancedSearchPage from "./pages/advanced-search";
import LegislativeImpactPage from "./pages/legislative-impact";
import AboutPage from "./pages/about";
import OnboardingPage from "./pages/onboarding";

import BillSummaryPage from "./pages/bill-summary";
import BillTimelinePage from "./pages/bill-timeline";
import BillDetailPage from "./pages/bill-detail";
import BillAnnotatorPage from "./pages/bill-annotator";
import TimelineTestPage from "./pages/timeline-test";
import EnhancedTimelineView from "./pages/enhanced-timeline-view";

import LegislativeMapPage from "./pages/legislative-map";
import VoiceSearchPage from "./pages/voice-search";

import DashboardPage from "./pages/dashboard";
import DigestPage from "./pages/digest";
import LegislatorsPage from "./pages/legislators";
import LegislatorDetailPage from "./pages/legislator-detail";
import LegislatorAdvancedProfilePage from "./pages/legislator-advanced-profile";
import FilingAssistantPage from "./pages/filing-assistant";
import TecFileUploadPage from "./pages/ethics-portal/TecFileUploadPage.jsx";
import TransparencyPortal from "./pages/transparency-portal";
import ScoutBotPage from "./pages/scout-bot";
import CreateScoutBotProfilePage from "./pages/scout-bot/create";
import ScoutBotProfilePage from "./pages/scout-bot/profiles/[id]";
import CollaborativePage from "./pages/collaborative";
import CollaborativeEditPage from "./pages/collaborative-edit";
import CollaborativeBillEditPage from "./pages/collaborative-bill-edit";
import CollaborativeAnnotationsPage from "./pages/collaborative-annotations";
import BillAlertsPage from "./pages/bill-alerts";
import SmartBillAlertsPage from "./pages/smart-bill-alerts";
import SmartAlertsEnhancedPage from "./pages/smart-alerts-enhanced";
import ShareableGraphicsPage from "./pages/shareable-graphics";
import BillComparisonPage from "./pages/bill-comparison";
import BillTranslatorPage from "./pages/bill-translator";
import BillComplexityTranslatorPage from "./pages/bill-complexity-translator";
import InteractiveBillComparisonPage from "./pages/interactive-bill-comparison";
import DataImportPage from "./pages/data-import";
import CollaborativeAmendmentsPage from "./pages/collaborative-amendments";
import RealTimeTimelinePage from "./pages/real-time-timeline";
import EnhancedAIPage from "./pages/enhanced-ai";
import BatchProcessingPage from "./pages/batch-processing";
import MultimodalAnalysisPage from "./pages/multimodal-analysis";
import BillVisualAnalysisPage from "./pages/bill-visual-analysis";
import ContextualBillAnalysisPage from "./pages/contextual-bill-analysis";
import NameProcessorPage from "./pages/scout-bot/name-processor";
import CommunityPage from "./pages/community";
import SuggestBillPage from "./pages/community/suggest";
import SuggestionDetailPage from "./pages/community/suggestions/[id]";
import LegislativeUpdatesPage from "./pages/legislative-updates";
import LegislativePage from "./pages/LegislativePage";
import EnhancedBillPage from "./pages/EnhancedBillPage";
import EnhancedAISearchPage from "./pages/enhanced-ai-search";

import BillSuggestionsPage from "./pages/community/bill-suggestions";
import EnhancedBillSuggestionsPage from "./pages/community/enhanced-bill-suggestions";

import AdminDashboard from "./pages/admin-dashboard";
import SocialSharingPage from "./pages/social-sharing";
import AdvancedAnalyticsPage from "./pages/advanced-analytics";
import LegislativeIntelligenceDashboard from "./pages/legislative-intelligence-dashboard";
import AmendmentPlaygroundPage from "./pages/amendment-playground";
import EnhancedLoginPage from "./pages/EnhancedLoginPage";
import SocialLoginPage from "./pages/SocialLoginPage";
import UserCustomizationDashboard from "./pages/UserCustomizationDashboard";
import PersonalizedDashboard from "./pages/PersonalizedDashboard";
import PolicyImpactSimulator from "./pages/PolicyImpactSimulator";
import CivicLearningChatbot from "./pages/CivicLearningChatbot";
import LegislativeMapVisualization from "./pages/LegislativeMapVisualization";
import BillEmojiSentimentAnalysis from "./pages/BillEmojiSentimentAnalysis";
import AdvancedAnalyticsDashboard from "./pages/AdvancedAnalyticsDashboard";
import VoiceBillSearch from "./pages/VoiceBillSearch";
import MobileOptimizedDashboard from "./pages/MobileOptimizedDashboard";
import PersonalizedRecommendations from "./pages/PersonalizedRecommendations";
import ComprehensiveDataExpansion from "./pages/ComprehensiveDataExpansion";
import TexasLegislatureOnlineCollector from "./pages/TexasLegislatureOnlineCollector";
import AIPoweredLegislativeAlerts from "./components/AIPoweredLegislativeAlerts";
import ModernNavigation from "./components/ModernNavigation";
import { FeedbackBubble } from "./components/feedback/feedback-bubble";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
      <AuthProvider>
      <UserProvider>
        <div className="min-h-screen flex flex-col">
          <ModernNavigation />
          <main className="flex-grow">
            <Switch>
              <Route path="/points-of-order-dashboard" component={PointsOfOrderDashboard} />
              <Route path="/points-of-order/:id" component={PointOfOrderDetail} />
              <Route path="/points-of-order-validation" component={PointsOfOrderValidation} />
              <Route path="/vote-dashboard" component={VoteDashboard} />
              <Route path="/advanced-search" component={AdvancedSearchPage} />
              <Route path="/legislative-impact/:billId" component={LegislativeImpactPage} />
              <Route path="/legislative-impact" component={LegislativeImpactPage} />
              <Route path="/about" component={AboutPage} />
              <Route path="/onboarding" component={OnboardingPage} />

              <Route path="/bills/:billId/summary" component={BillSummaryPage} />
              <Route path="/bills/:billId/timeline" component={BillTimelinePage} />
              <Route path="/bills/:id/annotate" component={BillAnnotatorPage} />
              <Route path="/bills/:id" component={BillDetailPage} />
              <Route path="/timeline-test" component={TimelineTestPage} />
              <Route path="/bills/:billId/enhanced-timeline" component={EnhancedTimelineView} />
              <Route path="/bills/:billId/real-time-timeline" component={RealTimeTimelinePage} />
              <Route path="/legislative-map" component={LegislativeMapVisualization} />
              <Route path="/legislative-map-basic" component={LegislativeMapPage} />
              <Route path="/voice-search" component={VoiceBillSearch} />
              <Route path="/voice-search-basic" component={VoiceSearchPage} />

              <Route path="/dashboard" component={PersonalizedDashboard} />
              <Route path="/dashboard-basic" component={DashboardPage} />
              <Route path="/digest" component={DigestPage} />
              <Route path="/legislator-advanced-profile/:id" component={LegislatorAdvancedProfilePage} />
              <Route path="/legislators/:id" component={LegislatorDetailPage} />
              <Route path="/legislators" component={LegislatorsPage} />
              <Route path="/filing-assistant" component={FilingAssistantPage} />
              <Route path="/ethics-portal/tec-upload" component={TecFileUploadPage} />
              <Route path="/transparency-portal" component={TransparencyPortal} />
              <Route path="/scout-bot/profiles/:id" component={ScoutBotProfilePage} />
              <Route path="/scout-bot/create" component={CreateScoutBotProfilePage} />
              <Route path="/scout-bot/name-processor" component={NameProcessorPage} />
              <Route path="/scout-bot" component={ScoutBotPage} />
              <Route path="/bill-translator" component={BillTranslatorPage} />
              <Route path="/bill-complexity-translator" component={BillComplexityTranslatorPage} />
              <Route path="/data-import" component={DataImportPage} />
              <Route path="/collaborative-amendments" component={CollaborativeAmendmentsPage} />
              <Route path="/enhanced-ai" component={EnhancedAIPage} />
              <Route path="/batch-processing" component={BatchProcessingPage} />
              <Route path="/multimodal-analysis" component={MultimodalAnalysisPage} />
              <Route path="/bill-visual-analysis" component={BillVisualAnalysisPage} />
              <Route path="/contextual-bill-analysis" component={ContextualBillAnalysisPage} />
              <Route path="/collaborative/:id" component={CollaborativeEditPage} />
              <Route path="/collaborative" component={CollaborativePage} />
              <Route path="/collaborative-bill-edit/:id" component={CollaborativeBillEditPage} />
              <Route path="/collaborative-bill-edit" component={CollaborativeBillEditPage} />
              <Route path="/collaborative-annotations/:documentId" component={CollaborativeAnnotationsPage} />
              <Route path="/collaborative-annotations" component={CollaborativeAnnotationsPage} />
              <Route path="/bill-alerts" component={BillAlertsPage} />
              <Route path="/smart-bill-alerts" component={SmartBillAlertsPage} />
              <Route path="/smart-alerts-enhanced" component={SmartAlertsEnhancedPage} />
              <Route path="/shareable-graphics" component={ShareableGraphicsPage} />
              <Route path="/bill-comparison" component={BillComparisonPage} />
              <Route path="/interactive-bill-comparison" component={InteractiveBillComparisonPage} />
              <Route path="/real-time-timeline" component={RealTimeTimelinePage} />
              <Route path="/enhanced-bill/:id" component={EnhancedBillPage} />
              <Route path="/enhanced-bill" component={EnhancedBillPage} />
              <Route path="/ai-search" component={EnhancedAISearchPage} />

              <Route path="/social-sharing" component={SocialSharingPage} />
              <Route path="/advanced-analytics" component={AdvancedAnalyticsDashboard} />
              <Route path="/advanced-analytics-basic" component={AdvancedAnalyticsPage} />
              <Route path="/legislative-intelligence" component={LegislativeIntelligenceDashboard} />
              <Route path="/amendment-playground" component={AmendmentPlaygroundPage} />
              <Route path="/login" component={SocialLoginPage} />
              <Route path="/auth/enhanced" component={EnhancedLoginPage} />
              <ProtectedRoute path="/settings" component={UserCustomizationDashboard} />
              <Route path="/policy-impact" component={PolicyImpactSimulator} />
              <Route path="/civic-learning" component={CivicLearningChatbot} />
              <Route path="/emoji-sentiment" component={BillEmojiSentimentAnalysis} />
              <Route path="/mobile-dashboard" component={MobileOptimizedDashboard} />
              <Route path="/recommendations" component={PersonalizedRecommendations} />
              <Route path="/data-expansion" component={ComprehensiveDataExpansion} />
              <Route path="/texas-legislature-online" component={TexasLegislatureOnlineCollector} />
              <ProtectedRoute path="/admin" component={AdminDashboard} />
              <Route path="/enhanced-bill-suggestions" component={EnhancedBillSuggestionsPage} />
              <Route path="/bill-suggestions" component={BillSuggestionsPage} />
              <Route path="/legislative-updates" component={LegislativeUpdatesPage} />
              <Route path="/legislative" component={LegislativePage} />
              <Route path="/community/suggestions/:id" component={SuggestionDetailPage} />
              <Route path="/community/suggest" component={SuggestBillPage} />
              <Route path="/community" component={CommunityPage} />
              <Route path="/texas/campaign-finance" component={EnhancedCampaignFinance} />

              <Route path="/" component={HomePage} />
            </Switch>
          </main>
          <AIPoweredLegislativeAlerts />
          <FeedbackBubble />
          <Toaster />
        </div>
      </UserProvider>
      </AuthProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
import { Toaster } from "@/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import UserNotRegisteredError from '@/ui/UserNotRegisteredError';
import ScrollToTop from './ui/ScrollToTop';
import ProtectedRoute from '@/ui/ProtectedRoute';
// Add page imports here
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Layout from '@/ui/Layout';
import Dashboard from '@/pages/Dashboard';
import Keywords from '@/pages/Keywords';
import RankTracker from '@/pages/RankTracker';
import SiteAudit from '@/pages/SiteAudit';
import Backlinks from '@/pages/Backlinks';
import Reports from '@/pages/Reports';
import SiteExplorer from '@/pages/SiteExplorer';
import CompareDomains from '@/pages/CompareDomains';
import TrafficAnalytics from '@/pages/TrafficAnalytics';
import MarketOverview from '@/pages/MarketOverview';
import Campaigns from '@/pages/Campaigns';
import ContentIdeas from '@/pages/ContentIdeas';
import Competitors from '@/pages/Competitors';
import Settings from '@/pages/Settings';
import SocialAnalytics from '@/pages/SocialAnalytics';
import SocialPosts from '@/pages/SocialPosts';
import SeoToolsDemo from '@/pages/SeoToolsDemo';
import SitemapExtractor from '@/pages/SitemapExtractor';
import KeywordExtractor from '@/pages/KeywordExtractor';
import Opportunities from '@/pages/Opportunities';
import Alerts from '@/pages/Alerts';
import GscCallback from '@/pages/GscCallback';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      {/* GSC OAuth redirect target — must be public (outside protected layout) */}
      <Route path="/gsc/callback" element={<GscCallback />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/keywords" element={<Keywords />} />
          <Route path="/rank-tracker" element={<RankTracker />} />
          <Route path="/site-audit" element={<SiteAudit />} />
          <Route path="/backlinks" element={<Backlinks />} />
          <Route path="/explorer" element={<SiteExplorer />} />
          <Route path="/traffic-analytics" element={<TrafficAnalytics />} />
          <Route path="/market-overview" element={<MarketOverview />} />
          <Route path="/compare" element={<CompareDomains />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/content" element={<ContentIdeas />} />
          <Route path="/competitors" element={<Competitors />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/social-analytics" element={<SocialAnalytics />} />
          <Route path="/social-posts" element={<SocialPosts />} />
          <Route path="/seo-tools" element={<SeoToolsDemo />} />
          <Route path="/sitemap" element={<SitemapExtractor />} />
          <Route path="/keywords" element={<KeywordExtractor />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/alerts" element={<Alerts />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <ThemeProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
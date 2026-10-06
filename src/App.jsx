import { Toaster } from './components/ui/toaster'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from './lib/query-client'
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from './lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import { AppProvider } from './lib/AppContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Cuisines from './pages/Cuisines';
import CuisineDetail from './pages/CuisineDetail';
import Recipes from './pages/Recipes';
import RecipeDetail from './pages/RecipeDetail';
import Adaptation from './pages/Adaptation';
import Login from './pages/Login';
import Profile from './pages/Profile';
import About from './pages/About';
import MemberProfile from './pages/MemberProfile';
import ProtectedRoute from './components/ProtectedRoute';
import Messages from './pages/Messages';
import Restaurants from './pages/Restaurants';

const LoginRedirect = () => {
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}${location.hash}`;
  return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
};

const AuthenticatedApp = () => {
  // Render the main app
  return (
    <Routes>
      <Route element={<ProtectedRoute unauthenticatedElement={<LoginRedirect />} />}>
       <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/cuisines" element={<Cuisines />} />
        <Route path="/cuisines/:cuisineCode" element={<CuisineDetail />} />
        <Route path="/recipes" element={<Recipes />} />
        <Route path="/restaurants" element={<Restaurants />} />
        <Route path="/saved" element={<Navigate to="/profile?tab=list" replace />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/members/:username" element={<MemberProfile />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/messages/:conversationId" element={<Messages />} />
        <Route path="/about" element={<About />} />
        <Route path="/recipes/:recipeId" element={<RecipeDetail />} />
        <Route path="/recipes/:recipeId/adapt/:countryCode" element={<Adaptation />} />
       </Route>
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Navigate to="/login?mode=register" replace />} />
      <Route path="/forgot-password" element={<Navigate to="/login?mode=forgot" replace />} />
      <Route path="/reset-password" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AppProvider>
            <ScrollToTop />
            <AuthenticatedApp />
          </AppProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App

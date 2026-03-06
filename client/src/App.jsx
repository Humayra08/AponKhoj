import { Route, Routes } from 'react-router';
import Navbar from './Components/Navbar';
import Footer from './Components/Footer';
import ScrollToTop from './Components/ScrollToTop';
import HomePage from './views/HomePage';
import LoginPage from './views/LoginPage';
import RegistrationPage from './views/RegistrationPage';
import ForgotPasswordPage from './views/ForgotPassword';
import RegistrationVerificationPage from './views/RegistrationVerificationPage';
import TermsPage from './views/TermsPage';
import UserProfilePage from './views/UserProfilePage';
import { AuthProvider } from './helpers/AuthContext';
import HelpPage from './views/HelpPage';
import FoundListPage from './views/FoundListPage';
import AboutPage from './views/AboutPage';
import SuccessStoriesPage from './views/SuccessStoriesPage';
import ReportMissingPage from './views/ReportMissingPage';
import './index.css';
import { Toaster } from 'react-hot-toast';
import ReportFoundPage from './views/ReportFoundPage';
import SearchPage from './views/SearchPage';
import UserDashboardPage from './views/UserDashboardPage';

// AponKhoj App
function App() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <ScrollToTop />
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegistrationPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/help" element={<HelpPage />} /> 
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/dashboard" element={<UserDashboardPage />} />
            <Route path="/verify-email" element={<RegistrationVerificationPage />} />
            <Route path="/found" element={<FoundListPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/success-stories" element={<SuccessStoriesPage />} />
            <Route path="/report-missing" element={<ReportMissingPage />} />
          {/* Add more routes here */}
        </Routes>
      </main>
      <Footer />
      <Toaster
        position="top-center"
        toastOptions={{
          error: {
            duration: 5000,
          },
        }}
      />
    </div>
            <Route path="/profile" element={<UserProfilePage />} />
            {/* Add more routes here */}
          </Routes>
        </main>
        <Footer />
        <Toaster
          position="top-center"
          toastOptions={{
            error: {
              duration: 5000,
            },
          }}
        />
      </div>
    </AuthProvider>
  );
}

export default App;

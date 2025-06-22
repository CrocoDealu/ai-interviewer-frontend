import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/contexts/AuthContext.tsx';
import { InterviewProvider } from '@/contexts/InterviewContext.tsx';
import { Header } from '@/components/layout/Header.tsx';
import { Footer } from '@/components/layout/Footer.tsx';
import { Landing } from '@/pages/Landing.tsx';
import { Onboarding } from '@/pages/Onboarding.tsx';
import { Interview } from '@/pages/Interview.tsx';
import { Feedback } from '@/pages/Feedback.tsx';
import { Dashboard } from '@/pages/Dashboard.tsx';
import { Toaster } from '@/components/ui/sonner.tsx';
import './App.css';

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <InterviewProvider>
          <Router>
            <div className="min-h-screen flex flex-col">
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/interview" element={<Interview />} />
                  <Route path="/feedback" element={<Feedback />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                </Routes>
              </main>
              <Footer />
            </div>
            <Toaster />
          </Router>
        </InterviewProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LandingPage } from '@/components/landing/LandingPage';

// Kigumi Studio is a large, self-contained editor (~6.7k LOC plus its own
// Web Awesome components). Load it only when /kigumi-studio is visited so it
// stays out of the landing-page bundle, which shortens the time until the
// landing page's components are registered and the wa-cloak lifts.
const KigumiStudio = lazy(() =>
  import('@/kigumi-studio/KigumiStudio').then((m) => ({
    default: m.KigumiStudio,
  }))
);

function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/kigumi-studio"
          element={
            <Suspense fallback={null}>
              <KigumiStudio />
            </Suspense>
          }
        />
      </Routes>
    </ThemeProvider>
  );
}

export default App;

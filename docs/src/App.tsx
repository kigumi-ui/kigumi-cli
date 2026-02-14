import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LandingPage } from '@/components/landing/LandingPage';
import { KigumiStudio } from '@/kigumi-studio/KigumiStudio';

function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/kigumi-studio" element={<KigumiStudio />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;

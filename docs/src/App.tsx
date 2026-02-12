import { Hero } from '@/components/landing/Hero';
import { ExampleGrid } from '@/components/landing/ExampleGrid';
import { GettingStarted } from '@/components/landing/GettingStarted';
import { Troubleshooting } from '@/components/landing/Troubleshooting';
import { Page } from '@/components/ui/Page/Page';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Footer } from '@/components/landing/Footer';
import { Header } from '@/components/landing/Header';
import { Divider } from '@/components/ui';
import { Banner } from './components/landing/Banner';

function App() {
  return (
    <ThemeProvider>
      <Divider orientation="vertical" className="start-divider" />
      <Divider orientation="vertical" className="end-divider" />
      <Page disable-navigation-toggle>
        <Banner />
        <Header />
        <Hero />
        <Divider className="section-divider" />
        <ExampleGrid />
        <Divider className="section-divider" />
        <GettingStarted />
        <Divider className="section-divider" />
        <Troubleshooting />
        <Divider className="section-divider" />
        <Footer />
      </Page>
    </ThemeProvider>
  );
}

export default App;

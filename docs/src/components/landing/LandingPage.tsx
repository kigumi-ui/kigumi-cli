import { Hero } from '@/components/landing/Hero';
import { ExampleGrid } from '@/components/landing/ExampleGrid';
import { FeatureCards } from '@/components/landing/FeatureCards';
import { Ecosystem } from '@/components/landing/Ecosystem';
import { GettingStartedLanding } from '@/components/landing/GettingStartedLanding';
import { Page } from '@/components/ui/Page/Page';
import { Footer } from '@/components/landing/Footer';
import { Header } from '@/components/landing/Header';
import { Divider } from '@/components/ui';
import { Banner } from '@/components/landing/Banner';

export function LandingPage() {
  return (
    <>
      <Divider orientation="vertical" className="start-divider" />
      <Divider orientation="vertical" className="end-divider" />
      <Page disable-navigation-toggle>
        <Banner />
        <Header />
        <Hero />
        <Divider className="section-divider" />
        <FeatureCards />
        <Divider className="section-divider" />
        <Ecosystem />
        <Divider className="section-divider" />
        <ExampleGrid />
        <Divider className="section-divider" />
        <GettingStartedLanding />
        <Divider className="section-divider" />
        <Footer />
      </Page>
    </>
  );
}

// components/Index.tsx
"use client";

import { CTA } from "./CTA";
import { Features } from "./Features";
import { Footer } from "./Footer";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { Navbar } from "./NavBar";
import { Stats } from "./Stats";
import { Suspense } from "react";
import Testimonials from "./Testimonials";
import { TechCarousel } from "./TechCarousel";
import { LaunchMethods } from "./LaunchMethods";
import { SharedExpenses } from "./SharedExpenses";
import { MetaVerified } from "./MetaVerified";
import { ProductivityGains } from "./ProductivityGains";
import { Pricing } from "./Pricing";
import FAQ from "./FAQ";
import CTA2 from "./CTA2";
import Security from "./Security";

// Defina seus planos de preços
const pricingPlans = [
  {
    name: "STARTER",
    price: "50",
    yearlyPrice: "40",
    priceReal: "250",
    yearlyPriceReal: "200",
    period: "per month",
    features: [
      "Up to 10 projects",
      "Basic analytics",
      "48-hour support response time",
      "Limited API access",
      "Community support",
    ],
    description: "Perfect for individuals and small projects",
    buttonText: "Start Free Trial",
    href: "/sign-up",
    isPopular: false,
  },
  {
    name: "PROFESSIONAL",
    price: "99",
    yearlyPrice: "79",
    priceReal: "495",
    yearlyPriceReal: "395",
    period: "per month",
    features: [
      "Unlimited projects",
      "Advanced analytics",
      "24-hour support response time",
      "Full API access",
      "Priority support",
      "Team collaboration",
      "Custom integrations",
    ],
    description: "Ideal for growing teams and businesses",
    buttonText: "Get Started",
    href: "/sign-up",
    isPopular: true,
  },
  {
    name: "ENTERPRISE",
    price: "299",
    yearlyPrice: "239",
    priceReal: "1495",
    yearlyPriceReal: "1195",
    period: "per month",
    features: [
      "Everything in Professional",
      "Custom solutions",
      "Dedicated account manager",
      "1-hour support response time",
      "SSO Authentication",
      "Advanced security",
      "Custom contracts",
      "SLA agreement",
    ],
    description: "For large organizations with specific needs",
    buttonText: "Contact Sales",
    href: "/contact",
    isPopular: false,
  },
];

// Componente de loading para sections
const SectionSkeleton = () => (
  <div className="min-h-screen animate-pulse">
    <div className="h-16 bg-gray-200 dark:bg-gray-800"></div>
    <div className="container mx-auto px-4 py-20">
      <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mb-4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
    </div>
  </div>
);

const Index = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 overflow-x-hidden">
      <Navbar />

      <Suspense fallback={<SectionSkeleton />}>
        <Hero />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <TechCarousel />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <Features />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <LaunchMethods />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <SharedExpenses />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <CTA />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <MetaVerified />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <ProductivityGains />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <HowItWorks />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <Security />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <Testimonials />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <Pricing plans={pricingPlans} />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <CTA2 />
      </Suspense>

      <Suspense fallback={<SectionSkeleton />}>
        <FAQ />
      </Suspense>

      <Footer />
    </div>
  );
};

export default Index;

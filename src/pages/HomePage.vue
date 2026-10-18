<script setup>
/*
  The single page, assembled from its sections.

  Order matters here and nowhere else: it is the only place the page's shape is
  described, so reordering the site is reordering these lines. Every section owns
  its own data import and its own state.

  Checkpoint 1 restores everything the shell left out. Checkpoint 2 adds the
  instant quote estimator — the section the rest of the page points at.
*/
import HeroSection from "../components/sections/HeroSection.vue";
import MarqueeBar from "../components/sections/MarqueeBar.vue";
import ServicesSection from "../components/sections/ServicesSection.vue";
import ProjectsSection from "../components/sections/ProjectsSection.vue";
import TeamSection from "../components/sections/TeamSection.vue";
import AboutSection from "../components/sections/AboutSection.vue";
import ProcessSection from "../components/sections/ProcessSection.vue";
import TestimonialsSection from "../components/sections/TestimonialsSection.vue";
import PricingSection from "../components/sections/PricingSection.vue";
import QuoteEstimator from "../components/sections/QuoteEstimator.vue";
import ContactSection from "../components/sections/ContactSection.vue";
</script>

<template>
  <main id="main" tabindex="-1">
    <HeroSection />
    <MarqueeBar />
    <ServicesSection />
    <ProjectsSection />
    <TeamSection />
    <AboutSection />
    <ProcessSection />
    <TestimonialsSection />
    <PricingSection />
    <!--
      The estimator sits between the published packs and the enquiry form, in
      that order deliberately: the visitor sees the packs, works out their own
      number against them, then sends it. It is the section the rest of the page
      points at.
    -->
    <QuoteEstimator />
    <ContactSection />
  </main>
</template>

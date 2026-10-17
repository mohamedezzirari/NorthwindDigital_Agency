<script setup>
/*
  The single page, assembled from its sections.

  Order matters here and nowhere else: it is the only place the page's shape is
  described, so reordering the site is reordering these lines. Every section owns
  its own data import and its own state.

  Checkpoint 1 restores everything the shell left out. The quote estimator lands
  next, between Pricing and Contact.
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
import ContactSection from "../components/sections/ContactSection.vue";
</script>

<template>
  <main>
    <HeroSection />
    <MarqueeBar />
    <ServicesSection />
    <ProjectsSection />
    <TeamSection />
    <AboutSection />
    <ProcessSection />
    <TestimonialsSection />
    <PricingSection />
    <ContactSection />
  </main>
</template>

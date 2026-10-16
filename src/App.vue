<script setup>
/*
  Page shell.

  Deliberately no router: this is a single page whose navigation is fragment
  links (#services), not routes. Pre-rendering only ever needs to render one
  document, so introducing vue-router would add weight and a base-path problem
  for the sub-path hosts (GitHub Pages project sites, raw.githack previews)
  without buying anything.

  When more pages do appear, this is the file that grows.
*/
import SiteHeader from "./components/layout/SiteHeader.vue";
import SiteFooter from "./components/layout/SiteFooter.vue";
import HomePage from "./pages/HomePage.vue";
</script>

<template>
  <SiteHeader />
  <HomePage />
  <SiteFooter />
</template>

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
  <!--
    Skip link. It is the first focusable thing on the page, so a keyboard or
    screen-reader visitor reaches the content without walking the whole nav on
    every jump. It is off-screen until focused — not display:none, which would
    remove it from the tab order entirely and defeat the point. The target is
    <main tabindex="-1"> in HomePage.vue, because <main> is not natively
    focusable and without the tabindex the fragment link moves the viewport
    without moving focus.
  -->
  <a class="skip" href="#main">Skip to content</a>
  <SiteHeader />
  <HomePage />
  <SiteFooter />
</template>

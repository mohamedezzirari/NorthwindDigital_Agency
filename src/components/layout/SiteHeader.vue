<script setup>
/*
  Site header. Markup mirrors the original exactly — `.wrap.nav` is a
  three-zone grid (logo left, links centred, CTA right) and the CSS is
  unchanged, so the layout fix from the previous work still applies.
*/
import { ref } from "vue";
import { NAV_LINKS, CTA } from "../../data/content.js";

/*
  Plain path, deliberately NOT an `import`.
  -----------------------------------------
  Images live in public/assets and are copied to the build output untouched, so
  the server-rendered HTML and the client bundle produce byte-identical URLs.
  Importing them through Vite instead hashes the filename, and it was the SSR
  pass that then wrote an absolute "/assets/logo-<hash>.png" while the client
  resolved the same file relative to itself — a mismatch that breaks images on
  sub-path hosts (GitHub Pages project sites, raw.githack previews) whenever
  JavaScript is unavailable.

  The trade-off is no content hash on images. CSS and JS are still hashed.
*/
const logo = "assets/logo.png";

/*
  The only interactive part of the header. `open` drives both the nav's `.open`
  class and the button's aria-expanded, so the visual state and the announced
  state can never drift apart (the old code updated the glyph but left the
  label stale, which is also fixed here).
*/
const open = ref(false);
const toggle = () => (open.value = !open.value);
const close = () => (open.value = false);
</script>

<template>
  <header>
    <div class="wrap nav">
      <a class="logo" href="#home">
        <img class="lg" :src="logo" alt="Northwind Digital" width="737" height="167"
          style="height:46px;width:auto">
      </a>

      <button id="menu" :aria-expanded="open" :aria-label="open ? 'Close menu' : 'Open menu'"
        aria-controls="links" @click="toggle">{{ open ? "✕" : "☰" }}</button>

      <nav id="links" class="links" :class="{ open }" aria-label="Main">
        <a v-for="link in NAV_LINKS" :key="link.href" :href="link.href" @click="close">{{ link.label }}</a>
        <a class="btn nav-cta-mobile" :href="CTA.href" @click="close">{{ CTA.label }}</a>
      </nav>

      <a class="btn nav-cta" :href="CTA.href">{{ CTA.label }}</a>
    </div>
  </header>
</template>

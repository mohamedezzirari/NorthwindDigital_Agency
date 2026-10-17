<script setup>
/*
  The scrolling word band under the hero.

  Decorative, so the whole thing is aria-hidden — a screen reader gains nothing
  from hearing the same seven words twice. The CSS animation translates the
  track by -50%, which is why the list is rendered twice: the second pass is what
  scrolls into view as the first leaves, so the loop has no visible seam.
*/
import { MARQUEE_WORDS } from "../../data/content.js";

const track = [...MARQUEE_WORDS, ...MARQUEE_WORDS];
</script>

<template>
  <div class="marq" aria-hidden="true">
    <div class="track">
      <span v-for="(word, i) in track" :key="i">{{ word }}</span>
    </div>
  </div>
</template>

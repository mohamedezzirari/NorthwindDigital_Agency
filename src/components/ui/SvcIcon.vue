<script setup>
/*
  One glyph from the service grid.

  Renders the INNER markup of the icon inside a 24x24 <svg> that carries the
  shared presentation attributes, so the icon takes its colour from whatever it
  sits inside via currentColor.

  A service naming a key that does not exist in ICONS falls back to printing the
  key as text — the same behaviour the old js/main.js had, and the reason a typo
  in content.js degrades to a letter instead of leaving an empty box.

  v-html is safe here: the only thing that ever reaches it is a string literal
  from data/icons.js, which is our own build-time data and never user input.
*/
import { computed } from "vue";
import { ICONS } from "../../data/icons.js";

const props = defineProps({
  name: { type: String, default: "" },
});

const inner = computed(() => ICONS[props.name] ?? null);
</script>

<template>
  <svg v-if="inner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" v-html="inner" />
  <template v-else>{{ name }}</template>
</template>

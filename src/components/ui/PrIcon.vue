<script setup>
/*
  A pricing glyph: the feature tick, the "most popular" star, or the promo tag.

  The three differ in their fill/stroke settings, so those travel with the
  markup in data/icons.js rather than being repeated here. `attrs` is bound as a
  whole so the values land as real presentation attributes on the <svg>, which is
  what makes them inherit currentColor the same way the hand-written markup did.

  `size` defaults to the 18px the feature ticks used; the star and the tag pass
  their own (14 and 16).
*/
import { computed } from "vue";
import { PR_ICONS } from "../../data/icons.js";

const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 18 },
});

const icon = computed(() => PR_ICONS[props.name]);
</script>

<template>
  <svg viewBox="0 0 24 24" :width="size" :height="size" aria-hidden="true" focusable="false"
    v-bind="icon.attrs" v-html="icon.inner" />
</template>

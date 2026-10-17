<script setup>
/*
  Client feedback.

  The copy says these are placeholders and each card repeats that in its own
  note, which is deliberate: it is much harder to ship fake testimonials by
  accident when the page says so out loud.
*/
import { TESTS } from "../../data/content.js";
</script>

<template>
  <section id="testimonials" class="dark">
    <div class="wrap">
      <h2>Client feedback</h2>
      <p class="lead">These are sample placeholders, not real clients. Replace them with genuine
        feedback.</p>
      <div class="cols">
        <blockquote v-for="(test, i) in TESTS" :key="i" class="card">
          <p class="quote">“{{ test.quote }}”</p>
          <div class="who">{{ test.who }}</div>
          <div class="note">Placeholder, not a real client</div>
        </blockquote>
      </div>
    </div>
  </section>
</template>

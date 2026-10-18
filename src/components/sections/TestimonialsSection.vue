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
          <!--
            The glyphs are aria-hidden; the rating is announced once per card
            from the wrapper's label, so a screen reader hears "5 out of 5"
            rather than "star star star star star".
          -->
          <div class="stars" :aria-label="`${test.stars} out of 5 stars`" role="img">
            <span aria-hidden="true">
              <span v-for="n in 5" :key="n" :class="{ on: n <= test.stars }">★</span>
            </span>
          </div>
          <p class="quote">“{{ test.quote }}”</p>
          <div class="who">{{ test.who }}</div>
          <div class="note">Placeholder, not a real client</div>
        </blockquote>
      </div>
    </div>
  </section>
</template>

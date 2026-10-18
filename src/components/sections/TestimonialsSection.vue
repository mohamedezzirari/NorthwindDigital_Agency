<script setup>
/*
  Client feedback.

  The copy says these are placeholders and each card repeats that in its own
  note, which is deliberate: it is much harder to ship fake testimonials by
  accident when the page says so out loud.

  The rating summary is computed from the same TESTS array the cards render
  from, so the headline average can never drift from the stars beside it.
  Everything is computed at setup time (not in the template) because the page
  is server-rendered: the figures must be in the static HTML before any client
  JS runs.
*/
import { TESTS } from "../../data/content.js";

const average = TESTS.reduce((sum, t) => sum + t.stars, 0) / TESTS.length;
const averageLabel = average.toFixed(1);

/* Round for the glyph row: a 4.7 summary draws five filled stars only if it
   rounds there — the label carries the precise figure. */
const summaryFilled = Math.round(average);

/* Initials for the avatar disc — same idea as lib/avatar.js, but for a name
   that is always the placeholder "Client Name", so two letters is plenty. */
const initialsOf = (name) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
</script>

<template>
  <section id="testimonials" class="dark">
    <div class="wrap">
      <div class="tst-head">
        <div>
          <h2>Client feedback</h2>
          <p class="lead">These are sample placeholders, not real clients. Replace them with genuine
            feedback.</p>
        </div>
        <!--
          The summary is decorative-plus-labelled: the number and glyphs are
          aria-hidden as a group and announced once via the label, the same
          pattern each card's star row uses.
        -->
        <div class="tst-score" role="img" :aria-label="`Rated ${averageLabel} out of 5`">
          <strong class="tst-score__num">{{ averageLabel }}</strong>
          <span class="stars" aria-hidden="true">
            <span v-for="n in 5" :key="n" :class="{ on: n <= summaryFilled }">★</span>
          </span>
          <span class="tst-score__cap" aria-hidden="true">average · {{ TESTS.length }} reviews</span>
        </div>
      </div>

      <div class="cols tst-grid">
        <blockquote v-for="(test, i) in TESTS" :key="i" class="card tst-card">
          <!--
            The glyphs are aria-hidden; the rating is announced once per card
            from the wrapper's label, so a screen reader hears "5 out of 5
            stars" rather than "star star star star star".
          -->
          <div class="stars" :aria-label="`${test.stars} out of 5 stars`" role="img">
            <span aria-hidden="true">
              <span v-for="n in 5" :key="n" :class="{ on: n <= test.stars }">★</span>
            </span>
          </div>

          <p class="quote">“{{ test.quote }}”</p>

          <div class="tst-by">
            <span class="tst-av" aria-hidden="true">{{ initialsOf(test.name) }}</span>
            <span class="tst-who">
              <span class="tst-name">{{ test.name }}</span>
              <span class="tst-co">{{ test.company }}</span>
            </span>
          </div>
          <div class="note">Placeholder, not a real client</div>
        </blockquote>
      </div>
    </div>
  </section>
</template>

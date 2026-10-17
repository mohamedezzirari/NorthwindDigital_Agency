<script setup>
/*
  About us, side by side with "Why choose us".

  The two-column grids use .cols, whose default is auto-fit at a 260px minimum.
  The "why" grid overrides that to a fixed two columns, and the stat strip to
  three — the same overrides the original carried as inline styles, kept inline
  here because they are one-off layout tweaks rather than a reusable pattern.
*/
import { WHY, STATS } from "../../data/content.js";
</script>

<template>
  <section id="about" class="dark">
    <div class="wrap split">
      <div>
        <h2>About us</h2>
        <p class="lead">We are a small, senior team that combines creative design, solid engineering
          and data-driven marketing. We explain what we are doing, share progress openly and judge
          our work by your business results.</p>
        <div class="mission">Our mission: help ambitious businesses grow through digital work they
          are proud of.</div>
        <a class="btn" href="#contact">Talk to the team</a>
      </div>

      <div>
        <h2>Why choose us</h2>
        <div class="cols" style="grid-template-columns:1fr 1fr">
          <div v-for="reason in WHY" :key="reason.title" class="card">
            <h3>{{ reason.title }}</h3>
            <p>{{ reason.body }}</p>
          </div>
        </div>

        <div class="cols" style="grid-template-columns:repeat(3,1fr);margin-top:24px">
          <div v-for="stat in STATS" :key="stat.label" class="stat">
            <strong>{{ stat.value }}</strong>
            <small>{{ stat.label }}</small>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

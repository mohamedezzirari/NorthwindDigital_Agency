<script setup>
/*
  Hero.

  The only dynamic part is the bar chart's heights, which are decorative. They
  live in an array here rather than as seven hand-written inline styles, so the
  template stays readable and the values are easy to tweak in one place.

  The window mock is aria-hidden: it is a picture of a dashboard, not a real one,
  and announcing "Monthly visitors +128%" to a screen reader would be a lie.
*/
import { CTA } from "../../data/content.js";

const CHART = [22, 34, 30, 52, 64, 80, 96];
</script>

<template>
  <section id="home" class="hero">
    <div class="wrap grid">
      <div>
        <h1>Build it. Launch it. Grow it.</h1>
        <p>Behind every small business is a big dream, a risk someone took, and a vision worth
          fighting for. We’re here to help turn that dream into something real. Through design,
          development, and marketing, we help ambitious founders break through barriers, reach more
          people, and build a business they’re proud of — bringing their first $1M closer than ever.</p>
        <div class="cta">
          <a class="btn" :href="CTA.href">{{ CTA.label }}</a>

          <a class="btn ghost" href="#projects">Explore Our Work</a>
        </div>
      </div>

      <div class="win" aria-hidden="true">
        <div class="bar"><b></b><b></b><b></b></div>
        <div class="body">
          <div class="kpi"><span>Monthly visitors (sample)</span><strong>+128%</strong></div>
          <div class="chart">
            <span v-for="(height, i) in CHART" :key="i" :style="{ height: height + '%' }"></span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

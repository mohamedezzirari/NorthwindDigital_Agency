<script setup>
/*
  Checkpoint 0 scope: the static shell of the page — hero and marquee. Neither
  depends on data or state, so they can be lifted across verbatim and give a
  realistic render to check the CSS, assets and pre-render against.

  Still to come:
    Checkpoint 1 — services, projects, team, about, process, testimonials
    Checkpoint 2 — pricing, contact
*/
const MARQUEE = ["Websites", "Web apps", "E-commerce", "SEO", "Meta ads", "Content", "Conversion"];

/* The ticker repeats the list once so the loop has something to scroll into.
   The original hand-wrote all fourteen spans; this derives the second pass. */
const track = [...MARQUEE, ...MARQUEE];
</script>

<template>
  <main>
    <section id="home" class="hero">
      <div class="wrap grid">
        <div>
          <h1>Build it. Launch it. Grow it.</h1>
          <p>Behind every small business is a big dream, a risk someone took, and a vision worth fighting for.
            We’re here to help turn that dream into something real. Through design, development, and
            marketing, we help ambitious founders break through barriers, reach more people, and build a
            business they’re proud of — bringing their first $1M closer than ever.</p>
          <div class="cta">
            <a class="btn" href="#contact">Start a Project</a>
            <a class="btn ghost" href="#projects">Explore Our Work</a>
          </div>
        </div>

        <!-- Decorative product mock. Height percentages are intentionally inline
             for now; they move into CSS custom properties at Checkpoint 3. -->
        <div class="win" aria-hidden="true">
          <div class="bar"><b></b><b></b><b></b></div>
          <div class="body">
            <div class="kpi"><span>Monthly visitors (sample)</span><strong>+128%</strong></div>
            <div class="chart">
              <span style="height:22%"></span>
              <span style="height:34%"></span>
              <span style="height:30%"></span>
              <span style="height:52%"></span>
              <span style="height:64%"></span>
              <span style="height:80%"></span>
              <span style="height:96%"></span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="marq" aria-hidden="true">
      <div class="track">
        <span v-for="(word, i) in track" :key="i">{{ word }}</span>
      </div>
    </div>
  </main>
</template>

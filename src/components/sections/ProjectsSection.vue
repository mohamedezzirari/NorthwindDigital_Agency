<script setup>
/*
  Selected projects — a horizontal scroller with prev/next and a slow autoplay.

  The cards are image-only by design: content.js carries an image and alt text
  and nothing else, so there is nothing here to render as a title or blurb.

  The scroll maths is ported from the old js/main.js:
    - "next" at the far right wraps to the start, and "prev" at the far left
      wraps to the end, so the arrows never dead-end;
    - the autoplay interval is paused whenever the visitor is engaging with the
      strip (hover, touch, keyboard focus) and resumes on the way out;
    - it never starts at all when the visitor has asked for reduced motion.

  #proj must keep its id: the carousel's flex/scroll-snap layout is keyed on it
  in the stylesheet, and .cols alone would give it a grid layout instead.
*/
import { onMounted, onUnmounted, ref } from "vue";
import { PROJECTS } from "../../data/content.js";

/* Fallback gradient pair for a project that ships without an image. */
const FALLBACK_COLS = ["#14173D", "#7B86FF"];

const root = ref(null);
const track = ref(null);
let timer = null;

/* One card plus the 20px gap the track uses. */
function step() {
  const first = track.value?.firstElementChild;
  return first ? first.getBoundingClientRect().width + 20 : 0;
}

function go(direction) {
  const el = track.value;
  if (!el) return;
  const max = el.scrollWidth - el.clientWidth;

  if (direction > 0 && el.scrollLeft >= max - 4) el.scrollTo({ left: 0 });
  else if (direction < 0 && el.scrollLeft <= 4) el.scrollTo({ left: max });
  else el.scrollBy({ left: direction * step() });
}

function stop() {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
}

function play() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  stop();
  timer = window.setInterval(() => go(1), 4500);
}

onMounted(() => {
  const el = root.value;
  if (!el) return;
  /* Passive on the pointer events: we never call preventDefault, and saying so
     lets the browser keep scrolling off the main thread. */
  el.addEventListener("mouseenter", stop, { passive: true });
  el.addEventListener("touchstart", stop, { passive: true });
  el.addEventListener("focusin", stop);
  el.addEventListener("mouseleave", play);
  el.addEventListener("focusout", play);
  play();
});

onUnmounted(stop);

/* An image becomes a background so it can sit under the rounded .shot frame and
   be cropped by background-size:cover; the gradient stands in when there is no
   image, and .mock then draws a wireframe on top of it. */
function shotStyle(project) {
  const cols = project.c || FALLBACK_COLS;
  return {
    "--a": cols[0],
    backgroundImage: project.img
      ? `url('${project.img}')`
      : `linear-gradient(135deg,${cols[0]},${cols[1]})`,
  };
}
</script>

<template>
  <section id="projects" ref="root" class="dark">
    <div class="wrap">
      <h2>Selected projects</h2>
      <p class="lead">A selection of recent work.</p>

      <div id="proj" ref="track" class="cols" tabindex="0"
        aria-label="Projects, slides from left to right">
        <article v-for="(project, i) in PROJECTS" :key="i" class="card proj">
          <div class="shot" :style="shotStyle(project)" :role="project.alt ? 'img' : undefined"
            :aria-label="project.alt || undefined">
            <div v-if="!project.img" class="mock">
              <span><i></i><i></i><i></i></span><b></b><u></u><u></u><s></s>
            </div>
          </div>
        </article>
      </div>

      <div class="sl-ctl">
        <button type="button" aria-label="Previous project" @click="go(-1)">←</button>
        <button type="button" aria-label="Next project" @click="go(1)">→</button>
      </div>
    </div>
  </section>
</template>

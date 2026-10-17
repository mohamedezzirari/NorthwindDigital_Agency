<script setup>
/*
  "How we work" — an ordered list.

  The step numbers come from a CSS counter on .steps li, not from the data and
  not from the markup, so reordering STEPS in content.js renumbers the cards with
  no other change. That is also why this is an <ol> and not a <ul>: the order is
  meaningful, and the list semantics survive with CSS disabled.
*/
import { STEPS } from "../../data/content.js";
</script>

<template>
  <section id="process">
    <div class="wrap">
      <h2>How we work</h2>
      <ol class="steps">
        <li v-for="step in STEPS" :key="step.title">
          <h3>{{ step.title }}</h3>
          <p>{{ step.body }}</p>
        </li>
      </ol>
    </div>
  </section>
</template>

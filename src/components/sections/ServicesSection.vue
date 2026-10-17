<script setup>
/*
  Services, in two groups.

  The old version injected this with innerHTML and a template string. Here each
  card is a real element the compiler knows about, so the icon component can be
  used directly instead of being flattened into a string.

  The wrapper div the original had around this grid carried an id but no styles,
  so it is gone — the groups sit straight inside .wrap.
*/
import { SERVICES } from "../../data/content.js";
import SvcIcon from "../ui/SvcIcon.vue";
</script>

<template>
  <section id="services">
    <div class="wrap">
      <h2>Services that lead to results</h2>
      <p class="lead">Every service is tied to an outcome you can measure: more visitors, more leads,
        more sales.</p>

      <div v-for="group in SERVICES" :key="group.group" class="svc-group">
        <h3>{{ group.group }}</h3>
        <div class="cols">
          <article v-for="service in group.items" :key="service.name" class="card">
            <div class="ico"><SvcIcon :name="service.icon" /></div>
            <h3>{{ service.name }}</h3>
            <p>{{ service.desc }}</p>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

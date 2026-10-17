<script setup>
/*
  The team, as one clustered "group photo".

  Each person is a lanyard-and-ID-badge figure rather than a card. The stagger
  and overlap that make it read as a group shot are pure CSS (nth-child offsets
  on .tp), so the markup stays a flat list.

  avatarFor() only falls back to a generated initials tile when a member has no
  photo — everyone in content.js currently has one.

  Note: the `bio`, `skills` and `links` fields still exist in the data but are
  not drawn here. The badge treatment replaced the earlier card layout, and the
  fields were kept rather than deleted so the richer version can come back
  without re-authoring the content.
*/
import { TEAM } from "../../data/content.js";
import { avatarFor } from "../../lib/avatar.js";

/* First-appearance order, deduped — Set preserves insertion order, so the
   legend reads Development Team then Marketing Team as long as the data does. */
const groups = [...new Set(TEAM.map((member) => member.group))];
</script>

<template>
  <section id="team">
    <div class="wrap">
      <h2>The people behind the work</h2>
      <p class="lead">The people you will work with directly — one team, across design, development
        and marketing.</p>

      <div class="team-photo">
        <figure v-for="(member, i) in TEAM" :key="member.name" class="tp">
          <div class="tp-face">
            <img :src="avatarFor(member, i)" :alt="`Portrait of ${member.name}`" loading="lazy">
          </div>
          <div class="tp-strap" aria-hidden="true"></div>
          <figcaption class="tp-badge">
            <span class="tp-mark" aria-hidden="true">N</span>
            <span class="tp-name">{{ member.name }}</span>
            <span class="tp-role">{{ member.role }}</span>
          </figcaption>
        </figure>
      </div>

      <div class="tp-legend">
        <span v-for="group in groups" :key="group">{{ group }}</span>
      </div>
    </div>
  </section>
</template>

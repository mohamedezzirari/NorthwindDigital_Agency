<script setup>
/*
  Site footer. Contact details, socials and the year all come from data, and
  because they are rendered here they land in the pre-rendered HTML too — which
  the old client-side version could not do.
*/
import { SITE, NAV_LINKS, FOOTER_SERVICES } from "../../data/content.js";

/* Public path, not an import — see the note in SiteHeader.vue for why. */
const logo = "assets/logo.png";

/*
  Evaluated at build time during pre-render and again on hydration. Both run in
  the same year in practice, so there is no mismatch. (A site left unbuilt over
  New Year would show a stale year until the next build.)
*/
const year = new Date().getFullYear();
const mailto = `mailto:${SITE.email}`;
</script>

<template>
  <footer>
    <div class="wrap">
      <div class="cols">
        <div>
          <a class="logo" href="#home" style="color:#fff">
            <img class="lg" :src="logo" alt="Northwind Digital" width="737" height="167"
              style="height:54px;width:auto">
          </a>
          <p style="margin-top:12px">Web development and digital marketing for businesses that want to grow.</p>
        </div>

        <div>
          <h4>Navigate</h4>
          <a v-for="link in NAV_LINKS" :key="link.href" :href="link.href">{{ link.label }}</a>
        </div>

        <div>
          <h4>Services</h4>
          <a v-for="service in FOOTER_SERVICES" :key="service.label" :href="service.href">{{ service.label }}</a>
        </div>

        <div>
          <h4>Contact</h4>
          <a :href="mailto">{{ SITE.email }}</a>
          <div>
            <a v-for="(url, name) in SITE.socials" :key="name" :href="url" target="_blank" rel="noopener">{{
              name }}</a>
          </div>
        </div>
      </div>

      <div class="copy">© <span>{{ year }}</span> <span>{{ SITE.name }}</span>. All rights reserved.</div>
    </div>
  </footer>
</template>

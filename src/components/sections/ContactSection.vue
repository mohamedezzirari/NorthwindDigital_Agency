<script setup>
/*
  Contact.

  The form is validated in the browser and then handed to the visitor's own mail
  client — there is no backend any more (the old server/ has been removed), so
  a mailto: is the honest fallback rather than a fake "message sent".

  Point FORM_ENDPOINT at a form service (Formspree, Web3Forms) and the same
  submit path posts JSON to it instead; the validation and the status messages
  are shared, so only the transport changes.

  Two deliberate differences from the original:
    - the hidden "website" honeypot field is gone. It existed to give the
      Express API something to reject, and with no API it protects nothing.
    - novalidate stays, because the custom messages are better than the browser's
      and the .err slots are already there for them. The required/minlength
      attributes stay too, so the field semantics survive with JavaScript off.
*/
import { reactive, ref, watch } from "vue";
import { SITE, SERVICE_NAMES, BUDGETS } from "../../data/content.js";


/* Empty string means "fall back to the visitor's email app". */
const FORM_ENDPOINT = "";

const form = reactive({ name: "", email: "", service: "", budget: "", msg: "" });
const errors = reactive({ name: "", email: "", service: "", budget: "", msg: "" });
const status = reactive({ state: "", text: "" });
const sending = ref(false);

const whatsappHref =
  `https://wa.me/${SITE.whatsapp}?text=` +
  encodeURIComponent("Hi, I'd like to discuss a project.");
const mailto = `mailto:${SITE.email}`;

/* Each rule returns true, or the message to show under the field. */
const rules = {
  name: (v) => v.trim().length > 1 || "Enter your name.",
  email: (v) =>
    /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) || "Enter a valid email, like name@company.com.",
  service: (v) => !!v || "Choose a service.",
  budget: (v) => !!v || "Choose a budget range.",
  msg: (v) => v.trim().length >= 20 || "Describe your project in at least 20 characters.",
};

function validate() {
  let ok = true;
  for (const field of Object.keys(rules)) {
    const result = rules[field](form[field]);
    errors[field] = result === true ? "" : result;
    if (errors[field]) ok = false;
  }
  return ok;
}

async function submit() {
  if (!validate()) {
    status.state = "bad";
    status.text = "Please fix the highlighted fields and send again.";
    return;
  }

  const details = { ...form };
  sending.value = true;

  try {
    if (FORM_ENDPOINT) {
      const response = await fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(details),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        const first = body && body.errors ? Object.values(body.errors)[0] : null;
        throw new Error(first || "The message could not be sent.");
      }
      status.state = "ok";
      status.text =
        (body && body.message) ||
        `Thanks, ${details.name}. We received your project details and will reply soon.`;
      reset();
    } else {
      const body =
        `Name: ${details.name}\n` +
        `Email: ${details.email}\n` +
        `Service: ${details.service}\n` +
        `Budget: ${details.budget}\n\n` +
        details.msg;

      window.location.href =
        `${mailto}?subject=${encodeURIComponent(`Project enquiry: ${details.service}`)}` +
        `&body=${encodeURIComponent(body)}`;

      status.state = "ok";
      status.text =
        "Your email app should open with the details filled in. Press send to finish. " +
        `If nothing opens, email ${SITE.email} directly.`;
    }
  } catch (error) {
    status.state = "bad";
    status.text =
      (error && error.message) ||
      `The message could not be sent. Email us at ${SITE.email} or use WhatsApp.`;
  } finally {
    sending.value = false;
  }
}

function reset() {
  for (const field of Object.keys(form)) form[field] = "";
  for (const field of Object.keys(errors)) errors[field] = "";
}


</script>

<template>
  <section id="contact">
    <div class="wrap split">
      <div>
        <h2>Tell us about your project</h2>
        <p class="lead">Share a few details and we will reply with next steps and a rough estimate.</p>

        <ul class="contact-list">
          <li>Email: <a :href="mailto">{{ SITE.email }}</a></li>
        </ul>

        <a class="btn" :href="whatsappHref" target="_blank" rel="noopener">Chat on WhatsApp</a>

        <p class="note" style="margin-top:20px">
          <a v-for="(url, name) in SITE.socials" :key="name" :href="url" target="_blank"
            rel="noopener">{{ name }}</a>
        </p>
      </div>

      <form novalidate @submit.prevent="submit">
        <div class="row">
          <label>Name
            <input v-model="form.name" name="name" autocomplete="name" required
              :aria-invalid="!!errors.name">
            <span class="err">{{ errors.name }}</span>
          </label>
          <label>Email
            <input v-model="form.email" name="email" type="email" autocomplete="email" required
              :aria-invalid="!!errors.email">
            <span class="err">{{ errors.email }}</span>
          </label>
        </div>

        <div class="row">
          <label>Service needed
            <select v-model="form.service" name="service" required :aria-invalid="!!errors.service">
              <option value="">Choose a service</option>
              <option v-for="name in SERVICE_NAMES" :key="name" :value="name">{{ name }}</option>
            </select>
            <span class="err">{{ errors.service }}</span>
          </label>
          <label>Budget range
            <select v-model="form.budget" name="budget" required :aria-invalid="!!errors.budget">
              <option value="">Choose a range</option>
              <option v-for="band in BUDGETS" :key="band" :value="band">{{ band }}</option>
            </select>
            <span class="err">{{ errors.budget }}</span>
          </label>
        </div>

        <label>Project description
          <textarea v-model="form.msg" name="msg" required minlength="20"
            :aria-invalid="!!errors.msg"></textarea>
          <span class="err">{{ errors.msg }}</span>
        </label>

        <button class="btn" type="submit" :disabled="sending">
          {{ sending ? "Sending…" : "Send project details" }}
        </button>

        <div id="status" role="status" :class="status.state">{{ status.text }}</div>
      </form>
    </div>
  </section>
</template>

/*
  The app's one piece of shared state: an estimate the visitor just built,
  waiting to be handed to the enquiry form.

  Why a module-level ref instead of lifting state up through HomePage:
  the two sections are siblings, but the estimator's whole point is to *leave*
  that section — its action is a link that scrolls to #contact. Threading that
  through a parent would mean the parent owning a submit event the estimator
  fires from an <a>, which is harder to follow than it is worth.

  Initial value is null on both sides, so the pre-rendered HTML and the hydrated
  client agree — nothing is read out of localStorage here, which is what keeps
  the server and client output identical at build time.
*/
import { ref } from "vue";

export const pendingEstimate = ref(null);

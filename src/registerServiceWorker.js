/* eslint-disable no-console */

import { register } from "register-service-worker";

if (process.env.NODE_ENV === "production") {
  register(`${process.env.BASE_URL}service-worker.js`, {
    ready() {
      console.log(
        "App is being served from cache by a service worker.\n" +
          "For more details, visit https://goo.gl/AFskqB",
      );
    },
    registered() {
      console.log("Service worker has been registered.");
    },
    cached() {
      console.log("Content has been cached for offline use.");
    },
    updatefound() {
      console.log("New content is downloading.");
    },
    updated() {
      // New version installed and active. Skip the infamous auto-`location.reload()`
      // (it fires mid-session and looks like a random page refresh, e.g. right after
      // picking a sound). skipWaiting + clientsClaim already activate the new
      // service worker; it claims this page on the next natural navigation/reload.
      console.log(
        "New content is available; will be active on next load.",
      );
    },
    offline() {
      console.log(
        "No internet connection found. App is running in offline mode.",
      );
    },
    error(error) {
      console.error("Error during service worker registration:", error);
    },
  });
}

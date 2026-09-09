import Vue from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "@/router";
import store from "@/store";
import vuetify from "@/plugins/vuetify";
import VueGtag from "vue-gtag";
import { i18n } from "@/i18n";

if (window.location.hostname === "noterender.denzyl.io") {
  Vue.use(VueGtag, {
    config: { id: "GTM-T4VDGKR" },
  });
}
Vue.config.productionTip = false;

new Vue({
  router,
  store,
  vuetify,
  i18n,
  render: (h) => h(App),
}).$mount("#app");

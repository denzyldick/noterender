import Vue from "vue";
import Vuetify from "vuetify";
import "@fortawesome/fontawesome-free/css/all.css"; // Ensure you are using css-loader
Vue.use(Vuetify);

export default new Vuetify({
  iconfont: "fa", // 'mdi' || 'mdiSvg' || 'md' || 'fa' || 'fa4' || 'faSvg'
});

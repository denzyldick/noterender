import Vue from "vue";
import Vuetify from "vuetify";
import "@fortawesome/fontawesome-free/css/all.css"; // Ensure you are using css-loader
Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    dark: true,
    themes: {
      dark: {
        primary: "#00E5FF", // Cyan A400
        secondary: "#FF4081", // Pink A200
        accent: "#7C4DFF", // Deep Purple A200
        error: "#FF5252",
        info: "#2196F3",
        success: "#4CAF50",
        warning: "#FB8C00",
      },
    },
  },
  icons: {
    iconfont: "mdi",
  },
});

<template>
  <v-app>
    <v-main class="d-flex flex-rows mb-6 bg-surface-variant">
      <RouterView></RouterView>
    </v-main>
  </v-app>
</template>
<script>
import Home from "./views/Home.vue";
import Setting from "./views/Setting.vue";
// import init, {MediaRecorder} from "media-recorder";
// import Socket from "./js/Socket";
export default {
  name: "App",

  components: {
    Setting,
    Home,
  },

  data: () => ({
    loading: false,
    selection: 1,
    play: false,
  }),
  computed: {
    dialog: {
      set: function (newvalue) {
        // this.$store.dispatch('toggleDialog');
      },
      get: function () {
        return this.$store.state.dialog;
      },
    },
  },
  methods: {
    close: function () {
      this.$store.dispatch("toggleSetting", false);
      this.$store.dispatch("toggleVisualizer", true);
    },
    reserve() {
      this.loading = true;

      setTimeout(() => (this.loading = false), 2000);
    },
  },
  mounted() {
    document.getElementById("globalLoader").style.display = "none";
  },
};
</script>

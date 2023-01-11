<template>
  <v-app>
    <Home @playing="dialog()" @setting="setting = true" />
    <!--    <v-row justify="center">-->
    <!--      <v-dialog-->
    <!--          v-model="dialog"-->
    <!--          max-width="400"-->
    <!--      >-->
    <!--        <v-card-->
    <!--            :loading="loading"-->
    <!--        >-->
    <!--          <template slot="progress">-->
    <!--            <v-progress-linear-->
    <!--                color="deep-purple"-->
    <!--                height="10"-->
    <!--                indeterminate-->
    <!--            ></v-progress-linear>-->
    <!--          </template>-->

    <!--          <v-img-->
    <!--              src="/img/logo.svg"-->
    <!--          ></v-img>-->
    <!--          <v-card-text>-->
    <!--            <v-row>-->
    <!--              <v-col>-->
    <!--              </v-col>-->
    <!--            </v-row>-->
    <!--          </v-card-text>-->
    <!--          <v-card-text>-->
    <!--          </v-card-text>-->
    <!--        </v-card>-->
    <!--      </v-dialog>-->

    <!--    </v-row>-->
  </v-app>
</template>

<script>
import Home from "./views/Home.vue";
import Setting from "./views/Setting.vue";
// import init, {MediaRecorder} from "media-recorder";
import Socket from "./js/Socket";
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

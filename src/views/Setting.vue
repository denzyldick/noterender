<template>
  <v-layout>
    <v-main class="" style="padding-top: 10px;height: 86%;overflow-y: scroll;overflow-x: hidden; ">
      <v-row height=100%>
        <v-col offset-md=1 lg=12 md=12 sm=12>
          <v-title class="text-h2" v-if="tab === 0"><v-icon size="larger" color="#CE93D8">mdi-brush</v-icon>
            Style</v-title>
          <v-title class="text-h2" v-if="tab === 1"><v-icon size="larger" color="#90CAF9">mdi-speaker</v-icon>
            Sound</v-title>
          <v-title class="text-h2" v-if="tab === 2"><v-icon size="larger" color="#80CBC4">mdi-camera</v-icon>
            Camera</v-title>
          <v-title class="text-h2" v-if="tab === 3"><v-icon size="larger" color="#EF9A9A'">mdi-heart</v-icon>
            Branding</v-title>
          <v-title class="text-h2" v-if="tab === 4"><v-icon size="larger" color="#C5E1A5">mdi-download</v-icon>
            Download</v-title>
        </v-col>
        <v-col lg=12 md=12 sm=12>
          <v-row>
            <v-col md=10 offset-md=1>
              <Templates style="margin-top: 10px; " v-if="tab === 0" />
            </v-col>
          </v-row>
          <v-row>
            <v-col offset-md=1 md="10" sm="12" lg="12" v-if="tab === 1">
              <v-list three-line subheader v-if="tab === 1">
                <v-card-title>Sound source</v-card-title>
                <v-card-subtitle>Upload your own sound or use your microphone to record a real-time
                  sound.</v-card-subtitle>
                <v-list-item>
                  <v-list-item-content>
                    <v-list-item>
                      <v-list-item-content>
                        <v-file-input :rules="rules" accept="audio/*" prepend-icon="mdi-music"
                          label="Choose your sound." outlined dense v-model="sound"
                          @change="soundSelected($event)"></v-file-input>
                      </v-list-item-content>
                    </v-list-item>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>

          <v-col offset-md=1 lg=12 md=10 sm=12 v-if="tab === 2">
            <v-list three-line subheader v-if="tab === 2">
              <v-list-item>
                <v-list-item-content>
                  <v-card-title> Camera</v-card-title>
                  <v-card-subtitle>Change the camera settings.</v-card-subtitle>
                  <v-row>
                    <v-col md="12">
                      <v-list-item>
                        <v-checkbox :label="camera ? 'Unlock camera' : 'Lock camera'" v-model="camera"
                          v-on:change="cameraChanged"></v-checkbox>
                      </v-list-item>
                    </v-col>
                  </v-row>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-col>
          <!--        /// Branding-->
          <v-col v-if="tab === 3" sm=12 lg=12 md=10 offset-md=1>
            <v-list three-line subheader v-if="tab === 3">
              <v-card-title>Select a background.</v-card-title>
              <v-card-subtitle>The image will be scaled to viewport.</v-card-subtitle>
              <v-list-item>
                <v-list-item-content>
                  <v-file-input :rules="rules" accept="image/png, image/jpeg, image/bmp" prepend-icon="mdi-camera"
                    label="~/" outlined dense v-model="background" @change="backgroundSelected($event)"></v-file-input>
                </v-list-item-content>
              </v-list-item>
              <v-list-item>
                <v-list-item-content>
                  <v-card-title>Change the logo.</v-card-title>
                  <v-card-subtitle>A transparent background works better.</v-card-subtitle>
                  <v-file-input :rules="rules" accept="image/png, image/jpeg, image/bmp" prepend-icon="mdi-camera"
                    label="~/" outlined dense v-model="emblem" @change="emblemSelected($event)"></v-file-input>
                </v-list-item-content>
              </v-list-item>

              <v-card-title> Change texts. </v-card-title>
              <v-card-subtitle>Removing the text is also an option.</v-card-subtitle>
              <v-list-item grey>
                <v-list-item-content>
                  <v-text-field v-model="title" label="Title" outlined dense></v-text-field>
                </v-list-item-content>
              </v-list-item>
              <v-list-item :disabled="true">
                <v-list-item-content>
                  <v-text-field v-model="subtitle" label="Subtitle(watermark)." outlined dense :disabled="true">
                  </v-text-field>
                </v-list-item-content>
              </v-list-item>
              <v-list-item>
                <v-list-item-content>
                  <v-row>
                    <v-col md="12" sm="12" lg="3">
                      <v-card-title>Color 1st</v-card-title>
                      <v-card-subtitle>The Color of the main element.</v-card-subtitle>
                      <v-color-picker class="mx-auto" dot-size="60" hide-sliders show-swatches swatches-max-height="100"
                        @update:color="colorSelected($event)"></v-color-picker>
                    </v-col>
                    <v-col md="3" sm="12" lg="3">
                      <v-card-title>Scene lights </v-card-title>
                      <v-card-subtitle>The color of the lights.</v-card-subtitle>
                      <v-color-picker class="mx-auto" v-model="color" dot-size="25" hide-sliders show-swatches
                        swatches-max-height="100" @change="setLightColor($event)" />
                    </v-col>
                  </v-row>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-col>
          <v-col v-if="tab === 4" sm=12 lg=12 md=10 offset-md=1>
            <v-list three-line subheader v-if="tab === 4">
              <v-list-item>
                <v-list-item-content>
                  <v-row>
                    <v-col sm="12" md="5" offset-lg="2" lg="5">
                      <v-card flat>
                        <v-card-title> Free </v-card-title>
                        <v-card-subtitle></v-card-subtitle>

                        <v-list>
                          <v-list-item-group color="primary">
                            <v-list-item>
                              <v-icon>mdi-check</v-icon>
                              <v-list-item-title>
                                Download visualizer
                              </v-list-item-title>
                            </v-list-item>
                            <v-list-item>
                              <v-icon>mdi-close-thick</v-icon>
                              <v-list-item-title>
                                Remove watermark
                              </v-list-item-title>
                            </v-list-item>
                            <v-list-item>
                              <v-icon>mdi-close-thick</v-icon>
                              <v-list-item-title> Higher quality </v-list-item-title>
                            </v-list-item>
                          </v-list-item-group>
                        </v-list>
                        <v-card-actions>
                          <v-btn @click="free = true" text>
                            <v-icon v-if="free" dark> mdi-check </v-icon>

                            <v-icon v-else light> mdi-square-outline</v-icon>
                          </v-btn>
                        </v-card-actions>
                      </v-card>
                    </v-col>
                    <v-col lg="5" md="4">
                      <v-card flat>
                        <v-card-title> Premium </v-card-title>
                        <v-card-subtitle> </v-card-subtitle>
                        <v-list>
                          <v-list-item-group color="primary">
                            <v-list-item>
                              <v-icon>mdi-check</v-icon>
                              <v-list-item-title>
                                GPU powered servers.
                              </v-list-item-title>
                            </v-list-item>
                            <v-list-item>
                              <v-icon>mdi-check</v-icon>
                              <v-list-item-title>
                                Without our watermark
                              </v-list-item-title>
                            </v-list-item>
                            <v-list-item>
                              <v-icon>mdi-check</v-icon>
                              <v-list-item-title>
                                Share link to visualizer
                              </v-list-item-title>
                            </v-list-item>
                          </v-list-item-group>
                        </v-list>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-col>
        </v-col>
        <v-col md=10 lg=12 sm=12 offset-md=1 v-if="tab === 4">
          <v-btn size="larger " class="d-flex align-center" v-if="tab === 4" :disabled="free === false" color="primary"
            text @click="save">
            Generate and
            download</v-btn>

        </v-col>

      </v-row>


      <v-bottom-navigation style="position: fixed; width: 100%; bottom:0px; left:0px; right:0px;">
        <v-btn value="recent" @click="tab = 0" class="white">
          <v-icon :color="tab === 0 ? '#CE93D8' : ''">mdi-brush</v-icon>
          <span v-if="tab !== 0">Style</span>
        </v-btn>

        <v-btn value="sound" @click="tab = 1" class="white">
          <v-icon :color="tab === 1 ? '#90CAF9' : ''">mdi-speaker</v-icon>

          <span v-if="tab !== 1">Sound</span>
        </v-btn>
        <v-btn value="camera" @click="tab = 2" class="white">
          <v-icon :color="tab === 2 ? '#80CBC4' : ''">mdi-camera</v-icon>
          <span v-if="tab !== 2">Camera</span>
        </v-btn>
        <v-btn value="branding" @click="tab = 3" class="white">
          <v-icon :color="tab === 3 ? '#EF9A9A' : ''">mdi-heart</v-icon>
          <span v-if="tab !== 3"> Branding</span>
        </v-btn>
        <v-btn value="nearby" @click="tab = 4" class="white">
          <v-icon :color="tab === 4 ? '#C5E1A5' : ''">mdi-download</v-icon>
          <span v-if="tab !== 4">Download</span>
        </v-btn>
      </v-bottom-navigation>

    </v-main>
  </v-layout>

</template>

<script>
import Templates from "./Templates.vue";
import Stripe from "./Stripe.vue";

export default {
  name: "Setting",
  components: { Stripe, Templates },
  data() {
    return {
      free: null,
      tab: 0,
      title: null,
      subtitle: null,
      color: "hex",
      emblem: null,
      background: null,
      sound: null,
      notifications: false,
      record: true,
      widgets: false,
      rules: [
        (value) =>
          !value ||
          value.size < 2000000000 ||
          "File size should be less than 2000000000.",
      ],
    };
  },
  computed: {
    dialog: function () {
      return this.$store.state.settings;
    },
    visualizer: function () {
      return this.$store.state.visualizer;
    },
    camera: {
      set: function (val) {
        this.$store.dispatch("toggleCamera", val);
      },
      get: function () {
        return this.$store.state.options.camera.move;
      },
    },
  },
  methods: {
    next: function () {
      this.tab++;
    },

    save: function () {
      console.log("Saving", this.title, this.subtitle);
      this.$emit("reCreate");
      this.$store.dispatch("changeTitle", this.title);
      this.$store.dispatch("changeSubtitle", this.subtitle);
      this.$store.dispatch("toggleDialog", false);
      this.$store.dispatch("toggleSetting", false);
      this.$store.dispatch("toggleVisualizer", true);
    },
    soundSelected: function (file) {
      console.log(file);
      this.$store.dispatch("setSound", file);
    },
    backgroundSelected: function (file) {
      this.$store.dispatch("setBackground", file);
    },
    emblemSelected: function (file) {
      this.$store.dispatch("setEmblem", file);
    },
    cameraChanged: function () {
      this.$store.dispatch("toggleCamera", this.camera);
    },

    colorSelected: function (color) {
      console.log(color, "selected");
      const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
          : null;
      };
      this.$store.dispatch("setColor", hexToRgb(color.hex));
    },
    setLightColor(color) {
      const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
          : null;
      };
      this.$store.dispatch("setLight", hexToRgb(color.hex));
    },
  },
};
</script>

<style scoped>
/* Hide scrollbar for Chrome, Safari and Opera */
.v-dialog::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.v-dialog::-webkit-scrollbar {
  -ms-overflow-style: none;
  /* IE and Edge */
  scrollbar-width: none;
  /* Firefox */
}
</style>

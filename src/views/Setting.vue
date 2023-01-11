<template>
  <v-row justify="center">
    <v-dialog v-model="dialog" transition="dialog-upper-transition" fullscreen>
      <v-card>
        <v-card-title>
          <v-tabs v-model="tab">
            <v-tab> Style </v-tab>
            <v-tab> Sound </v-tab>
            <v-tab> Branding </v-tab>
            <v-tab> Last step </v-tab>
          </v-tabs>
          <v-tabs-items>
            <v-tab-item>
              <v-card flat>
                <v-card-title> Choose a style </v-card-title>
                <Templates />
              </v-card>
            </v-tab-item>
          </v-tabs-items>
        </v-card-title>
        <!--        /// Style-->
        <Templates v-if="tab === 0" />
        <!--        <v-list-item>-->
        <!--            <v-list-item-action>-->
        <!--              <v-checkbox v-model="camera" v-on:change="cameraChanged"></v-checkbox>-->
        <!--            </v-list-item-action>-->
        <!--            <v-list-item-content>-->
        <!--              <v-list-item-title>Unlock camera</v-list-item-title>-->
        <!--              <v-list-item-subtitle>-->
        <!--                Move the camera with your mouse or keyboard.-->
        <!--              </v-list-item-subtitle>-->
        <!--            </v-list-item-content>-->
        <!--          </v-list-item>-->
        <!--        /// Sound-->
        <v-list three-line subheader v-if="tab === 1">
          <v-card-title>Sound source</v-card-title>
          <v-card-subtitle
            >Upload your own sound or use your microphone to record a real-time
            sound.</v-card-subtitle
          >
          <v-list-item>
            <v-list-item-content>
              <v-list-item>
                <v-list-item-content>
                  <v-file-input
                    :rules="rules"
                    accept="audio/*"
                    prepend-icon="mdi-music"
                    label="Choose your sound."
                    outlined
                    dense
                    v-model="sound"
                    @change="soundSelected($event)"
                  ></v-file-input>
                </v-list-item-content>
              </v-list-item>
            </v-list-item-content>
          </v-list-item>
        </v-list>
        <!--        /// Branding-->
        <v-list three-line subheader v-if="tab === 2">
          <v-card-title>Branding</v-card-title>
          <v-list-item>
            <v-list-item-content>
              <v-file-input
                :rules="rules"
                accept="image/png, image/jpeg, image/bmp"
                prepend-icon="mdi-camera"
                label="Choose a background."
                outlined
                dense
                v-model="background"
                @change="backgroundSelected($event)"
              ></v-file-input>
            </v-list-item-content>
          </v-list-item>
          <v-list-item>
            <v-list-item-content>
              <v-file-input
                :rules="rules"
                accept="image/png, image/jpeg, image/bmp"
                prepend-icon="mdi-camera"
                label="Choose your a logo."
                outlined
                dense
                v-model="emblem"
                @change="emblemSelected($event)"
              ></v-file-input>
            </v-list-item-content>
          </v-list-item>

          <v-list-item>
            <v-list-item-content>
              <v-text-field
                v-model="title"
                label="Title"
                outlined
                dense
              ></v-text-field>
            </v-list-item-content>
          </v-list-item>
          <v-list-item>
            <v-list-item-content>
              <v-text-field v-model="subtitle" label="Subtitle" outlined dense>
              </v-text-field>
            </v-list-item-content>
          </v-list-item>
          <v-list-item>
            <v-list-item-content>
              <v-row>
                <v-col md="2" sm="12" lg="2">
                  <v-list-item-title>Primary color</v-list-item-title>
                  <v-color-picker
                    dot-size="25"
                    hide-sliders
                    show-swatches
                    swatches-max-height="100"
                    @update:color="colorSelected($event)"
                  ></v-color-picker>
                </v-col>
                <v-col md="2" sm="12" lg="2">
                  <v-list-item-title> Scene lights </v-list-item-title>
                  <v-color-picker
                    v-model="color"
                    dot-size="25"
                    hide-sliders
                    show-swatches
                    swatches-max-height="100"
                    @change="setLightColor($event)"
                  />
                </v-col>
              </v-row>
            </v-list-item-content>
          </v-list-item>
        </v-list>
        <v-row v-if="tab === 3">
          <v-col md="4" offset-md="2">
            <v-card>
              <v-card-title> Free </v-card-title>
              <v-card-subtitle
                >Your visualizer will be generated inside your own
                web-browser.</v-card-subtitle
              >
              <v-list>
                <v-list-item-group color="primary">
                  <v-list-item>
                    <v-list-item-icon>
                      <v-icon>mdi-check</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                      <v-list-item-title>
                        Download visualizer
                      </v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-icon>
                      <v-icon>mdi-close-thick</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                      <v-list-item-title> Remove watermark </v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-icon>
                      <v-icon>mdi-close-thick</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                      <v-list-item-title> Higher quality </v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-icon>
                      <v-icon>mdi-close-thick</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                      <v-list-item-title>
                        Change visualizer sensitivity
                      </v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                </v-list-item-group>
              </v-list>
              <v-card-actions class="justify-center">
                <v-btn outlined rounded @click="save"> Create </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
          <v-col md="4">
            <v-card>
              <v-card-title> Premium </v-card-title>
              <v-card-subtitle
                >We will generate the visualizer on our own
                servers.</v-card-subtitle
              >
              <v-list>
                <v-list-item-group color="primary">
                  <v-list-item>
                    <v-list-item-icon>
                      <v-icon>mdi-check</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                      <v-list-item-title>
                        Higher quality and performance.
                      </v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-icon>
                      <v-icon>mdi-check</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                      <v-list-item-title>
                        Without our watermark
                      </v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-icon>
                      <v-icon>mdi-check</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                      <v-list-item-title>
                        Generate for social media platforms.
                      </v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-icon>
                      <v-icon>mdi-check</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                      <v-list-item-title>
                        Change visualizer sensitivity
                      </v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-icon>
                      <v-icon>mdi-check</v-icon>
                    </v-list-item-icon>
                    <v-list-item-content>
                      <v-list-item-title>
                        Share link to visualizer
                      </v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                </v-list-item-group>
              </v-list>
              <v-card-actions class="justify-center">
                <v-btn outlined rounded disabled> Coming soon </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
        <v-card-actions justify-center>
          <v-btn outlined rounded @click="save"> Create </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script>
import Templates from "./Templates.vue";
import Stripe from "./Stripe.vue";

export default {
  name: "Setting",
  components: { Stripe, Templates },
  data() {
    return {
      tab: null,
      title: "helloworld",
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
    save: function () {
      this.$emit("reCreate");
      this.$store.dispatch("changeText", {
        title: this.title,
        subtitle: this.subtitle,
      });
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

<style scoped></style>

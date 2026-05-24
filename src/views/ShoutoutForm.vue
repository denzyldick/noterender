<template>
  <v-app dark class="shoutout-app">
    <v-container fill-height class="pa-0">
      <v-row align="center" justify="center" class="ma-0 fill-height">
        <v-col cols="12" sm="8" md="5" lg="4">
          <v-card class="pa-8 rounded-xl text-center" color="rgba(15,15,15,0.95)" style="backdrop-filter:blur(25px);border:1px solid rgba(255,255,255,0.1)">
            <v-icon size="48" color="primary" class="mb-4">mdi-chat-processing</v-icon>
            <div class="text-h5 font-weight-black primary--text mb-1 letter-spacing-2">SHOUTOUT</div>
            <div class="text-caption grey--text mb-6">Your message appears on the big screen!</div>

            <v-alert v-if="submitted" dense text type="success" class="mb-4">
              Message sent! Waiting for approval.
            </v-alert>

            <v-alert v-else-if="error" dense text type="error" class="mb-4">{{ error }}</v-alert>

            <v-form v-if="!submitted" @submit.prevent="submit">
              <v-text-field v-model="name" label="Your Name" outlined dense :disabled="loading" prepend-inner-icon="mdi-account" class="mb-2"></v-text-field>
              <v-textarea v-model="message" label="Your Message" outlined dense :disabled="loading" rows="3" prepend-inner-icon="mdi-message-text" class="mb-4" maxlength="200" counter></v-textarea>
              <v-btn block x-large color="primary" type="submit" :loading="loading" class="font-weight-bold rounded-lg elevation-4">
                Send to Screen
              </v-btn>
            </v-form>

            <v-btn v-else block color="primary" @click="submitted = false" class="mt-2">Send Another</v-btn>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>

<script lang="ts">
export default {
  name: "ShoutoutForm",
  data() {
    return {
      name: "",
      message: "",
      loading: false,
      error: "",
      submitted: false,
    };
  },
  methods: {
    async submit() {
      if (!this.name || !this.message) { this.error = "Fill in all fields"; return; }
      const clubId = this.$route.query.club || 1;
      this.loading = true;
      this.error = "";
      try {
        await this.$store.dispatch("submitShoutout", { clubId, name: this.name, message: this.message });
        this.submitted = true;
        this.name = "";
        this.message = "";
      } catch (e) {
        this.error = (e as any).message || "Failed to send";
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.shoutout-app {
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%) !important;
}
.letter-spacing-2 { letter-spacing: 2px; }
</style>

<template>
  <v-app dark class="shoutout-app">
    <div class="locale-switcher-fixed">
      <LocaleSwitcher />
    </div>
    <v-container fill-height class="pa-0">
      <v-row align="center" justify="center" class="ma-0 fill-height">
        <v-col cols="12" sm="8" md="5" lg="4">
          <v-card class="pa-8 rounded-xl text-center" color="rgba(15,15,15,0.95)" style="backdrop-filter:blur(25px);border:1px solid rgba(255,255,255,0.1)">
            <v-icon size="48" color="primary" class="mb-4">mdi-chat-processing</v-icon>
            <div class="text-h5 font-weight-black primary--text mb-1 letter-spacing-2">{{ $t('shoutout.title') }}</div>
            <div class="text-caption grey--text mb-6">{{ $t('shoutout.subtitle') }}</div>

            <v-alert v-if="submitted" dense text type="success" class="mb-4">
              {{ $t('shoutout.messageSent') }}
            </v-alert>

            <v-alert v-else-if="error" dense text type="error" class="mb-4">{{ error }}</v-alert>

            <v-form v-if="!submitted" @submit.prevent="submit">
              <v-text-field v-model="name" :label="$t('shoutout.yourName')" outlined dense :disabled="loading" prepend-inner-icon="mdi-account" class="mb-2"></v-text-field>
              <v-textarea v-model="message" :label="$t('shoutout.yourMessage')" outlined dense :disabled="loading" rows="3" prepend-inner-icon="mdi-message-text" class="mb-4" maxlength="200" counter></v-textarea>
              <v-btn block x-large color="primary" type="submit" :loading="loading" class="font-weight-bold rounded-lg elevation-4">
                {{ $t('shoutout.sendToScreen') }}
              </v-btn>
            </v-form>

            <v-btn v-else block color="primary" @click="submitted = false" class="mt-2">{{ $t('shoutout.sendAnother') }}</v-btn>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-app>
</template>

<script lang="ts">
import LocaleSwitcher from "@/components/LocaleSwitcher.vue";

export default {
  name: "ShoutoutForm",
  components: { LocaleSwitcher },
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
      if (!this.name || !this.message) { this.error = this.$t("shoutout.fillFields"); return; }
      const clubId = this.$route.query.club || 1;
      this.loading = true;
      this.error = "";
      try {
        await this.$store.dispatch("submitShoutout", { clubId, name: this.name, message: this.message });
        this.submitted = true;
        this.name = "";
        this.message = "";
      } catch (e) {
        this.error = (e as any).message || this.$t("shoutout.failed");
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
.locale-switcher-fixed {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 200;
}
</style>

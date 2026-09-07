<template>
  <v-app dark class="dj-app">
    <v-container class="pa-4" style="max-width: 500px">
      <div class="text-center mb-4">
        <img :src="asset('/img/logo.png')" width="48" alt="Noterender" />
        <div class="text-h6 font-weight-black primary--text mt-2">DJ REMOTE</div>
        <div class="text-caption grey--text">Moderate shoutouts & control the show</div>
      </div>

      <!-- Shoutouts -->
      <v-card class="pa-4 mb-4 rounded-xl" color="rgba(15,15,15,0.95)" style="border:1px solid rgba(255,255,255,0.1)">
        <div class="text-overline primary--text font-weight-bold mb-3">PENDING SHOUTOUTS</div>
        <div v-if="pending.length === 0" class="text-caption grey--text text-center py-4">No pending messages</div>
        <div v-for="s in pending" :key="s.id" class="pa-3 mb-2 rounded-lg" style="background:rgba(255,255,255,0.05)">
          <div class="d-flex justify-space-between align-start">
            <div>
              <div class="font-weight-bold white--text">{{ s.name }}</div>
              <div class="text-caption grey--text">{{ s.message }}</div>
            </div>
            <div class="d-flex" style="gap:4px">
              <v-btn x-small icon color="success" @click="approve(s.id)"><v-icon size="18">mdi-check</v-icon></v-btn>
              <v-btn x-small icon color="error" @click="reject(s.id)"><v-icon size="18">mdi-close</v-icon></v-btn>
            </div>
          </div>
        </div>
      </v-card>

      <!-- Announcement -->
      <v-card class="pa-4 mb-4 rounded-xl" color="rgba(15,15,15,0.95)" style="border:1px solid rgba(255,255,255,0.1)">
        <div class="text-overline primary--text font-weight-bold mb-3">ANNOUNCEMENT</div>
        <v-text-field v-model="announceText" label="Announcement text" outlined dense hide-details class="mb-3"></v-text-field>
        <v-row dense>
          <v-col cols="4">
            <v-text-field v-model="announceDuration" label="Seconds" outlined dense type="number" hide-details></v-text-field>
          </v-col>
          <v-col cols="8">
            <v-btn block color="primary" @click="sendAnnouncement" class="fill-height">
              <v-icon left>mdi-bullhorn</v-icon> Show on Screen
            </v-btn>
          </v-col>
        </v-row>
      </v-card>

      <!-- Account -->
      <v-card class="pa-4 rounded-xl" color="rgba(15,15,15,0.95)" style="border:1px solid rgba(255,255,255,0.1)">
        <div class="d-flex justify-space-between align-center">
          <div>
            <div class="text-caption grey--text">Logged in as</div>
            <div class="text-body-2 white--text">{{ user?.email || 'Guest' }}</div>
          </div>
          <v-btn small outlined color="primary" :to="user ? '/' : '/auth'">
            {{ user ? 'Open Visualizer' : 'Login' }}
          </v-btn>
        </div>
        <v-divider class="my-3 opacity-10"></v-divider>
        <div class="text-caption grey--text text-center">
          <v-icon x-small>mdi-qrcode</v-icon> 
          Share QR: <code class="primary--text">{{ baseUrl }}/shout?club={{ userId }}</code>
        </div>
      </v-card>

      <div class="text-center mt-4">
        <v-btn text small color="grey" @click="logout">Logout</v-btn>
      </div>
    </v-container>
  </v-app>
</template>

<script lang="ts">
import { asset } from "../js/assets";

export default {
  name: "DJPanel",
  data() {
    return {
      pending: [],
      announceText: "",
      announceDuration: 5,
      pollTimer: null,
    };
  },
  computed: {
    user() { return this.$store.state.auth.user; },
    userId() { return this.$store.state.auth.userId; },
    baseUrl() { return window.location.origin; },
  },
  methods: {
    asset,
    async loadPending() {
      if (!this.user) return;
      try {
        this.pending = await this.$store.dispatch("fetchPendingShoutouts");
      } catch (e) { /* ignore */ }
    },
    async approve(id: number) {
      await this.$store.dispatch("approveShoutout", { id, status: "approved" });
      this.pending = this.pending.filter((s: any) => s.id !== id);
    },
    async reject(id: number) {
      await this.$store.dispatch("approveShoutout", { id, status: "rejected" });
      this.pending = this.pending.filter((s: any) => s.id !== id);
    },
    sendAnnouncement() {
      if (!this.announceText) return;
      this.$store.commit("setAnnouncement", {
        text: this.announceText,
        visible: true,
        duration: parseInt(String(this.announceDuration)) || 5,
      });
      this.announceText = "";
    },
    logout() {
      this.$store.commit("logout");
      this.$router.push("/auth");
    },
  },
  mounted() {
    this.loadPending();
    this.pollTimer = setInterval(() => this.loadPending(), 5000);
    if (!this.user) this.$router.push("/auth");
  },
  beforeDestroy() {
    if (this.pollTimer) clearInterval(this.pollTimer);
  },
};
</script>

<style>
.dj-app { background: #050505 !important; }
.opacity-10 { opacity: 0.1; }
</style>

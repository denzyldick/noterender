<template>
  <v-dialog v-model="dialog" max-width="440" persistent>
    <v-card class="pa-0 text-white rounded-xl overflow-hidden" style="background: #0a0a0a; border: 1px solid rgba(255,255,255,0.06)">
      <!-- Accent bar -->
      <div class="accent-bar" :style="{ background: step === 'auth' ? 'linear-gradient(90deg, #00E5FF, #7C4DFF)' : 'linear-gradient(90deg, #FF4081, #FF6E40)' }"></div>

      <v-card-text class="pa-6">
        <!-- Step 1: Auth -->
        <transition name="fade" mode="out-in">
          <div v-if="step === 'auth'" key="auth">
            <div class="text-center mb-5">
              <v-avatar size="56" color="rgba(0,229,255,0.1)" class="mb-3">
                <v-icon color="primary" size="28">mdi-account-circle</v-icon>
              </v-avatar>
              <div class="text-h6 font-weight-black white--text letter-spacing-1">{{ isLogin ? 'WELCOME BACK' : 'CREATE ACCOUNT' }}</div>
              <div class="text-caption grey--text mt-1">{{ isLogin ? 'Sign in to access Noterender Pro' : 'Register to unlock all features' }}</div>
            </div>

            <v-alert v-if="authError" dense text type="error" class="mb-4">{{ authError }}</v-alert>

            <v-form @submit.prevent="handleAuth">
              <v-text-field v-model="email" label="Email" outlined dense hide-details class="mb-3" prepend-inner-icon="mdi-email" :disabled="authLoading" bg-color="rgba(255,255,255,0.03)"></v-text-field>
              <v-text-field v-model="password" label="Password" outlined dense hide-details type="password" class="mb-5" prepend-inner-icon="mdi-lock" :disabled="authLoading" bg-color="rgba(255,255,255,0.03)"></v-text-field>

              <v-btn block x-large color="primary" type="submit" :loading="authLoading" class="font-weight-bold rounded-lg elevation-4" style="height: 48px">
                {{ isLogin ? 'Sign In & Continue' : 'Create Account & Continue' }}
              </v-btn>
            </v-form>

            <div class="text-center mt-4">
              <v-btn text small color="grey" @click="isLogin = !isLogin; authError=''">
                {{ isLogin ? "Don't have an account? Register" : 'Already have an account? Sign In' }}
              </v-btn>
            </div>
            <div class="text-center mt-1">
              <v-btn text small color="grey" class="text-caption" @click="closeModal">Maybe later</v-btn>
            </div>
          </div>

          <!-- Step 2: Subscription -->
          <div v-else key="paywall">
            <div class="text-center mb-5">
              <v-avatar size="56" color="rgba(255,64,129,0.1)" class="mb-3">
                <v-icon color="secondary" size="28">mdi-crown</v-icon>
              </v-avatar>
              <div class="text-h6 font-weight-black white--text letter-spacing-1">NOTERENDER PRO</div>
              <div class="text-caption grey--text mt-1">One subscription unlocks everything</div>
            </div>

            <div class="mb-4 pa-4 rounded-lg" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06)">
              <div class="d-flex align-center mb-3">
                <v-icon color="success" size="20" class="mr-3">mdi-check-circle</v-icon>
                <span class="text-body-2">High-quality MP4 export (up to 8Mbps)</span>
              </div>
              <div class="d-flex align-center mb-3">
                <v-icon color="success" size="20" class="mr-3">mdi-check-circle</v-icon>
                <span class="text-body-2">No watermarks on exported videos</span>
              </div>
              <div class="d-flex align-center mb-3">
                <v-icon color="success" size="20" class="mr-3">mdi-check-circle</v-icon>
                <span class="text-body-2">System audio, fullscreen & shoutouts</span>
              </div>
              <div class="d-flex align-center">
                <v-icon color="success" size="20" class="mr-3">mdi-check-circle</v-icon>
                <span class="text-body-2">All templates, effects & resolutions</span>
              </div>
            </div>

            <v-btn block color="primary" x-large class="font-weight-bold rounded-lg elevation-4 mb-3" style="height: 48px" @click="subscribe('monthly')" :loading="loadingPay && selectedPlan === 'monthly'">
              <v-icon left size="20">mdi-crown</v-icon>
              $99 / month
            </v-btn>

            <v-btn block color="secondary" x-large class="font-weight-bold rounded-lg elevation-4" style="height: 48px" @click="subscribe('yearly')" :loading="loadingPay && selectedPlan === 'yearly'">
              <v-icon left size="20">mdi-star-circle</v-icon>
              $990 / year <span class="text-caption ml-2 opacity-70">(2 months free)</span>
            </v-btn>

            <div class="text-center mt-3">
              <span class="text-caption grey--text">Cancel anytime. No trial.</span>
            </div>

            <v-divider class="my-5" style="border-color: rgba(255,255,255,0.06)"></v-divider>

            <div class="text-center mb-2">
              <div class="text-body-2 font-weight-bold white--text mb-1">Want Unlimited Cloud Rendering?</div>
              <div class="text-caption grey--text mb-3">Join the waitlist for our upcoming Pro plan.</div>
            </div>

            <v-form @submit.prevent="joinWaitlist">
              <v-text-field v-model="waitlistEmail" label="Your Email" outlined dense hide-details :disabled="joined" class="mb-3" prepend-inner-icon="mdi-email" bg-color="rgba(255,255,255,0.03)"></v-text-field>
              <v-btn block color="secondary" type="submit" :loading="loadingWaitlist" :disabled="joined || !waitlistEmail" class="font-weight-bold rounded-lg">
                {{ joined ? '✓ Added to Waitlist' : 'Join Waitlist' }}
              </v-btn>
            </v-form>
          </div>
        </transition>
      </v-card-text>

      <div class="px-6 pb-4 text-center">
        <v-btn text small color="grey" class="text-caption" @click="closeModal">Cancel</v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "PaywallModal",
  props: {
    value: { type: Boolean, default: false },
    mode: { type: String, default: 'export' },
  },
  data() {
    return {
      email: "",
      password: "",
      isLogin: true,
      authLoading: false,
      authError: "",
      loadingPay: false,
      selectedPlan: '',
      loadingWaitlist: false,
      joined: false,
      waitlistEmail: "",
    };
  },
  computed: {
    dialog: {
      get() { return this.value; },
      set(val) { this.$emit("input", val); },
    },
    isLoggedIn() {
      return !!this.$store.state.auth.token;
    },
    step() {
      return this.isLoggedIn ? 'paywall' : 'auth';
    },
  },
  methods: {
    closeModal() {
      this.dialog = false;
    },
    async handleAuth() {
      this.authError = "";
      if (!this.email || !this.password) { this.authError = "Fill in all fields"; return; }
      this.authLoading = true;
      try {
        if (this.isLogin) {
          await this.$store.dispatch("login", { email: this.email, password: this.password });
        } else {
          await this.$store.dispatch("register", { email: this.email, password: this.password });
        }
        // Clear sensitive data
        this.email = "";
        this.password = "";
      } catch (e) {
        this.authError = e.message || "Something went wrong";
      } finally {
        this.authLoading = false;
      }
    },
    async subscribe(plan) {
      this.loadingPay = true;
      this.selectedPlan = plan;
      try {
        const API_BASE = process.env.VUE_APP_API_URL || "";
        const token = localStorage.getItem("noterender_token");
        const response = await fetch(`${API_BASE}/api/checkout`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ plan: plan }),
        });
        const session = await response.json();
        if (session.error) throw new Error(session.error);
        window.location.href = session.url;
      } catch (err) {
        console.error(err);
        alert(`Payment error: ${err.message || "Something went wrong"}`);
      } finally {
        this.loadingPay = false;
      }
    },
    async joinWaitlist() {
      if (!this.waitlistEmail) return;
      this.loadingWaitlist = true;
      try {
        const API_BASE = process.env.VUE_APP_API_URL || "";
        await fetch(`${API_BASE}/api/waitlist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: this.waitlistEmail }),
        });
        this.joined = true;
        this.waitlistEmail = "";
      } catch (err) {
        console.error(err);
      } finally {
        this.loadingWaitlist = false;
      }
    },
  },
};
</script>

<style scoped>
.accent-bar {
  height: 3px;
  width: 100%;
}
.letter-spacing-1 { letter-spacing: 1px; }
.opacity-70 { opacity: 0.7; }
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-enter-from { opacity: 0; transform: translateY(8px); }
.fade-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
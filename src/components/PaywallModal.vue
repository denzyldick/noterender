<template>
  <v-dialog v-model="dialog" max-width="500" persistent>
    <v-card
      class="pa-4 bg-dark text-white rounded-xl"
      style="background-color: #121212"
    >
      <v-card-title
        class="text-h5 font-weight-bold mb-2 primary--text text-center w-100 d-block"
      >
        {{ mode === 'export' ? 'Unlock Premium Export' : 'Unlock Live Performance' }}
      </v-card-title>

      <v-card-text>
        <div
          class="mb-6 pa-4 rounded-lg"
          style="
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
          "
        >
          <template v-if="mode === 'export'">
            <div class="d-flex align-center mb-2">
              <v-icon color="success" class="mr-2">mdi-check-circle</v-icon>
              <span class="text-subtitle-1">High-Quality Browser Export</span>
            </div>
            <div class="d-flex align-center mb-4">
              <v-icon color="success" class="mr-2">mdi-check-circle</v-icon>
              <span class="text-subtitle-1">No Watermarks</span>
            </div>

            <v-btn
              block
              color="primary"
              x-large
              class="font-weight-bold"
              @click="payNow('pro_export')"
              :loading="loadingPay"
            >
              Pay $0.99 to Export Now
            </v-btn>
          </template>

          <template v-else>
            <div class="d-flex align-center mb-2">
              <v-icon color="success" class="mr-2">mdi-check-circle</v-icon>
              <span class="text-subtitle-1">System Audio Capture</span>
            </div>
            <div class="d-flex align-center mb-2">
              <v-icon color="success" class="mr-2">mdi-check-circle</v-icon>
              <span class="text-subtitle-1">Fullscreen Performance Mode</span>
            </div>
            <div class="d-flex align-center mb-4">
              <v-icon color="success" class="mr-2">mdi-check-circle</v-icon>
              <span class="text-subtitle-1">Auto-hiding UI Controls</span>
            </div>

            <v-btn
              v-if="!hasUsedTrial"
              block
              color="success"
              x-large
              class="font-weight-bold mb-3"
              @click="startTrial"
            >
              Start 7-Day Free Trial
            </v-btn>
            
            <v-btn
              block
              color="primary"
              x-large
              class="font-weight-bold"
              @click="payNow('live_pass')"
              :loading="loadingPay"
            >
              {{ hasUsedTrial ? 'Get Live Pass - $4.99/mo' : 'Skip Trial - Buy Now' }}
            </v-btn>
          </template>
        </div>

        <v-divider
          class="my-6"
          style="border-color: rgba(255, 255, 255, 0.1) !important"
        ></v-divider>

        <div class="text-center mb-2">
          <h4 class="text-h6 mb-1">Want Unlimited Cloud Rendering?</h4>
          <p class="text-caption grey--text">
            Join the waitlist for our upcoming Pro Server-based subscription.
          </p>
        </div>

        <v-form @submit.prevent="joinWaitlist" class="mt-4">
          <v-text-field
            v-model="email"
            label="Your Email Address"
            outlined
            dense
            dark
            :disabled="joined"
            placeholder="name@example.com"
          ></v-text-field>
          <v-btn
            block
            color="secondary"
            type="submit"
            :loading="loadingWaitlist"
            :disabled="joined || !email"
          >
            {{ joined ? "Added to waitlist!" : "Join Waitlist" }}
          </v-btn>
        </v-form>

        <div class="mt-6 text-center">
          <v-btn text small color="grey" @click="closeModal"
            >Cancel & Go Back</v-btn
          >
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: "PaywallModal",
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    mode: {
      type: String,
      default: 'export', // 'export' or 'live'
    }
  },
  data() {
    return {
      email: "",
      loadingPay: false,
      loadingWaitlist: false,
      joined: false,
    };
  },
  computed: {
    dialog: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit("input", val);
      },
    },
    hasUsedTrial() {
      return this.$store.state.trialStartedAt !== null;
    }
  },
  methods: {
    closeModal() {
      this.dialog = false;
    },
    startTrial() {
      const now = Date.now();
      this.$store.commit('setTrial', now);
      this.$store.commit('setLivePro', true);
      localStorage.setItem('noterender_trial_start', now.toString());
      this.closeModal();
      // Notify parent to proceed
      this.$emit('trial-started');
    },
    async payNow(item) {
      this.loadingPay = true;
      try {
        const API_BASE =
          process.env.NODE_ENV === "development"
            ? "http://localhost:8000"
            : process.env.VUE_APP_API_BASE;
        const response = await fetch(`${API_BASE}/api/checkout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ item: item }),
        });

        const session = await response.json();

        if (session.error) {
          throw new Error(session.error);
        }

        // Redirect to Stripe checkout page
        window.location.href = session.url;
      } catch (err) {
        console.error(err);
        alert(`Payment error: ${err.message || "Something went wrong"}`);
      } finally {
        this.loadingPay = false;
      }
    },
    async joinWaitlist() {
      if (!this.email) return;
      this.loadingWaitlist = true;
      try {
        const API_BASE =
          process.env.NODE_ENV === "development"
            ? "http://localhost:8000"
            : process.env.VUE_APP_API_BASE;
        await fetch(`${API_BASE}/api/waitlist`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: this.email }),
        });
        this.joined = true;
        this.email = "";
      } catch (err) {
        console.error(err);
      } finally {
        this.loadingWaitlist = false;
      }
    },
  },
};
</script>

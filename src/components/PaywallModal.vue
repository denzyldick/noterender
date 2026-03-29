<template>
  <v-dialog v-model="dialog" max-width="500" persistent>
    <v-card class="pa-4 bg-dark text-white rounded-xl" style="background-color: #121212;">
      <v-card-title class="text-h5 font-weight-bold mb-2 primary--text text-center w-100 d-block">
        Unlock Premium Export
      </v-card-title>
      
      <v-card-text>
        <div class="mb-6 pa-4 rounded-lg" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);">
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
            @click="payNow"
            :loading="loadingPay"
          >
            Pay $0.99 to Export Now
          </v-btn>
        </div>

        <v-divider class="my-6" style="border-color: rgba(255,255,255,0.1) !important;"></v-divider>
        
        <div class="text-center mb-2">
          <h4 class="text-h6 mb-1">Want Unlimited Cloud Rendering?</h4>
          <p class="text-caption grey--text">Join the waitlist for our upcoming Pro Server-based subscription.</p>
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
            {{ joined ? 'Added to waitlist!' : 'Join Waitlist' }}
          </v-btn>
        </v-form>
        
        <div class="mt-6 text-center">
          <v-btn text small color="grey" @click="closeModal">Cancel & Go Back</v-btn>
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
      default: false
    }
  },
  data() {
    return {
      email: "",
      loadingPay: false,
      loadingWaitlist: false,
      joined: false
    };
  },
  computed: {
    dialog: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit('input', val);
      }
    }
  },
  methods: {
    closeModal() {
      this.dialog = false;
    },
    async payNow() {
      this.loadingPay = true;
      try {
        const response = await fetch("http://localhost:8000/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          alert('Failed to initialize checkout');
        }
      } catch (err) {
        console.error(err);
        alert('Payment service unavailable');
      } finally {
        this.loadingPay = false;
      }
    },
    async joinWaitlist() {
      if (!this.email) return;
      this.loadingWaitlist = true;
      try {
        await fetch("http://localhost:8000/api/waitlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: this.email })
        });
        this.joined = true;
        this.email = "";
      } catch (err) {
        console.error(err);
      } finally {
        this.loadingWaitlist = false;
      }
    }
  }
};
</script>

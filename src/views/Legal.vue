<template>
  <v-app dark class="legal-view">
    <v-app-bar app flat color="rgba(10,10,10,0.8)" style="backdrop-filter: blur(20px)">
      <v-btn icon to="/">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-toolbar-title class="font-weight-black letter-spacing-2">LEGAL & PRIVACY</v-toolbar-title>
    </v-app-bar>

    <v-main>
      <v-container class="py-12">
        <v-row justify="center">
          <v-col cols="12" md="8">
            <v-tabs v-model="tab" color="primary" background-color="transparent" grow class="mb-8">
              <v-tab>Terms of Service</v-tab>
              <v-tab>Privacy Policy</v-tab>
            </v-tabs>

            <v-tabs-items v-model="tab" class="transparent-bg">
              <v-tab-item>
                <div class="legal-content grey--text text--lighten-2">
                  <h1 class="text-h4 white--text mb-6">Terms of Service</h1>
                  <p class="text-caption grey--text mb-8">Last Updated: April 2026</p>
                  
                  <h3>1. Acceptance of Terms</h3>
                  <p>By accessing and using noterender (the "Service"), you agree to be bound by these terms. If you do not agree, do not use the Service.</p>
                  
                  <h3>2. License & Use</h3>
                  <p>We grant you a non-exclusive, non-transferable license to create visual content for personal or commercial use. You retain ownership of any audio you upload; we retain ownership of the visualization engine and templates.</p>
                  
                  <h3>3. Payments & Refunds</h3>
                  <p>Pro exports and Live Passes are billed via Stripe. Due to the digital nature of the product, refunds are handled on a case-by-case basis and are generally not provided once a render has been processed.</p>
                  
                  <h3>4. Limitation of Liability</h3>
                  <p>noterender is provided "as is". We are not responsible for any machine performance issues or data loss during the browser-based recording process.</p>
                </div>
              </v-tab-item>

              <v-tab-item>
                <div class="legal-content grey--text text--lighten-2">
                  <h1 class="text-h4 white--text mb-6">Privacy Policy</h1>
                  <p class="text-caption grey--text mb-8">Last Updated: April 2026</p>
                  
                  <h3>1. Data Collection</h3>
                  <p>We do not store your audio files on our servers. All rendering happens locally in your browser. We collect your email address only if you join our waitlist or initiate a checkout.</p>
                  
                  <h3>2. Cookies & Tracking</h3>
                  <p>We use local storage to save your visualizer preferences and trial status. We use industry-standard analytics to improve the performance of our 3D engine.</p>
                  
                  <h3>3. Third Parties</h3>
                  <p>Payment processing is handled securely by Stripe. We do not have access to your credit card details.</p>
                </div>
              </v-tab-item>
            </v-tabs-items>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: "Legal",
  data() {
    return {
      tab: 0
    };
  }
};
</script>

<style scoped>
.legal-view {
  background-color: #050505 !important;
  overflow-y: auto !important;
}
.transparent-bg {
  background-color: transparent !important;
}
.legal-content h3 {
  color: #fff;
  margin: 32px 0 16px 0;
}
.legal-content p {
  margin-bottom: 16px;
  line-height: 1.6;
}
.letter-spacing-2 { letter-spacing: 2px; }
</style>

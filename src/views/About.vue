<template>
  <v-app dark class="about-view">
    <v-app-bar app flat color="rgba(10,10,10,0.8)" style="backdrop-filter: blur(20px)">
      <v-btn icon to="/">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-toolbar-title class="font-weight-black letter-spacing-2">ABOUT NOTERENDER</v-toolbar-title>
    </v-app-bar>

    <v-main>
      <v-container class="py-12">
        <v-row justify="center">
          <v-col cols="12" md="8" class="text-center">
            <h1 class="text-h2 font-weight-black mb-6 primary--text">The Future of Sound is 3D.</h1>
            <p class="text-h5 font-weight-light grey--text text--lighten-2 mb-12">
              Born in 2024, noterender was built to solve a simple problem: making professional-grade 3D visuals accessible to every producer and DJ without the need for expensive hardware or complex software.
            </p>
          </v-col>
        </v-row>

        <v-row class="mb-12">
          <v-col cols="12" md="4" class="text-center pa-6">
            <v-icon size="64" color="primary" class="mb-4">mdi-lightning-bolt</v-icon>
            <h3 class="text-h5 font-weight-bold mb-2">Real-time Performance</h3>
            <p class="grey--text">Engineered for live environments. Our engine processes audio at the speed of sound with zero latency.</p>
          </v-col>
          <v-col cols="12" md="4" class="text-center pa-6">
            <v-icon size="64" color="primary" class="mb-4">mdi-auto-fix</v-icon>
            <h3 class="text-h5 font-weight-bold mb-2">Browser-Based Power</h3>
            <p class="grey--text">No installation required. Leverage the power of WebGPU and WebGL directly in your browser.</p>
          </v-col>
          <v-col cols="12" md="4" class="text-center pa-6">
            <v-icon size="64" color="primary" class="mb-4">mdi-account-group</v-icon>
            <h3 class="text-h5 font-weight-bold mb-2">Community Driven</h3>
            <p class="grey--text">Developed by a team of audio engineers and visual artists dedicated to the music industry.</p>
          </v-col>
        </v-row>

        <v-divider class="my-12 opacity-10"></v-divider>

        <v-row justify="center">
          <v-col cols="12" md="6">
            <v-card class="pa-8 rounded-xl border-thin" color="rgba(255,255,255,0.03)">
              <h2 class="text-h4 font-weight-bold mb-6">Our Mission</h2>
              <p class="text-h6 font-weight-light grey--text">
                We believe that great music deserves to be seen. By bridging the gap between sound and sight, we empower creators to tell their stories in a new dimension. Whether you're a bedroom producer or a mainstage DJ, noterender is your canvas.
              </p>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <v-footer padless color="transparent" class="py-12">
      <v-container class="text-center">
        <p class="grey--text mb-0">© 2026 noterender Technologies Inc.</p>
      </v-container>
    </v-footer>
  </v-app>
</template>

<style scoped>
.about-view {
  background-color: #050505 !important;
  overflow-y: auto !important;
}
.letter-spacing-2 { letter-spacing: 2px; }
.border-thin { border: 1px solid rgba(255,255,255,0.1) !important; }
.opacity-10 { opacity: 0.1; }
</style>

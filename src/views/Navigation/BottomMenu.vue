<template>
  <v-bottom-navigation
    style="
      position: fixed;
      width: 100%;
      bottom: 0px;
      left: 0px;
      right: 0px;
      height: 40px;
    "
  >
    <v-btn value="recent" @click="tab = 0" class="white">
      <v-icon :color="tab === 0 ? '#CE93D8' : ''">mdi-brush</v-icon>
    </v-btn>

    <v-btn value="sound" @click="tab = 1" class="white">
      <v-icon :color="tab === 1 ? '#90CAF9' : ''">mdi-speaker</v-icon>
    </v-btn>
    <v-btn value="camera" @click="tab = 2" class="white">
      <v-icon :color="tab === 2 ? '#80CBC4' : ''">mdi-camera</v-icon>
    </v-btn>
    <v-btn value="branding" @click="tab = 3" class="white">
      <v-icon :color="tab === 3 ? '#EF9A9A' : ''">mdi-heart</v-icon>
    </v-btn>
    <v-btn value="nearby" @click="tab = 4" class="white">
      <v-icon :color="tab === 4 ? '#C5E1A5' : ''">mdi-download</v-icon>
    </v-btn>
  </v-bottom-navigation>
</template>

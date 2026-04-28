<template>
  <v-app dark>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: "App",
  mounted() {
  },
};
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  background-color: #000;
  min-height: 100vh;
}
</style>

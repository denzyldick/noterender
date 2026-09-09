<template>
  <v-menu offset-y transition="scale-transition" nudge-bottom="6">
    <template v-slot:activator="{ on, attrs }">
      <v-btn small text color="grey" v-on="on" v-bind="attrs" class="text-capitalize">
        <v-icon left size="18">mdi-translate</v-icon>
        {{ currentLabel }}
      </v-btn>
    </template>
    <v-list dense color="rgba(20,20,20,0.98)" class="py-1" style="border:1px solid rgba(255,255,255,0.08)">
      <v-list-item
        v-for="l in locales"
        :key="l.code"
        @click="select(l.code)"
        :class="{ 'active-locale': l.code === current }"
      >
        <v-list-item-title class="text-body-2">
          <v-icon v-if="l.code === current" left small color="primary" class="mr-1">mdi-check</v-icon>
          <v-icon v-else left small class="mr-1" style="visibility:hidden">mdi-check</v-icon>
          {{ l.label }}
        </v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script>
import { SUPPORTED_LOCALES, setLocale } from "@/i18n";

export default {
  name: "LocaleSwitcher",
  data() {
    return { locales: SUPPORTED_LOCALES };
  },
  computed: {
    current() {
      return this.$i18n.locale;
    },
    currentLabel() {
      const l = this.locales.find((x) => x.code === this.current);
      return l ? l.label : "English";
    },
  },
  methods: {
    select(code) {
      setLocale(code);
    },
  },
};
</script>

<style scoped>
.active-locale {
  background: rgba(0, 229, 255, 0.08);
}
</style>
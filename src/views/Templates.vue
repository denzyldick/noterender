<template>
  <v-list dense nav class="transparent-list">
    <v-list-item-group :value="selected" color="primary">
      <v-list-item
        v-for="template in templates"
        :key="template.name"
        :value="template.name"
        @click="$store.commit('templateSelected', template.name)"
        :class="{ 'active-item': selected === template.name }"
      >
        <v-list-item-content>
          <v-list-item-title class="text-h6 font-weight-bold text-uppercase">
            {{ template.name }}
          </v-list-item-title>
          <v-list-item-subtitle class="text-caption">
            {{ template.description }}
          </v-list-item-subtitle>
        </v-list-item-content>
        <v-list-item-action>
          <v-icon v-if="selected === template.name" color="primary">
            mdi-check-circle
          </v-icon>
          <v-icon v-else small color="grey darken-1">
            mdi-circle-outline
          </v-icon>
        </v-list-item-action>
      </v-list-item>
    </v-list-item-group>
  </v-list>
</template>

<script>
export default {
  name: "Templates",
  computed: {
    templates() {
      return this.$store.state.templates;
    },
    selected() {
      return this.$store.state.template;
    },
  },
};
</script>

<style scoped>
.transparent-list {
  background: transparent !important;
}
.active-item {
  border-left: 4px solid var(--v-primary-base);
  background: rgba(0, 229, 255, 0.05) !important;
}
</style>

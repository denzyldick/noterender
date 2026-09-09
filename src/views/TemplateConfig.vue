<template>
  <div class="template-config pa-6" v-if="activeTemplate">
    <div class="text-overline mb-4 primary--text">{{ $t('templateConfig.tuning') }}</div>
    
    <div v-for="(param, key) in activeTemplate.configuration" :key="key" class="mb-6">
      <div class="d-flex justify-space-between align-center mb-1">
        <span class="text-caption grey--text">{{ $te('templates.' + activeTemplate.name + '.config.' + key) ? $t('templates.' + activeTemplate.name + '.config.' + key) : param.label }}</span>
        <span class="text-caption primary--text font-weight-bold">{{ currentConfig[key] }}</span>
      </div>
      
      <v-slider
        v-if="param.type === 'slider'"
        :value="currentConfig[key]"
        @input="updateConfig(key, $event)"
        :min="param.min"
        :max="param.max"
        :step="param.step"
        hide-details
        color="primary"
        track-color="rgba(255,255,255,0.1)"
      ></v-slider>
      
      <v-switch
        v-if="param.type === 'switch'"
        :input-value="currentConfig[key]"
        @change="updateConfig(key, $event)"
        hide-details
        color="primary"
        inset
      ></v-switch>
    </div>

    <v-btn block outlined small color="grey" @click="resetToDefault" class="mt-4 rounded-pill">
      <v-icon left x-small>mdi-refresh</v-icon>
      {{ $t('templateConfig.reset') }}
    </v-btn>
  </div>
  <div v-else class="pa-6 text-center grey--text">
    {{ $t('templateConfig.select') }}
  </div>
</template>

<script>
export default {
  name: "TemplateConfig",
  computed: {
    activeTemplate() {
      return this.$store.state.templates.find(t => t.name === this.$store.state.template);
    },
    currentConfig() {
      return this.activeTemplate ? this.activeTemplate.currentConfig : {};
    }
  },
  methods: {
    updateConfig(key, value) {
      this.$store.commit('updateTemplateConfig', {
        templateName: this.activeTemplate.name,
        config: { [key]: value }
      });
    },
    resetToDefault() {
      const defaults = {};
      Object.keys(this.activeTemplate.configuration).forEach(key => {
        defaults[key] = this.activeTemplate.configuration[key].default;
      });
      this.$store.commit('updateTemplateConfig', {
        templateName: this.activeTemplate.name,
        config: defaults
      });
    }
  }
};
</script>

<style scoped>
.template-config {
  background: transparent;
}
</style>

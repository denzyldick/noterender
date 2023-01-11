<template>
  <v-row>
    <v-col
      md="2"
      class="ml-1"
      v-for="template in templates"
      :key="template.name"
    >
      <v-card
        max-width="200"
        :color="active || template.name === selected ? 'primary' : ''"
        @click="$store.commit('templateSelected', template.name)"
      >
        <v-img
          max-height="200"
          :src="`/img/templates/${template.preview}`"
          :lazy-src="`/img/templates/${template.preview}`"
          aspect-ratio="1"
          class="grey lighten-2 white--black align-end"
          gradient="to bottom left, rgba(100,115,201,.33), rgba(25,32,72,.7)"
        >
          <template v-slot:placeholder>
            <v-row class="fill-height ma-0" align="center" justify="center">
              <v-progress-circular
                indeterminate
                color="grey lighten-5"
              ></v-progress-circular>
            </v-row>
          </template>
          <v-card-title class="font-weight-black white--text text-uppercase">
            {{ template.name }}
          </v-card-title>

          <v-card-subtitle class="text-uppercase white--text">
            {{ template.description }}
          </v-card-subtitle>
        </v-img>

        <v-card-actions>
          <v-btn text @click="$store.commit('templateSelected', template.name)">
            <v-icon v-if="selected === template.name" left dark>
              mdi-check
            </v-icon>
            select
          </v-btn>

          <v-row align="center" justify="end" class="pr-4"> </v-row>
        </v-card-actions>
      </v-card>
    </v-col>
  </v-row>
</template>

<script>
export default {
  name: "Templates",
  data: () => ({
    model: true,
    active: false,
  }),
  computed: {
    templates: function () {
      return this.$store.state.templates;
    },
    selected: function () {
      return this.$store.state.template;
    },
  },
};
</script>

<style scoped></style>

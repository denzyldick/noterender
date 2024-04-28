<template>
  <v-row>
    <v-col
      offset-lg-2
      md="12"
      lg="2"
      sm="12"
      class="ml-1"
      v-for="template in templates"
      :key="template.name"
    >
      <v-card
        class="mx-auto"
        width="80%"
        :color="active || template.name === selected ? 'primary' : ''"
        @click="$store.commit('templateSelected', template.name)"
      >
        <v-img
          max-height="220"
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

        <v-btn
          width="100%"
          text
          @click="$store.commit('templateSelected', template.name)"
        >
          <v-icon v-if="selected === template.name" dark> mdi-check </v-icon>
          <v-icon v-else light> mdi-square-outline</v-icon>
        </v-btn>
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

<template>
  <v-row justify="center">
    <v-col> </v-col>
    <v-dialog v-model="dialog" persistent max-width="290">
      <Stripe />
      <template v-slot:activator="{ on, attrs }">
        <v-btn color="primary" dark v-bind="attrs" v-on="on">
          Open Dialog
        </v-btn>
      </template>
      <v-card>
        <v-card-title class="headline"> </v-card-title>
        <v-card-text> Right now is not possible to generate </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="green darken-1" text @click="dialog = false">
            Disagree
          </v-btn>
          <v-btn color="green darken-1" text @click="dialog = false">
            Agree
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>
<script>
// import Stripe from "@/views/Stripe";

export default {
  // components: {Stripe},
  data() {
    return {
      dialog: true,
    };
  },
};
</script>

<style scoped></style>

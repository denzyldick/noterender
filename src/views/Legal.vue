<template>
  <v-app dark class="legal-view">
    <v-app-bar app flat color="rgba(10,10,10,0.8)" style="backdrop-filter: blur(20px)">
      <v-btn icon to="/">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-toolbar-title class="font-weight-black letter-spacing-2">{{ $t('legal.title') }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <LocaleSwitcher />
    </v-app-bar>

    <v-main>
      <v-container class="py-12">
        <v-row justify="center">
          <v-col cols="12" md="8">
            <v-tabs v-model="tab" color="primary" background-color="transparent" grow class="mb-8">
              <v-tab>{{ $t('legal.termsTab') }}</v-tab>
              <v-tab>{{ $t('legal.privacyTab') }}</v-tab>
            </v-tabs>

            <v-tabs-items v-model="tab" class="transparent-bg">
              <v-tab-item>
                <div class="legal-content grey--text text--lighten-2">
                  <h1 class="text-h4 white--text mb-6">{{ $t('legal.termsTab') }}</h1>
                  <p class="text-caption grey--text mb-8">{{ $t('legal.lastUpdated') }}</p>
                  
                  <h3>{{ $t('legal.terms1Title') }}</h3>
                  <p>{{ $t('legal.terms1Body') }}</p>
                  
                  <h3>{{ $t('legal.terms2Title') }}</h3>
                  <p>{{ $t('legal.terms2Body') }}</p>
                  
                  <h3>{{ $t('legal.terms3Title') }}</h3>
                  <p>{{ $t('legal.terms3Body') }}</p>
                  
                  <h3>{{ $t('legal.terms4Title') }}</h3>
                  <p>{{ $t('legal.terms4Body') }}</p>
                </div>
              </v-tab-item>

              <v-tab-item>
                <div class="legal-content grey--text text--lighten-2">
                  <h1 class="text-h4 white--text mb-6">{{ $t('legal.privacyTab') }}</h1>
                  <p class="text-caption grey--text mb-8">{{ $t('legal.lastUpdated') }}</p>
                  
                  <h3>{{ $t('legal.privacy1Title') }}</h3>
                  <p>{{ $t('legal.privacy1Body') }}</p>
                  
                  <h3>{{ $t('legal.privacy2Title') }}</h3>
                  <p>{{ $t('legal.privacy2Body') }}</p>
                  
                  <h3>{{ $t('legal.privacy3Title') }}</h3>
                  <p>{{ $t('legal.privacy3Body') }}</p>
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
import LocaleSwitcher from "@/components/LocaleSwitcher.vue";

export default {
  name: "Legal",
  components: { LocaleSwitcher },
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

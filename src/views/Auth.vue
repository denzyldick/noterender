<template>
  <div class="auth-app fill-height">
    <div class="locale-switcher-fixed">
      <LocaleSwitcher />
    </div>
    <v-container fill-height class="pa-0">
      <v-row align="center" justify="center" class="ma-0 fill-height">
        <v-col cols="12" sm="8" md="5" lg="4">
          <v-card class="pa-8 rounded-xl" color="rgba(15,15,15,0.95)" style="backdrop-filter:blur(25px);border:1px solid rgba(255,255,255,0.1)">
            <div class="text-center mb-6">
              <img :src="asset('/img/logo.png')" width="64" alt="Noterender" />
              <div class="text-h5 font-weight-black primary--text mt-3 letter-spacing-2">{{ isLogin ? $t('auth.welcomeBack') : $t('auth.createAccount') }}</div>
              <div class="text-caption grey--text mt-1">{{ isLogin ? $t('auth.subLogin') : $t('auth.subRegister') }}</div>
            </div>

            <v-alert v-if="error" dense text type="error" class="mb-4">{{ error }}</v-alert>

            <v-form @submit.prevent="submit">
              <v-text-field v-model="email" :label="$t('auth.email')" outlined dense :disabled="loading" prepend-inner-icon="mdi-email" class="mb-2"></v-text-field>
              <v-text-field v-model="password" :label="$t('auth.password')" outlined dense :disabled="loading" type="password" prepend-inner-icon="mdi-lock" class="mb-4"></v-text-field>

              <v-btn block x-large color="primary" type="submit" :loading="loading" class="font-weight-bold rounded-lg elevation-4">
                {{ isLogin ? $t('auth.signIn') : $t('auth.createAccountBtn') }}
              </v-btn>
            </v-form>

            <v-divider class="my-6 opacity-10"></v-divider>

            <div class="text-center">
              <v-btn text small color="grey" @click="isLogin = !isLogin; error=''">
                {{ isLogin ? $t('auth.noAccount') : $t('auth.haveAccount') }}
              </v-btn>
            </div>

            <div class="text-center mt-2">
              <v-btn text small color="grey" to="/" class="text-caption">{{ $t('auth.skipGuest') }}</v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import { asset } from "../js/assets";
import LocaleSwitcher from "@/components/LocaleSwitcher.vue";

export default {
  name: "Auth",
  components: { LocaleSwitcher },
  data() {
    return {
      isLogin: true,
      email: "",
      password: "",
      loading: false,
      error: "",
    };
  },
  methods: {
    asset,
    async submit() {
      this.error = "";
      if (!this.email || !this.password) { this.error = this.$t("auth.fillFields"); return; }
      this.loading = true;
      try {
        if (this.isLogin) {
          await this.$store.dispatch("login", { email: this.email, password: this.password });
        } else {
          await this.$store.dispatch("register", { email: this.email, password: this.password });
        }
        this.$router.push("/");
      } catch (e) {
        this.error = e.message || this.$t("auth.somethingWentWrong");
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.auth-app { background-color: #000 !important; }
.opacity-10 { opacity: 0.1; }
.letter-spacing-2 { letter-spacing: 2px; }
.locale-switcher-fixed {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 200;
}
</style>

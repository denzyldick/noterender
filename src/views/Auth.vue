<template>
  <div class="auth-app fill-height">
    <v-container fill-height class="pa-0">
      <v-row align="center" justify="center" class="ma-0 fill-height">
        <v-col cols="12" sm="8" md="5" lg="4">
          <v-card class="pa-8 rounded-xl" color="rgba(15,15,15,0.95)" style="backdrop-filter:blur(25px);border:1px solid rgba(255,255,255,0.1)">
            <div class="text-center mb-6">
              <img src="/img/logo.png" width="64" alt="Noterender" />
              <div class="text-h5 font-weight-black primary--text mt-3 letter-spacing-2">{{ isLogin ? 'WELCOME BACK' : 'CREATE ACCOUNT' }}</div>
              <div class="text-caption grey--text mt-1">{{ isLogin ? 'Sign in to your club account' : 'Start your club visualizer setup' }}</div>
            </div>

            <v-alert v-if="error" dense text type="error" class="mb-4">{{ error }}</v-alert>

            <v-form @submit.prevent="submit">
              <v-text-field v-model="email" label="Email" outlined dense :disabled="loading" prepend-inner-icon="mdi-email" class="mb-2"></v-text-field>
              <v-text-field v-model="password" label="Password" outlined dense :disabled="loading" type="password" prepend-inner-icon="mdi-lock" class="mb-4"></v-text-field>

              <v-btn block x-large color="primary" type="submit" :loading="loading" class="font-weight-bold rounded-lg elevation-4">
                {{ isLogin ? 'Sign In' : 'Create Account' }}
              </v-btn>
            </v-form>

            <v-divider class="my-6 opacity-10"></v-divider>

            <div class="text-center">
              <v-btn text small color="grey" @click="isLogin = !isLogin; error=''">
                {{ isLogin ? "Don't have an account? Register" : 'Already have an account? Sign In' }}
              </v-btn>
            </div>

            <div class="text-center mt-2">
              <v-btn text small color="grey" to="/" class="text-caption">Skip — continue as guest</v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
export default {
  name: "Auth",
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
    async submit() {
      this.error = "";
      if (!this.email || !this.password) { this.error = "Fill in all fields"; return; }
      this.loading = true;
      try {
        if (this.isLogin) {
          await this.$store.dispatch("login", { email: this.email, password: this.password });
        } else {
          await this.$store.dispatch("register", { email: this.email, password: this.password });
        }
        this.$router.push("/");
      } catch (e) {
        this.error = e.message || "Something went wrong";
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
</style>

<template>
<v-app dark class="blog-view">
    <v-app-bar app flat color="rgba(10,10,10,0.8)" style="backdrop-filter: blur(20px)">
      <v-btn icon to="/">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-toolbar-title class="font-weight-black letter-spacing-2">{{ $t('blog.title') }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <LocaleSwitcher />
      <v-btn text to="/" class="primary--text">{{ $t('blog.backToStudio') }}</v-btn>
    </v-app-bar>

    <v-main>
      <v-container class="py-12">
        <v-row v-if="!currentPost">
          <v-col cols="12" class="text-center mb-12">
            <h1 class="text-h2 font-weight-black mb-4">{{ $t('blog.heading') }}</h1>
            <p class="text-h6 grey--text">{{ $t('blog.subtitle') }}</p>
          </v-col>
          
          <v-col v-for="post in localizedPosts" :key="post.slug" cols="12" md="4">
            <v-card class="rounded-xl overflow-hidden hover-card" color="rgba(255,255,255,0.05)" @click="currentPost = post">
              <v-img :src="post.image" height="200"></v-img>
              <v-card-title class="text-h6 font-weight-bold">{{ post.title }}</v-card-title>
              <v-card-text class="grey--text">{{ post.excerpt }}</v-card-text>
              <v-card-actions class="pa-4">
                <v-btn text color="primary">{{ $t('blog.readMore') }}</v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

        <v-row v-else justify="center">
          <v-col cols="12" md="8">
            <v-btn text @click="currentPost = null" class="mb-4">
              <v-icon left>mdi-chevron-left</v-icon> {{ $t('blog.allPosts') }}
            </v-btn>
            <v-img :src="currentPost.image" height="400" class="rounded-xl mb-8"></v-img>
            <h1 class="text-h3 font-weight-black mb-6">{{ currentPost.title }}</h1>
            <div class="blog-content grey--text text--lighten-2 text-h6 font-weight-light" v-html="currentPost.content"></div>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <v-footer padless color="transparent" class="py-12">
      <v-container class="text-center">
        <v-divider class="mb-8 opacity-10"></v-divider>
        <p class="grey--text">{{ $t('blog.footer') }}</p>
      </v-container>
    </v-footer>
  </v-app>
</template>

<script>
import { asset } from "../js/assets";
import LocaleSwitcher from "@/components/LocaleSwitcher.vue";

export default {
  name: "Blog",
  components: { LocaleSwitcher },
  data() {
    return {
      currentPost: null,
      posts: [
        {
          key: 1,
          slug: "live-dj-visuals-guide",
          image: asset("/img/templates/Smoke30Frames.png"),
        },
        {
          key: 2,
          slug: "tiktok-music-promotion-tips",
          image: asset("/img/templates/Signature.png"),
        },
        {
          key: 3,
          slug: "audio-reactivity-explained",
          image: asset("/img/templates/Smoke30Frames.png"),
        }
      ]
    };
  },
  computed: {
    localizedPosts() {
      return this.posts.map((p) => ({
        ...p,
        title: this.$t(`blog.post${p.key}Title`),
        excerpt: this.$t(`blog.post${p.key}Excerpt`),
        content: this.$t(`blog.post${p.key}Html`),
      }));
    },
  },
};
</script>

<style scoped>
.blog-view {
  background-color: #050505 !important;
  overflow-y: auto !important;
}
.hover-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  border: 1px solid rgba(255,255,255,0.05) !important;
}
.hover-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0,229,255,0.1) !important;
}
.blog-content >>> h3 {
  color: var(--v-primary-base);
  margin: 32px 0 16px 0;
}
.blog-content >>> p {
  margin-bottom: 20px;
  line-height: 1.8;
}
.letter-spacing-2 {
  letter-spacing: 2px;
}
</style>

<template>
  <v-app dark class="blog-view">
    <v-app-bar app flat color="rgba(10,10,10,0.8)" style="backdrop-filter: blur(20px)">
      <v-btn icon to="/">
        <v-icon>mdi-arrow-left</v-icon>
      </v-btn>
      <v-toolbar-title class="font-weight-black letter-spacing-2">NOTERENDER BLOG</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn text to="/" class="primary--text">Back to Studio</v-btn>
    </v-app-bar>

    <v-main>
      <v-container class="py-12">
        <v-row v-if="!currentPost">
          <v-col cols="12" class="text-center mb-12">
            <h1 class="text-h2 font-weight-black mb-4">Mastering Music Visuals</h1>
            <p class="text-h6 grey--text">Tips, tricks, and guides for the modern music producer.</p>
          </v-col>
          
          <v-col v-for="post in posts" :key="post.slug" cols="12" md="4">
            <v-card class="rounded-xl overflow-hidden hover-card" color="rgba(255,255,255,0.05)" @click="currentPost = post">
              <v-img :src="post.image" height="200"></v-img>
              <v-card-title class="text-h6 font-weight-bold">{{ post.title }}</v-card-title>
              <v-card-text class="grey--text">{{ post.excerpt }}</v-card-text>
              <v-card-actions class="pa-4">
                <v-btn text color="primary">Read More</v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

        <v-row v-else justify="center">
          <v-col cols="12" md="8">
            <v-btn text @click="currentPost = null" class="mb-4">
              <v-icon left>mdi-chevron-left</v-icon> All Posts
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
        <p class="grey--text">© 2026 noterender. Created for producers, by producers.</p>
      </v-container>
    </v-footer>
  </v-app>
</template>

<script>
import { asset } from "../js/assets";

export default {
  name: "Blog",
  data() {
    return {
      currentPost: null,
      posts: [
        {
          title: "How to Create DJ Visuals for Live Club Sets",
          slug: "live-dj-visuals-guide",
          excerpt: "Learn how to use system audio capture to create immersive, reactive visuals for your next gig.",
          image: asset("/img/templates/Smoke30Frames.png"),
          content: `
            <p>In today's club scene, audio isn't enough. Venues are looking for an immersive experience that keeps the crowd engaged. If you're a DJ, having a custom visual set that reacts to your music can be the difference between a "good" set and a "legendary" one.</p>
            
            <h3>Step 1: The Setup</h3>
            <p>Most clubs have a secondary screen or projector. You can connect your laptop via HDMI and use <strong>noterender</strong>'s Live Mode to drive the visuals. The key is to select <strong>System Audio</strong> as your source.</p>
            
            <h3>Step 2: Selecting the Vibe</h3>
            <p>For high-energy techno or house, use the <strong>Trap</strong> template. Its circular spectrum creates a focal point that draws the eyes to the center. For more melodic or deep sets, the <strong>Solaris</strong> star creates a cosmic atmosphere.</p>
            
            <h3>Step 3: Performance Mode</h3>
            <p>Once you're connected, hit the 'Go Live' button. This will enter fullscreen and hide all the editing controls, leaving only the beautiful 3D visuals on the club monitor.</p>
          `
        },
        {
          title: "Promoting Your Beats on TikTok: The Ultimate Guide",
          slug: "tiktok-music-promotion-tips",
          excerpt: "Static images are dead. Learn why high-quality 3D visualizers drive 5x more engagement.",
          image: asset("/img/templates/Signature.png"),
          content: `
            <p>TikTok is the #1 platform for music discovery in 2026. But with millions of songs uploaded every day, how do you stand out? The answer is high-quality visual content.</p>
            
            <h3>Algorithm Love</h3>
            <p>TikTok's algorithm prioritizes watch time. A dynamic 3D visualizer that pulses with the beat keeps users watching longer than a static cover art. <strong>noterender</strong> is designed to export in the native 9:16 format perfectly suited for the platform.</p>
            
            <h3>Visual Consistency</h3>
            <p>Choose a template that matches your genre's aesthetic. Lo-fi producers often love the <strong>Terrain</strong> wireframe, while drill and trap producers go for the <strong>Tunnel</strong> or <strong>City</strong> templates for that high-speed urban feel.</p>
          `
        },
        {
          title: "Understanding Audio Reactivity: Bass vs. Treble",
          slug: "audio-reactivity-explained",
          excerpt: "A deep dive into how FFT data translates into stunning 3D motion.",
          image: asset("/img/templates/Smoke30Frames.png"),
          content: `
            <p>Ever wondered how the visuals actually "know" what the music is doing? It all comes down to the Fast Fourier Transform (FFT).</p>
            
            <h3>The Bass (The Foundation)</h3>
            <p>Low frequencies usually drive the "pulse" or the size of objects in the scene. In our templates, the bass often controls the camera shake and the overall scaling of the central logo.</p>
            
            <h3>The Treble (The Detail)</h3>
            <p>High frequencies control the fine details—the particle flickers, the speed of asteroids, or the height of the outer spectrum bars. By balancing your sensitivity settings in the <strong>Sound</strong> tab, you can create a perfectly synchronized visual masterpiece.</p>
          `
        }
      ]
    };
  }
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

<template>
  <v-app dark class="studio-app" :class="{ 'hide-cursor': !drawer && !isMouseMoving }">
    <!-- Background Visualizer -->
    <div class="visualizer-container">
      <canvas id="renderCanvas" ref="renderCanvas"></canvas>
    </div>

    <!-- Sidebar Navigation -->
    <v-navigation-drawer
      v-model="drawer"
      app
      width="380"
      color="rgba(10, 10, 10, 0.95)"
      class="studio-sidebar no-scrollbar"
      floating
      disable-resize-watcher
      style="backdrop-filter: blur(20px); border-right: 1px solid rgba(255,255,255,0.05)"
    >
      <div class="d-flex flex-column fill-height">
        <!-- Brand Section -->
        <div class="pa-8 text-center flex-shrink-0">
          <div class="logo-wrapper mb-3 pa-4 rounded-xl d-inline-block">
            <img :src="asset('/img/logo.png')" width="80" alt="Noterender logo" />
          </div>
          <div class="text-caption grey--text text--lighten-2 font-weight-black letter-spacing-2">NOTERENDER V2.4</div>
        </div>

        <!-- Mode Switcher -->
        <div class="px-6 mb-4">
          <v-btn-toggle
            v-model="appMode"
            mandatory
            class="mode-toggle w-100 rounded-lg overflow-hidden border-thin"
            background-color="transparent"
            color="primary"
          >
            <v-btn value="studio" block class="flex-grow-1" height="44">
              <v-icon left size="20">mdi-pencil-ruler</v-icon>
              Studio
            </v-btn>
            <v-btn value="live" block class="flex-grow-1" height="44">
              <v-icon left size="20">mdi-broadcast</v-icon>
              Live
            </v-btn>
          </v-btn-toggle>
        </div>

        <v-divider class="mx-8 opacity-10"></v-divider>

        <!-- Sidebar Tabs -->
        <v-tabs
          v-model="activeTab"
          vertical
          color="primary"
          background-color="transparent"
          class="studio-tabs flex-grow-1"
          hide-slider
        >
          <div class="tabs-scroll-area no-scrollbar">
            <v-tab class="justify-center px-4"><v-icon size="22">mdi-aspect-ratio</v-icon><span class="tab-text ml-2">Canvas</span></v-tab>
            <v-tab class="justify-center px-4"><v-icon size="22">mdi-palette-swatch</v-icon><span class="tab-text ml-2">Style</span></v-tab>
            <v-tab class="justify-center px-4"><v-icon size="22">mdi-sine-wave</v-icon><span class="tab-text ml-2">Sound</span></v-tab>
            <v-tab class="justify-center px-4"><v-icon size="22">mdi-video-3d</v-icon><span class="tab-text ml-2">Camera</span></v-tab>
            <v-tab class="justify-center px-4"><v-icon size="22">mdi-auto-fix</v-icon><span class="tab-text ml-2">Effects</span></v-tab>
            <v-tab class="justify-center px-4"><v-icon size="22">mdi-text-recognition</v-icon><span class="tab-text ml-2">Branding</span></v-tab>
            <v-tab v-if="appMode === 'studio'" class="justify-center px-4"><v-icon size="22">mdi-movie-filter</v-icon><span class="tab-text ml-2">Render</span></v-tab>
          </div>

          <v-tabs-items v-model="activeTab" class="transparent-bg studio-tab-content no-scrollbar">
            <!-- Canvas -->
            <v-tab-item>
              <div class="pa-6">
                <div class="text-overline mb-4 primary--text">Dimensions</div>
                <v-list dark dense flat class="transparent">
                  <v-list-item-group v-model="selectedSize" color="primary">
                    <v-list-item v-for="s in sizes" :key="s.name" :value="s.name" @click="setSize(s.name)">
                      <v-list-item-icon><v-icon>{{ s.name === 'Auto' ? 'mdi-auto-fix' : 'mdi-crop-free' }}</v-icon></v-list-item-icon>
                      <v-list-item-content>
                        <v-list-item-title>{{ s.name }}</v-list-item-title>
                        <v-list-item-subtitle v-if="s.size.x">{{ s.size.x }} x {{ s.size.y }}</v-list-item-subtitle>
                        <v-list-item-subtitle v-else>Adapts to screen</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                  </v-list-item-group>
                </v-list>
              </div>
            </v-tab-item>

            <!-- Style -->
            <v-tab-item>
              <div class="pa-0">
                <div class="pa-6 pb-0">
                  <div class="text-overline mb-4 primary--text">Templates</div>
                  <Templates />
                </div>
                <v-divider class="mx-6 my-2 opacity-10"></v-divider>
                <TemplateConfig />
              </div>
            </v-tab-item>

            <!-- Sound -->
            <v-tab-item>
              <div class="pa-6">
                <div class="text-overline mb-4 primary--text">Audio Source</div>
                <v-list dark dense flat class="transparent">
                  <v-list-item-group v-model="audioSource" color="primary" mandatory>
                    <v-list-item value="file" v-if="appMode === 'studio'">
                      <v-list-item-icon><v-icon>mdi-file-music</v-icon></v-list-item-icon>
                      <v-list-item-content>
                        <v-list-item-title>Local File</v-list-item-title>
                        <v-list-item-subtitle>Upload an MP3/WAV</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                    <v-list-item value="mic">
                      <v-list-item-icon><v-icon>mdi-microphone</v-icon></v-list-item-icon>
                      <v-list-item-content>
                        <v-list-item-title>Microphone</v-list-item-title>
                        <v-list-item-subtitle>Live room audio</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                    <v-list-item value="system">
                      <v-list-item-icon><v-icon>mdi-monitor-speaker</v-icon></v-list-item-icon>
                      <v-list-item-content>
                        <v-list-item-title>System Audio</v-list-item-title>
                        <v-list-item-subtitle>Screen/window capture</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                    <v-list-item value="device">
                      <v-list-item-icon><v-icon>mdi-cable-data</v-icon></v-list-item-icon>
                      <v-list-item-content>
                        <v-list-item-title>Capture Device</v-list-item-title>
                        <v-list-item-subtitle>Virtual cable / audio interface</v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                  </v-list-item-group>
                </v-list>

                <v-select
                  v-if="audioSource === 'device'"
                  v-model="selectedDeviceId"
                  :items="audioDevices"
                  item-title="label"
                  item-value="deviceId"
                  label="Select Audio Device"
                  outlined
                  dense
                  class="mt-4"
                  prepend-inner-icon="mdi-volume-source"
                  @click:prepend-inner="enumerateAudioDevices"
                >
                  <template v-slot:append>
                    <v-btn icon x-small @click="enumerateAudioDevices" class="mt-n1">
                      <v-icon>mdi-refresh</v-icon>
                    </v-btn>
                  </template>
                </v-select>

                <v-btn
                  v-if="audioSource === 'device'"
                  block
                  small
                  text
                  color="primary"
                  class="mt-2"
                  @click="showAudioSetupGuide = true"
                >
                  <v-icon left small>mdi-help-circle</v-icon> How to set up a virtual audio cable
                </v-btn>

                <v-alert v-if="audioSource === 'system'" dense text type="info" class="mt-4 text-caption">
                  Tip: When the browser asks to share your screen, go to the <strong>"Tab"</strong> or <strong>"Window"</strong> section and ensure <strong>"Also share system audio"</strong> is checked.
                </v-alert>

                <v-file-input v-if="audioSource === 'file' && appMode === 'studio'" label="Choose Audio" outlined dense @change="soundSelected" prepend-inner-icon="mdi-music-circle" class="mt-4"></v-file-input>
                
                <div v-if="appMode === 'live'">
                  <div class="text-overline mt-6 mb-2 primary--text">Performance</div>

                  <v-alert dense text type="info" class="mb-4 text-caption" style="border-left: 4px solid #00E5FF; background-color: rgba(0, 229, 255, 0.05) !important;">
                    <strong>For clean big-screen output:</strong> Use a <strong>virtual audio cable</strong> (VB-Cable / BlackHole) and select it under "Capture Device" in the Sound tab. This avoids the browser "Sharing" bar.
                  </v-alert>

                  <v-switch v-model="removeWatermarkCheckbox" label="Clean Performance (No Branding)" color="primary" dense class="mb-4" @click.native="paywallMode = 'live'"></v-switch>

                  <v-divider class="my-2 opacity-10"></v-divider>

                  <div class="text-overline mt-4 mb-2 primary--text">TikTok Live</div>

                  <v-switch v-model="tiktokEnabled" label="Stream to TikTok Live" color="error" dense class="mb-2"></v-switch>

                  <template v-if="tiktokEnabled">
                    <v-text-field v-model="tiktokRtmpUrl" label="TikTok RTMP URL (Server URL)" outlined dense hide-details class="mb-3" prepend-inner-icon="mdi-radio-tower" @blur="saveTikTokSettings" placeholder="rtmps://xxxx.ts.tiktoklive.com:443/live"></v-text-field>
                    <v-text-field v-model="tiktokStreamKey" label="TikTok Stream Key" outlined dense hide-details class="mb-3" prepend-inner-icon="mdi-key-variant" @blur="saveTikTokSettings" type="password"></v-text-field>
                    <v-text-field v-model="tiktokRelayUrl" label="Relay Server" outlined dense hide-details class="mb-3" prepend-inner-icon="mdi-server-network" @blur="saveTikTokSettings" placeholder="ws://localhost:8090"></v-text-field>

                    <v-alert dense text type="info" class="mb-4 text-caption">
                      <strong>Get keys:</strong> Open TikTok &rarr; your profile &rarr; LIVE &rarr; tools &rarr; "Stream Key", then paste Server URL + Stream Key above. The stream is relayed through ffmpeg — start it once with <code>node rtmp-relay/server.js</code>.
                    </v-alert>

                    <v-alert
                      v-if="streamState"
                      dense
                      text
                      class="mb-4 text-caption"
                      :type="streamState === 'error' ? 'error' : (streamState === 'live' ? 'success' : 'info')"
                    >
                      {{ streamState === 'live' ? 'Live on TikTok' : streamMessage }}
                    </v-alert>
                  </template>

                  <v-btn block color="error" x-large @click="goLive" class="rounded-lg font-weight-bold">
                    <v-icon left>mdi-broadcast</v-icon>
                    START LIVE SESSION
                  </v-btn>

                  <v-btn block text color="primary" class="mt-2" @click="toggleFullscreen">
                    <v-icon left>mdi-fullscreen</v-icon>
                    Toggle Fullscreen
                  </v-btn>
                </div>

                <div class="text-overline mt-6 mb-4 primary--text">Sensitivity Presets</div>
                <div class="d-flex flex-wrap mb-6" style="gap: 8px">
                  <v-chip
                    v-for="p in ['Smooth', 'Standard', 'Dynamic', 'Jumpy']"
                    :key="p"
                    small
                    label
                    outlined
                    @click="applySensitivityPreset(p)"
                    class="preset-chip"
                    :style="{ borderColor: 'rgba(255,255,255,0.2)' }"
                  >
                    {{ p }}
                  </v-chip>
                </div>

                <div class="text-overline mb-2 primary--text">Manual Controls</div>
                <div class="mb-4">
                  <div class="text-caption d-flex justify-space-between grey--text">
                    <span>FFT Smoothing</span>
                    <span>{{ Math.round(sensitivity.fftSmoothing * 100) }}%</span>
                  </div>
                  <v-slider
                    v-model="fftSmoothing"
                    min="0"
                    max="0.99"
                    step="0.01"
                    hide-details
                    class="mt-1"
                  ></v-slider>
                </div>

                <div class="mb-4">
                  <div class="text-caption d-flex justify-space-between grey--text">
                    <span>Bass Sensitivity</span>
                    <span>{{ sensitivity.bassBoost.toFixed(1) }}x</span>
                  </div>
                  <v-slider
                    v-model="bassBoost"
                    min="0.5"
                    max="3.0"
                    step="0.1"
                    hide-details
                    class="mt-1"
                  ></v-slider>
                </div>
              </div>
            </v-tab-item>

            <!-- Camera -->
            <v-tab-item>
              <div class="pa-6">
                <div class="text-overline mb-4 primary--text">Motion</div>
                <v-switch v-model="cameraMove" :label="cameraMove ? 'Auto-Orbiting' : 'Stationary'" color="primary" inset></v-switch>
                <div class="text-caption grey--text">Toggle automatic camera rotation around the scene.</div>
              </div>
            </v-tab-item>

            <!-- Effects -->
            <v-tab-item>
              <div class="pa-6">
                <div class="text-overline mb-4 primary--text">Visual Enhancements</div>
                <v-list dark dense flat class="transparent">
                  <v-list-item v-for="effect in effectList" :key="effect.id" @click="toggleEffect(effect.id)">
                    <v-list-item-action><v-checkbox :input-value="activeEffects.includes(effect.id)" color="primary" hide-details></v-checkbox></v-list-item-action>
                    <v-list-item-content>
                      <v-list-item-title>{{ effect.name }}</v-list-item-title>
                      <v-list-item-subtitle>{{ effect.desc }}</v-list-item-subtitle>
                    </v-list-item-content>
                  </v-list-item>
                </v-list>
              </div>
            </v-tab-item>

            <!-- Branding -->
            <v-tab-item>
              <div class="pa-6">
                <div class="text-overline mb-4 primary--text">Text Content</div>
                <v-text-field v-model="title" label="Title Text" outlined dense @input="updateTitle" class="mb-2"></v-text-field>
                <v-text-field v-model="subtitle" label="Subtitle" outlined dense @input="updateSubtitle" class="mb-6"></v-text-field>
                
                <div class="text-overline mb-4 primary--text">Visualizer Style</div>
                <div class="d-flex flex-wrap mb-6" style="gap: 8px">
                  <v-chip
                    v-for="s in ['Liquid', 'None']"
                    :key="s"
                    small
                    label
                    :color="logoStyle === s ? 'primary' : ''"
                    outlined
                    @click="setLogoStyle(s)"
                    class="preset-chip"
                  >
                    {{ s }}
                  </v-chip>
                </div>

                <div class="text-overline mb-2 primary--text">Color Presets</div>
                <div class="d-flex flex-wrap mb-6" style="gap: 8px">
                  <v-chip
                    v-for="p in colorPresets"
                    :key="p.name"
                    small
                    label
                    outlined
                    @click="applyPreset(p)"
                    class="preset-chip"
                    :style="{ borderColor: 'rgba(255,255,255,0.2)' }"
                  >
                    <div class="preset-preview mr-2" :style="{ background: p.dynamic ? 'linear-gradient(45deg, #ff0000, #00ff00, #0000ff)' : `linear-gradient(45deg, rgb(${p.colors.r},${p.colors.g},${p.colors.b}), rgb(${p.light.r},${p.light.g},${p.light.b}))` }"></div>
                    {{ p.name }}
                  </v-chip>
                </div>

                <div class="text-overline mb-2 primary--text">Custom Colors</div>
                <div class="d-flex mb-6 mt-2">
                  <div class="mr-4 flex-grow-1">
                    <div class="text-caption mb-2 grey--text">Primary</div>
                    <v-menu offset-y :close-on-content-click="false">
                      <template v-slot:activator="{ on }"><v-btn block small v-on="on" :color="accentColorHex" class="rounded-pill border-thin elevation-0">Pick</v-btn></template>
                      <v-color-picker :value="accentColorHex" @update:color="colorSelected" flat mode="hex"></v-color-picker>
                    </v-menu>
                  </div>
                  <div class="flex-grow-1">
                    <div class="text-caption mb-2 grey--text">Accent</div>
                    <v-menu offset-y :close-on-content-click="false">
                      <template v-slot:activator="{ on }"><v-btn block small v-on="on" :color="lightColorHex" class="rounded-pill border-thin elevation-0">Pick</v-btn></template>
                      <v-color-picker :value="lightColorHex" @update:color="setLightColor" flat mode="hex"></v-color-picker>
                    </v-menu>
                  </div>
                </div>

                <v-file-input label="Center Logo" dense outlined @change="emblemSelected" prepend-inner-icon="mdi-sticker-emoji"></v-file-input>

                <v-divider class="my-4 opacity-10"></v-divider>

                <div class="text-overline mb-2 primary--text">Announcements</div>
                <v-text-field v-model="announcementInput" label="Announcement text" outlined dense hide-details class="mb-2"></v-text-field>
                <v-row dense class="mb-2">
                  <v-col cols="4">
                    <v-text-field v-model.number="announcementDuration" label="Seconds" outlined dense type="number" hide-details></v-text-field>
                  </v-col>
                  <v-col cols="8">
                    <v-btn block color="warning" @click="showAnnouncement" :disabled="!announcementInput">
                      <v-icon left>mdi-bullhorn</v-icon> Show Announcement
                    </v-btn>
                  </v-col>
                </v-row>

                <v-divider class="my-4 opacity-10"></v-divider>

                <div class="text-overline mb-2 primary--text">Shoutouts</div>
                <div class="text-caption grey--text mb-3">Audience can submit shoutouts at this URL:</div>
                <v-text-field :value="shoutoutUrl" readonly outlined dense hide-details class="mb-3" prepend-inner-icon="mdi-link" @click:prepend="copyShoutoutUrl" @click="copyShoutoutUrl" bg-color="rgba(255,255,255,0.03)">
                  <template v-slot:append>
                    <v-btn icon x-small @click="copyShoutoutUrl">
                      <v-icon size="16">mdi-content-copy</v-icon>
                    </v-btn>
                  </template>
                </v-text-field>

                <div v-if="isLoggedIn">
                  <div class="d-flex align-center mb-2">
                    <span class="text-body-2 font-weight-bold white--text">Pending Messages</span>
                    <v-spacer></v-spacer>
                    <v-chip x-small label color="primary" class="font-weight-bold">{{ pendingShoutouts.length }}</v-chip>
                  </div>
                  <div v-if="pendingShoutouts.length === 0" class="text-caption grey--text text-center py-4" style="background:rgba(255,255,255,0.02); border-radius:8px">
                    No pending shoutouts
                  </div>
                  <div v-for="s in pendingShoutouts" :key="s.id" class="d-flex align-start pa-3 mb-2 rounded-lg" style="background:rgba(255,255,255,0.04)">
                    <div class="flex-grow-1" style="min-width:0">
                      <div class="text-body-2 font-weight-bold white--text truncate-text">{{ s.name }}</div>
                      <div class="text-caption grey--text truncate-text">{{ s.message }}</div>
                    </div>
                    <div class="d-flex ml-2" style="gap:4px; flex-shrink:0">
                      <v-btn x-small icon color="success" @click="approveShoutout(s.id)" title="Approve"><v-icon size="16">mdi-check</v-icon></v-btn>
                      <v-btn x-small icon color="error" @click="rejectShoutout(s.id)" title="Reject"><v-icon size="16">mdi-close</v-icon></v-btn>
                    </div>
                  </div>
                </div>
                <div v-else class="text-caption grey--text text-center py-4" style="background:rgba(255,255,255,0.02); border-radius:8px">
                  <v-icon small class="mr-1">mdi-lock</v-icon>
                  Sign in to moderate shoutouts
                </div>
              </div>
            </v-tab-item>

            <!-- Export -->
            <v-tab-item>
              <div class="pa-6">
                <!-- Browser Recording Warning -->
                <v-alert
                  dense
                  type="info"
                  color="warning"
                  class="mb-6 mb-4 text-caption"
                  style="border-left: 4px solid #ff9800; background-color: rgba(255, 152, 0, 0.1) !important;"
                >
                  <strong class="d-block mb-1">Warning: Browser Export</strong>
                  Video quality depends on your machine's performance. <strong>Do not resize the window</strong> while recording, as it will change the video resolution mid-render.
                </v-alert>

                <v-checkbox v-model="removeWatermarkCheckbox" label="Remove Watermark (Pro Only)" dense color="primary" @click.native="paywallMode = 'export'"></v-checkbox>
                <v-checkbox v-model="highQuality" label="8Mbps High Bitrate" dense color="primary" class="mb-4"></v-checkbox>
                
                <v-btn block color="primary" x-large @click="handleExport" class="rounded-lg font-weight-bold elevation-4">
                  <v-icon left>{{ isExporting ? 'mdi-stop' : 'mdi-export' }}</v-icon>
                  {{ isExporting ? 'Stop & Save' : 'Export Video' }}
                </v-btn>
              </div>
            </v-tab-item>
          </v-tabs-items>
        </v-tabs>

        <!-- Company Footer -->
        <div class="pa-6 mt-auto flex-shrink-0" style="background: rgba(0,0,0,0.2)">
          <div class="d-flex align-center mb-4">
            <div class="status-dot mr-2"></div>
            <span class="text-caption grey--text font-weight-bold">ENGINE STATUS: <span class="success--text">ACTIVE</span></span>
          </div>
          
          <v-row no-gutters>
            <v-col cols="6"><v-btn v-if="isLoggedIn" text x-small color="grey" block class="justify-start px-0" to="/dj" target="_blank"><v-icon x-small class="mr-1">mdi-open-in-new</v-icon>DJ Remote</v-btn></v-col>
            <v-col cols="6"><v-btn text x-small color="grey" block class="justify-start px-0" to="/blog">Blog</v-btn></v-col>
            <v-col cols="6"><v-btn text x-small color="grey" block class="justify-start px-0" to="/legal">Legal</v-btn></v-col>
            <v-col cols="6"><v-btn text x-small color="grey" block class="justify-start px-0" href="mailto:support@noterender.com">Support</v-btn></v-col>
          </v-row>
        </div>
      </div>
    </v-navigation-drawer>

    <!-- Sidebar Toggle Button (Floating) -->
    <v-btn
      fab
      fixed
      top
      left
      color="rgba(30, 30, 30, 0.8)"
      large
      elevation="12"
      class="mt-4 ml-4 sidebar-toggle"
      :class="{ 'ui-hidden': playing && !isMouseMoving && !drawer }"
      @click="drawer = !drawer"
      @mouseover="resetMouseTimer"
      style="z-index: 100; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2)"
    >
      <v-icon color="white">{{ drawer ? 'mdi-chevron-left' : 'mdi-tune-vertical' }}</v-icon>
    </v-btn>

    <!-- Help Icon (Top-Right) -->
    <v-btn
      fab
      fixed
      top
      right
      color="rgba(30, 30, 30, 0.8)"
      small
      elevation="12"
      class="mt-4 mr-4"
      :class="{ 'ui-hidden': playing && !isMouseMoving && !showHelp }"
      @click="showHelp = true"
      @mouseover="resetMouseTimer"
      style="z-index: 100; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.2)"
    >
      <v-icon color="white">mdi-help</v-icon>
    </v-btn>

    <!-- Shortcut Help Dialog -->
    <v-dialog v-model="showHelp" max-width="400">
      <v-card color="rgba(15, 15, 15, 0.95)" style="backdrop-filter: blur(25px); border: 1px solid rgba(255,255,255,0.1)">
        <v-card-title class="headline primary--text font-weight-black letter-spacing-2">SHORTCUTS</v-card-title>
        <v-card-text class="pa-6">
          <v-list dark dense flat class="transparent">
            <v-list-item v-for="s in shortcuts" :key="s.key" class="px-0">
              <v-list-item-content>
                <v-list-item-title class="grey--text text--lighten-1">{{ s.desc }}</v-list-item-title>
              </v-list-item-content>
              <v-list-item-action>
                <v-chip label small outlined color="primary" class="font-weight-black">{{ s.key }}</v-chip>
              </v-list-item-action>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions class="pa-6">
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="showHelp = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Floating Transport HUD -->
    <v-main class="pa-0 fill-height">
      <div class="transport-container" :class="{ 'ui-hidden': playing && !isMouseMoving && !drawer }">
        <v-card class="transport-bar d-flex align-center px-4 rounded-pill elevation-24" color="rgba(20, 20, 20, 0.85)" style="height: 64px">
          <div class="play-btn-wrapper" :class="{ 'pulse-ring': !playing }">
            <v-btn icon color="white" large @click="togglePlayLocal" :class="{ 'recording-active': isExporting }">
              <v-icon size="40">{{ playing ? 'mdi-stop-circle' : 'mdi-play-circle-outline' }}</v-icon>
            </v-btn>
          </div>
          <v-chip v-if="streamState === 'live'" color="error" dark class="ml-3 pulse-red font-weight-bold">
            <v-icon left size="16">mdi-access-point</v-icon>
            LIVE
          </v-chip>
          <v-chip v-else-if="streamState" :color="streamState === 'error' ? 'grey' : 'amber'" dark class="ml-3">
            <v-icon left size="16">{{ streamState === 'error' ? 'mdi-alert' : 'mdi-access-point' }}</v-icon>
            {{ streamState === 'error' ? 'STREAM ERROR' : 'CONNECTING' }}
          </v-chip>
          <v-btn-toggle v-model="appMode" mandatory background-color="transparent" color="primary" dense class="ml-4 border-thin rounded-pill px-2">
            <v-btn value="studio" small text class="rounded-pill px-4">Studio</v-btn>
            <v-btn value="live" small text class="rounded-pill px-4">Live</v-btn>
          </v-btn-toggle>
          <v-btn v-if="appMode === 'studio'" color="primary" rounded class="ml-4 font-weight-bold elevation-4 px-6" style="height: 36px" @click="handleExport">
            <v-icon left size="18">{{ isExporting ? 'mdi-stop' : 'mdi-export' }}</v-icon> 
            {{ isExporting ? 'Stop & Save' : 'Export' }}
          </v-btn>
          <v-btn v-else color="error" rounded class="ml-4 font-weight-bold elevation-4 px-6 pulse-red" style="height: 36px" @click="goLive">
            <v-icon left size="18">mdi-broadcast</v-icon> 
            START LIVE
          </v-btn>
          <template v-if="isDesktop && monitors.length > 0">
            <v-divider vertical class="mx-4 grey darken-3 my-4"></v-divider>
            <v-select
              v-model="selectedMonitorIndex"
              :items="monitors.map((m, i) => ({ text: m.name || `Monitor ${i + 1}`, value: i }))"
              dense
              dark
              outlined
              hide-details
              class="mt-0"
              style="max-width: 180px"
              prepend-inner-icon="mdi-monitor"
            ></v-select>
            <v-btn v-if="!visualizerOpen" icon color="green" class="ml-2" @click="openVisualizer" title="Open visualizer on selected monitor">
              <v-icon>mdi-monitor-dashboard</v-icon>
            </v-btn>
            <v-btn v-else icon color="red" class="ml-2" @click="closeVisualizerWindow" title="Close visualizer">
              <v-icon>mdi-close-circle</v-icon>
            </v-btn>
          </template>
          <v-divider vertical class="mx-6 grey darken-3 my-4"></v-divider>
          <div class="d-none d-sm-block mr-2" style="min-width: 120px">
            <div class="text-overline primary--text font-weight-black mb-n1" style="letter-spacing: 3px !important">ACTIVE</div>
            <div class="text-h6 white--text text-uppercase font-weight-light truncate-text">{{ template }}</div>
          </div>
        </v-card>
      </div>
    </v-main>

    <audio style="display: none" id="audio" :src="soundFile" loop></audio>

    <PaywallModal v-model="showPaywall" :mode="paywallMode" @trial-started="startLiveAfterTrial" />

    <!-- Live Mode Explanation Dialog -->
    <v-dialog v-model="showLiveDialog" max-width="480" persistent>
      <v-card color="rgba(15,15,15,0.95)" class="pa-6 rounded-xl" style="border:1px solid rgba(255,255,255,0.1)">
        <v-card-title class="pa-0 primary--text font-weight-black text-h5 mb-4 letter-spacing-2">LIVE MODE</v-card-title>

        <div class="mb-4">
          <div class="d-flex mb-3">
            <v-icon color="primary" class="mr-3">mdi-monitor-speaker</v-icon>
            <div>
              <div class="font-weight-bold white--text">1. Select your audio source</div>
              <div class="text-caption grey--text">Choose "Capture Device" for clean big-screen output (recommended), or "System Audio" to share a window</div>
            </div>
          </div>
          <div class="d-flex mb-3">
            <v-icon color="primary" class="mr-3">mdi-monitor-screenshot</v-icon>
            <div>
              <div class="font-weight-bold white--text">2. Choose what to share</div>
              <div class="text-caption grey--text">Your browser will ask you to select a window or screen. Make sure to check "Also share system audio"</div>
            </div>
          </div>
          <div class="d-flex">
            <v-icon color="primary" class="mr-3">mdi-fullscreen</v-icon>
            <div>
              <div class="font-weight-bold white--text">3. Go fullscreen</div>
              <div class="text-caption grey--text">The visualizer will enter fullscreen mode. Move your mouse to reveal controls</div>
            </div>
          </div>
        </div>

        <v-checkbox v-model="dontShowLiveDialog" label="Don't show this again" dense color="primary" class="mb-2"></v-checkbox>

        <v-btn block x-large color="primary" @click="startLiveCapture" class="font-weight-bold rounded-lg">Continue</v-btn>
        <v-btn block text color="grey" @click="showLiveDialog = false" class="mt-2">Cancel</v-btn>
      </v-card>
    </v-dialog>

    <!-- Audio Setup Guide Dialog -->
    <v-dialog v-model="showAudioSetupGuide" max-width="500">
      <v-card color="rgba(15,15,15,0.95)" class="pa-6 rounded-xl" style="border:1px solid rgba(255,255,255,0.1)">
        <v-card-title class="pa-0 primary--text font-weight-black text-h5 mb-4 letter-spacing-2">SETUP GUIDE</v-card-title>

        <div class="mb-4">
          <div class="font-weight-bold white--text mb-2">What is a virtual audio cable?</div>
          <div class="text-caption grey--text mb-4">It lets you route audio from your DJ software (Ableton, Serato, Spotify, etc.) directly into the visualizer — no screen sharing needed, so no Chrome "Sharing" bar appears on the big screen.</div>

          <div class="font-weight-bold white--text mb-2">Windows</div>
          <div class="text-caption grey--text mb-3">Download <strong>VB-Cable</strong> from vb-audio.com/Cable — install, restart. Your DJ software outputs to "CABLE Input", visualizer captures from "CABLE Output".</div>

          <div class="font-weight-bold white--text mb-2">macOS</div>
          <div class="text-caption grey--text mb-3">Install <strong>BlackHole</strong> from github.com/ExistentialAudio/BlackHole. Create a Multi-Output Device in Audio MIDI Setup. Route DJ software to it.</div>

          <div class="font-weight-bold white--text mb-2">Linux</div>
          <div class="text-caption grey--text">Use PipeWire's loopback module or `pactl load-module module-null-sink`.</div>
        </div>

        <v-btn block color="primary" @click="showAudioSetupGuide = false" class="font-weight-bold">Got it</v-btn>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script>
import * as BABYLON from "babylonjs";
import audio from "../js/Audio";
import "babylonjs-loaders";
import Recording from "./../js/Recording";
import Templates from "./Templates.vue";
import TemplateConfig from "./TemplateConfig.vue";
import PaywallModal from "@/components/PaywallModal.vue";
import TEXT from "@/js/templates/components/text";
import Effects from "@/js/Effects";
import CAMERA from "@/js/templates/components/camera";
import Streaming from "@/js/Streaming";
import { asset } from "@/js/assets";

// Visualizer Engines
import city from "../js/templates/city";
import terrain from "../js/templates/terrain";
import nebulacore from "../js/templates/nebulacore";
import trap from "../js/templates/trap";
import solaris from "../js/templates/solaris";
import infinity from "../js/templates/infinity";
import tunnel from "../js/templates/tunnel";
import aether from "../js/templates/aether";
import monolith from "../js/templates/monolith";
import prism from "../js/templates/prism";
import flora from "../js/templates/flora";
import clouds from "../js/templates/clouds";
import aurora from "../js/templates/aurora";
import cathedral from "../js/templates/cathedral";
import oscillate from "../js/templates/oscillate";
import reactor from "../js/templates/reactor";

export default {
  name: "Player",
  components: { Templates, TemplateConfig, PaywallModal },
  data() {
    return {
      drawer: false,
      activeTab: 0,
      playing: false,
      audio: null,
      engine: null,
      scene: null,
      camera: null,
      alpha: 0,
      multiplierValue: 0,
      canvas: null,
      title: "",
      subtitle: "",
      accentColorHex: "#00E5FF",
      lightColorHex: "#00E5FF",
      templates: {
        city, terrain, nebulacore, trap, solaris, infinity, tunnel, aether, monolith, prism, flora,
        clouds, aurora, cathedral, oscillate, reactor
      },
      isPro: false,
      showPaywall: false,
      isExporting: false,
      isTransitioning: false,
      activeTemplateName: "",
      showHelp: false,
      mouseTimer: null,
      isMouseMoving: true,
      appMode: "studio",
      paywallMode: "export",
      tiktokEnabled: localStorage.getItem("noterender_tiktok_enabled") === "true",
      tiktokRtmpUrl: localStorage.getItem("noterender_tiktok_rtmp") || "",
      tiktokStreamKey: localStorage.getItem("noterender_tiktok_key") || "",
      tiktokRelayUrl: localStorage.getItem("noterender_tiktok_relay") || "ws://localhost:8090",
      streamState: "",
      streamMessage: "",
      audioDevices: [],
      selectedDeviceId: "",
      showAudioSetupGuide: false,
      showLiveDialog: false,
      dontShowLiveDialog: localStorage.getItem("noterender_dont_show_live_dialog") === "true",
      showAnnounceInput: false,
      announcementInput: "",
      announcementDuration: 5,
      lastShoutoutFetch: "",
      shoutoutTimer: null,
      pendingShoutoutTimer: null,
      pendingShoutouts: [],
      autoSaveTimer: null,
      effectList: [
        { id: 'smoke', name: 'Smoke Atmosphere', desc: 'Reactive particle fog system' },
        { id: 'thunder', name: 'Dynamic Thunder', desc: 'Bass-triggered lightning flashes' },
        { id: 'birds', name: 'Flying Creatures', desc: 'Abstract birds following the beat' },
        { id: 'glitch', name: 'Glitch Mode', desc: 'Digital distortion and chromatic shifts' },
        { id: 'grid', name: 'Neon Grid', desc: 'Retro-futuristic pulsing floor grid' },
        { id: 'fireflies', name: 'Organic Fireflies', desc: 'Wandering glowing light particles' },
        { id: 'rain', name: 'Matrix Rain', desc: 'Vertical falling streaks of code-light' },
        { id: 'shockwave', name: 'Bass Shockwaves', desc: 'Expanding rings on heavy sub-hits' },
        { id: 'lasers', name: 'Scanning Lasers', desc: 'Volumetric beams sweeping the scene' },
        { id: 'dust', name: 'Cosmic Dust', desc: 'Floating deep-space particles' },
        { id: 'crystals', name: 'Floating Shards', desc: 'Rotating geometric glass crystals' },
        { id: 'vignette', name: 'Cinematic Border', desc: 'Pulsing edge focus and framing' },
        { id: 'bloom', name: 'Bloom Flash', desc: 'Intense brightness peaks on snare' }
      ],
      shortcuts: [
        { key: 'j / k', desc: 'Next / Previous Tab' },
        { key: 'h / l', desc: 'Toggle Sidebar' },
        { key: '[ / ]', desc: 'Next / Previous Template' },
        { key: '1 - 7', desc: 'Jump to Tab' },
        { key: 'm', desc: 'Toggle Microphone' },
        { key: 'f', desc: 'Toggle Fullscreen' },
        { key: 'c', desc: 'Toggle Camera Motion' },
        { key: 'Space', desc: 'Play / Pause' },
        { key: '?', desc: 'Show Shortcuts' }
      ],
      isDesktop: !!window.electronAPI,
      monitors: [],
      selectedMonitorIndex: 0,
      visualizerOpen: false,
    };
  },
  computed: {
    template() { return this.$store.state.template; },
    soundFile() { return this.$store.state.file; },
    audioSource: {
      get() { return this.$store.state.audioSource; },
      set(val) { this.$store.dispatch("setAudioSource", val); }
    },
    config() { return this.$store.state; },
    emblem() { return this.$store.state.emblem; },
    storeTitle() { return this.$store.state.title; },
    storeSubtitle() { return this.$store.state.subtitle; },
    colorPresets() { return this.$store.state.presets; },
    storeColors() { return this.$store.state.colors; },
    storeLight() { return this.$store.state.light; },
    cameraMove: { get() { return this.$store.state.options.camera.move; }, set(val) { this.$store.dispatch("toggleCamera", val); } },
    microphone: { get() { return this.$store.state.microphone; }, set(val) { this.$store.dispatch("toggleMicrophone", val); } },
    livePro() { return this.$store.state.livePro; },
    trialStartedAt() { return this.$store.state.trialStartedAt; },
    highQuality: { get() { return this.$store.state.highQuality; }, set(val) { this.$store.dispatch("toggleHighQuality", val); } },
    removeWatermarkCheckbox: { 
      get() { return this.$store.state.removeWatermark; }, 
      set(val) { 
        if(this.paywallMode === 'export' && !this.isPro) { 
          this.showPaywall = true; 
        } else if(this.paywallMode === 'live' && !this.livePro) {
          this.showPaywall = true;
        } else {
          this.$store.dispatch("toggleRemoveWatermark", val);
        }
      } 
    },
    removeWatermark() { 
      if (this.appMode === 'studio') return this.isPro && this.$store.state.removeWatermark;
      return (this.livePro || this.isTrialActive) && this.$store.state.removeWatermark;
    },
    isTrialActive() {
      return this.trialStartedAt && (Date.now() - this.trialStartedAt < 7 * 24 * 60 * 60 * 1000);
    },
    activeEffects() { return this.$store.state.activeEffects; },
    sensitivity() { return this.$store.state.sensitivity; },
    sizes() { return this.$store.state.sizes; },
    logoStyle() { return this.$store.state.logoStyle; },
    selectedSize: {
      get() { return this.$store.state.selectedSize; },
      set(val) { this.$store.dispatch("setSize", val); }
    },
    fftSmoothing: {
      get() { return this.sensitivity.fftSmoothing; },
      set(val) { this.$store.dispatch("setSensitivity", { fftSmoothing: val }); }
    },
    bassBoost: {
      get() { return this.sensitivity.bassBoost; },
      set(val) { this.$store.dispatch("setSensitivity", { bassBoost: val }); }
    },
    isLoggedIn() { return !!this.$store.state.auth.token; },
    currentUserId() { return this.$store.state.auth.userId; },
    shoutoutUrl() {
      return `${window.location.origin}/shout?club=${this.currentUserId || 1}&utm_source=shoutout&utm_medium=qr&utm_campaign=audience_participation`;
    },
  },
  watch: {
    tiktokEnabled(val) {
      localStorage.setItem("noterender_tiktok_enabled", String(val));
      if (val) {
        if (this.playing && this.tiktokRtmpUrl && this.tiktokStreamKey) {
          this.reCreate();
          this.startVisualizer(false);
        }
      } else {
        if (Streaming.isActive) {
          Streaming.stop();
          this.streamState = "";
          this.streamMessage = "";
        }
      }
    },
    drawer(val) {
      if (!val) {
        this.resetMouseTimer();
      } else {
        this.isMouseMoving = true;
        if (this.mouseTimer) clearTimeout(this.mouseTimer);
      }
    },
    template: {
      handler(newVal, oldVal) {
        if (oldVal) {
          const prev = this.templates[oldVal];
          if (prev && prev.dispose) prev.dispose();
        }
        this.reCreate();
        this.sendVisualizerUpdate();
      },
      immediate: false
    },
    logoStyle() { this.reCreate(); },
    emblem() { this.reCreate(); },
    storeTitle(val) { TEXT.update(val, this.storeSubtitle, !this.removeWatermark); },
    storeSubtitle(val) { TEXT.update(this.storeTitle, val, !this.removeWatermark); },
    removeWatermark(val) { TEXT.update(this.storeTitle, this.storeSubtitle, !val); },
    activeEffects(val) { Effects.update(val); this.sendVisualizerUpdate(); },
    selectedSize() { this.resizeCanvas(); },
    "sensitivity.fftSmoothing"(val) {
      if (this.audio) {
        this.audio.setSmoothing(val);
      }
    },
    announcement: {
      handler(val) {
        if (val.visible && val.text) {
          TEXT.showAnnouncement(val.text, val.duration);
          this.$store.commit("setAnnouncement", { text: "", visible: false, duration: 5 });
        }
      },
      deep: true,
    },
    appMode(val) {
      if (val === 'live') {
        if (this.audioSource === 'file') {
          this.audioSource = 'system'; // Default to system audio in live mode
        }
      } else {
        // Return to file mode when entering studio to prevent accidental capture prompts
        if (this.audioSource === 'system') {
          this.audioSource = 'file';
        }
        // Reset tab if Render tab was selected and we switched away from studio
        if (this.activeTab === 6) this.activeTab = 0;
      }
    },
    storeColors: {
      handler(val) { this.accentColorHex = this.rgbToHex(val.r, val.g, val.b); },
      deep: true,
      immediate: true
    },
    storeLight: {
      handler(val) { this.lightColorHex = this.rgbToHex(val.r, val.g, val.b); },
      deep: true,
      immediate: true
    }
  },
  methods: {
    asset,
    updateTitle(val) { this.$store.dispatch("changeTitle", val); },
    updateSubtitle(val) { this.$store.dispatch("changeSubtitle", val); },
    soundSelected(file) { if (file) this.$store.dispatch("setSound", file); },
    emblemSelected(file) { if (file) this.$store.dispatch("setEmblem", file); },
    setSize(name) { this.selectedSize = name; },
    setLogoStyle(style) { this.$store.dispatch("setLogoStyle", style); },
    
    applyPreset(preset) {
      this.$store.dispatch("applyPreset", preset);
    },
    
    applySensitivityPreset(preset) {
      this.$store.dispatch("applySensitivityPreset", preset);
    },

    colorSelected(color) {
      const hex = color.hex || color;
      const rgb = this.hexToRgb(hex);
      if (rgb) { this.$store.dispatch("setColor", rgb); }
    },
    setLightColor(color) {
      const hex = color.hex || color;
      const rgb = this.hexToRgb(hex);
      if (rgb) { this.$store.dispatch("setLight", rgb); }
    },
    toggleEffect(name) {
      this.$store.commit("toggleEffect", name);
    },
    hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
    },
    rgbToHex(r, g, b) {
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    },

    toggleFullscreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    },

    async enumerateAudioDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(d => d.kind === 'audioinput');
        this.audioDevices = audioInputs.map(d => ({
          label: d.label || `Device (${d.deviceId.slice(0, 8)}...)`,
          deviceId: d.deviceId,
        }));
        if (!this.selectedDeviceId && this.audioDevices.length > 0) {
          this.selectedDeviceId = this.audioDevices[0].deviceId;
        }
      } catch (e) {
        console.warn("Could not enumerate devices:", e);
      }
    },

    async goLive() {
      this.paywallMode = 'live';

      if (this.isDesktop && this.monitors.length > 1) {
        await this.openVisualizer();
        return;
      }

      if (this.audioSource === 'system' && !this.dontShowLiveDialog) {
        this.showLiveDialog = true;
        return;
      }

      await this.startLiveCapture();
    },

    async startLiveCapture() {
      this.showLiveDialog = false;
      if (this.dontShowLiveDialog) {
        localStorage.setItem("noterender_dont_show_live_dialog", "true");
      }

      this.paywallMode = 'live';
      this.drawer = false;
      this.toggleFullscreen();

      if (!this.livePro && !this.isTrialActive) {
        this.$store.dispatch("toggleRemoveWatermark", false);
      }

      if (this.audioSource === 'system') {
        this.audioSource = 'system';
      }

      if (!this.playing) {
        this.stopVisualizer();
        setTimeout(() => {
          this.reCreate();
          this.startVisualizer(false);
        }, 500);
      } else {
        this.reCreate();
        this.startVisualizer(false);
      }
    },

    showAnnouncement() {
      if (!this.announcementInput) return;
      this.$store.commit("setAnnouncement", {
        text: this.announcementInput,
        visible: true,
        duration: this.announcementDuration || 5,
      });
      const saved = this.announcementInput;
      this.announcementInput = "";
    },

    async saveCurrentProject() {
      if (!this.isLoggedIn) return;
      try {
        const state = this.$store.state;
        const data = {
          template: state.template,
          colors: state.colors,
          light: state.light,
          dynamicColors: state.dynamicColors,
          title: state.title,
          subtitle: state.subtitle,
          logoStyle: state.logoStyle,
          selectedSize: state.selectedSize,
          sensitivity: state.sensitivity,
          activeEffects: state.activeEffects,
          options: state.options,
          templates: state.templates,
        };
        await this.$store.dispatch("saveProject", { name: "Club Setup", data });
      } catch (e) {
        console.warn("Save failed:", e);
      }
    },

    async loadProjects() {
      if (!this.isLoggedIn) return;
      try {
        const projects = await this.$store.dispatch("loadProjects");
        if (projects.length > 0) {
          const p = projects[0];
          const data = p.data;
          if (data.template) this.$store.commit("templateSelected", data.template);
          if (data.colors) this.$store.commit("setBarRGB", data.colors);
          if (data.light) this.$store.commit("setLightRGB", data.light);
          if (data.dynamicColors !== undefined) this.$store.commit("setDynamicColors", data.dynamicColors);
          if (data.title) this.$store.commit("changeTitle", data.title);
          if (data.subtitle) this.$store.commit("changeSubtitle", data.subtitle);
          if (data.logoStyle) this.$store.commit("setLogoStyle", data.logoStyle);
          if (data.selectedSize) this.$store.commit("setSize", data.selectedSize);
          if (data.sensitivity) this.$store.commit("setSensitivity", data.sensitivity);
          if (data.activeEffects) {
            this.$store.state.activeEffects.splice(0, this.$store.state.activeEffects.length, ...data.activeEffects);
          }
        }
      } catch (e) {
        console.warn("Load failed:", e);
      }
    },

    pollShoutouts() {
      if (!this.currentUserId) return;
      this.$store.dispatch("fetchApprovedShoutouts", {
        clubId: this.currentUserId,
        since: this.lastShoutoutFetch || undefined,
      }).then((shoutouts) => {
        if (shoutouts && shoutouts.length > 0) {
          TEXT.pushShoutouts(shoutouts);
          this.lastShoutoutFetch = shoutouts[shoutouts.length - 1].createdAt;
        }
      }).catch(() => {});
    },

    async loadPendingShoutouts() {
      if (!this.isLoggedIn) return;
      try {
        this.pendingShoutouts = await this.$store.dispatch("fetchPendingShoutouts");
      } catch (e) { /* ignore */ }
    },

    async approveShoutout(id) {
      const s = this.pendingShoutouts.find(s => s.id === id);
      await this.$store.dispatch("approveShoutout", { id, status: "approved" });
      this.pendingShoutouts = this.pendingShoutouts.filter(s => s.id !== id);
      if (s) TEXT.pushShoutouts([{
        name: s.name,
        message: s.message,
        createdAt: new Date().toISOString(),
      }]);
    },

    async rejectShoutout(id) {
      await this.$store.dispatch("approveShoutout", { id, status: "rejected" });
      this.pendingShoutouts = this.pendingShoutouts.filter(s => s.id !== id);
    },

    copyShoutoutUrl() {
      navigator.clipboard.writeText(this.shoutoutUrl).catch(() => {});
    },

    startLiveAfterTrial() {
      this.goLive();
    },

    togglePlayLocal() {
      const audioEl = document.getElementById("audio");
      if (audioEl && audioEl.muted) {
        audioEl.muted = false;
      }

      if (this.playing) {
        this.stopVisualizer();
      } else {
        this.reCreate();
        this.startVisualizer(false);
      }
    },

    handleKeyDown(e) {
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;

      const key = e.key.toLowerCase();
      
      // j/k - Tab Navigation
      if (key === 'j') {
        this.activeTab = (this.activeTab + 1) % 7;
      } else if (key === 'k') {
        this.activeTab = (this.activeTab - 1 + 7) % 7;
      }
      
      // h/l - Sidebar Toggle
      if (key === 'h' || key === 'l') {
        this.drawer = !this.drawer;
      }

      // [ / ] - Template Navigation
      if (key === '[' || key === ']') {
        const templates = this.$store.state.templates;
        const currentIndex = templates.findIndex(t => t.name === this.template);
        let nextIndex;
        if (key === '[') {
          nextIndex = (currentIndex - 1 + templates.length) % templates.length;
        } else {
          nextIndex = (currentIndex + 1) % templates.length;
        }
        this.$store.commit('templateSelected', templates[nextIndex].name);
      }

      // 1-7 - Direct Tab Jump
      if (key >= '1' && key <= '7') {
        this.activeTab = parseInt(key) - 1;
        if (!this.drawer) this.drawer = true;
      }

      // m - Microphone
      if (key === 'm') {
        this.microphone = !this.microphone;
      }

      if (key === 'f') {
        this.toggleFullscreen();
      }

      // c - Camera
      if (key === 'c') {
        this.cameraMove = !this.cameraMove;
      }

      // Space - Play/Pause
      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePlayLocal();
      }

      // ? - Help
      if (key === '?' || key === '/') {
        this.showHelp = !this.showHelp;
      }
    },

    resetMouseTimer() {
      this.isMouseMoving = true;
      if (this.mouseTimer) clearTimeout(this.mouseTimer);
      if (!this.drawer) {
        this.mouseTimer = setTimeout(() => {
          this.isMouseMoving = false;
        }, 3000);
      }
    },

    async loadMonitors() {
      if (!this.isDesktop) return;
      try {
        this.monitors = await window.electronAPI.getMonitors();
      } catch (e) {
        console.error("Failed to get monitors:", e);
      }
    },

    async openVisualizer() {
      if (!this.isDesktop) return;
      try {
        await window.electronAPI.spawnVisualizer({
          monitorId: this.monitors[this.selectedMonitorIndex]?.id,
          templateName: this.template,
          config: {
            ...this.config,
            activeEffects: this.$store.state.activeEffects,
            removeWatermark: this.$store.state.removeWatermark,
          },
        });
        this.visualizerOpen = true;
      } catch (e) {
        console.error("Failed to open visualizer:", e);
      }
    },

    async closeVisualizerWindow() {
      if (!this.isDesktop) return;
      try {
        await window.electronAPI.closeVisualizer();
        this.visualizerOpen = false;
      } catch (e) {
        console.error("Failed to close visualizer:", e);
      }
    },

    async sendVisualizerUpdate() {
      if (!this.isDesktop || !this.visualizerOpen) return;
      await this.openVisualizer();
    },

    handleMouseMove() {
      this.resetMouseTimer();
    },

    handleExport() {
      this.paywallMode = 'export';
      if (!this.isPro) {
        this.showPaywall = true;
        return;
      }

      if (this.isExporting) {
        this.stopVisualizer();
        return;
      }

      const audioEl = document.getElementById("audio");
      if (audioEl && audioEl.muted) {
        audioEl.muted = false;
      }

      if (!this.playing) {
        // Stop current preview, then start recording
        if (this.audio) {
          this.audio.stop(() => {
            this.reCreate(); // Rebuild scene from 0
            this.playing = true;
            this.isExporting = true;
            this.startVisualizer(true);
          });
        }
      } else {
        this.reCreate(); // Rebuild from stopped state
        this.isExporting = true;
        this.startVisualizer(true);
      }
    },

    reCreate() {
      this.isTransitioning = true;
      if (this.engine) {
        this.engine.stopRenderLoop();
      }
      
      if (this.scene) { 
        this.scene.dispose(); 
        this.scene = null; 
      }
      this.camera = null; 
      this.mountScene();
    },

    stopVisualizer() {
      this.playing = false;
      if (Streaming.isActive) {
        Streaming.stop();
        this.streamState = "";
        this.streamMessage = "";
      }
      if (this.audio) {
        this.audio.stop(() => {
          if (this.scene) this.scene.dispose();
          if (this.engine) this.engine.stopRenderLoop();
          if (this.isExporting) {
            Recording.stop();
            this.isExporting = false;
          }
        });
      }
    },

    saveTikTokSettings() {
      localStorage.setItem("noterender_tiktok_rtmp", this.tiktokRtmpUrl.trim());
      localStorage.setItem("noterender_tiktok_key", this.tiktokStreamKey.trim());
      localStorage.setItem("noterender_tiktok_relay", this.tiktokRelayUrl.trim());
    },

    handleStreamStatus(state, message) {
      this.streamState = state;
      this.streamMessage = message;
    },

    buildRtmpUrl() {
      if (!this.tiktokRtmpUrl || !this.tiktokStreamKey) return "";
      const serverUrl = this.tiktokRtmpUrl.trim().replace(/\/+$/, "");
      const key = this.tiktokStreamKey.trim();
      return `${serverUrl}/${key}`;
    },

    async startTikTokStream(bitrate) {
      if (!this.tiktokEnabled || !this.tiktokRtmpUrl || !this.tiktokStreamKey) return;
      const rtmpUrl = this.buildRtmpUrl();
      if (!rtmpUrl) return;
      try {
        const vstream = this.canvas.captureStream ? this.canvas.captureStream(30) : this.canvas.mozCaptureStream(30);
        await Streaming.start(vstream, this.audio.getStream(), {
          rtmpUrl,
          relayUrl: this.tiktokRelayUrl,
          bitrate,
          onStatus: this.handleStreamStatus,
        });
        this.streamState = "connecting";
      } catch (e) {
        console.warn("TikTok streaming failed to start:", e);
        this.streamState = "error";
        this.streamMessage = e.message || "Streaming failed — is the relay running?";
      }
    },

    startVisualizer(record = false) {
      this.playing = true;
      this.$store.dispatch("toggleRecording", record);
      setTimeout(async () => {
        // 8 Mbps (High) or 2.5 Mbps (Standard)
        const bitrate = this.highQuality ? 8000000 : 2500000;
        
        try {
          if (this.audioSource === "mic") {
            await this.audio.useMicrophone();
          } else if (this.audioSource === "system") {
            await this.audio.useSystemAudio();
          } else if (this.audioSource === "device" && this.selectedDeviceId) {
            await this.audio.useDevice(this.selectedDeviceId);
          } else {
            this.audio.nodes();
            await this.audio.play();
          }

          if (record) {
            const stream = this.canvas.captureStream ? this.canvas.captureStream(30) : this.canvas.mozCaptureStream(30);
            Recording.start(stream, this.audio.getStream(), bitrate);
          } else {
            await this.startTikTokStream(bitrate);
          }
        } catch (e) {
          console.warn("Visualizer start audio error:", e);
          this.playing = false;
        }
      }, 500);
    },

    resizeCanvas() {
      if (!this.engine || !this.canvas) return;

      // WebGPUEngine specific check: don't resize if it's not fully ready
      if (this.engine.isWebGPU && !this.engine.snapshotRendering) {
          // This is a heuristic, but often the engine is not ready for resize
          // if internal attachments haven't been initialized by the first render.
      }

      const container = this.canvas.parentElement;
      if (!container) return;
      
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      let targetWidth = containerWidth;
      let targetHeight = containerHeight;

      let sizeConfig = this.sizes.find(s => s.name === this.selectedSize);

      if (this.selectedSize === "Auto") {
        const currentAspect = containerWidth / containerHeight;
        let bestMatch = this.sizes[1]; // Use YouTube as default fallback
        let minDiff = Infinity;

        // Find closest aspect ratio among predefined sizes
        for (let i = 1; i < this.sizes.length; i++) {
          const s = this.sizes[i];
          const aspect = s.size.x / s.size.y;
          const diff = Math.abs(currentAspect - aspect);
          if (diff < minDiff) {
            minDiff = diff;
            bestMatch = s;
          }
        }
        sizeConfig = bestMatch;
      }

      if (sizeConfig && sizeConfig.size.x) {
        const aspect = sizeConfig.size.x / sizeConfig.size.y;
        if (containerWidth / containerHeight > aspect) {
          targetHeight = containerHeight;
          targetWidth = containerHeight * aspect;
        } else {
          targetWidth = containerWidth;
          targetHeight = containerWidth / aspect;
        }
      }

      this.canvas.style.width = `${targetWidth}px`;
      this.canvas.style.height = `${targetHeight}px`;
      
      // Scale text based on current dimensions
      TEXT.resize(targetWidth, targetHeight);
      
      try {
        this.engine.resize();
      } catch (e) {
        console.warn("Engine resize deferred:", e.message);
      }
    },

    async mountScene() {
      if (this.isMounting) return;
      this.isMounting = true;
      
      try {
        if (!this.audio) this.audio = new audio(512);
        this.canvas = this.$refs.renderCanvas;
        this.emptyFft = new Uint8Array(512).fill(0);

        if (!this.engine) {
            try {
                const supported = await BABYLON.WebGPUEngine.IsSupportedAsync;
                if (supported) {
                    const engine = new BABYLON.WebGPUEngine(this.canvas, { antialias: true });
                    await engine.initAsync();
                    this.engine = engine;
                    await this.setupEngine();
                } else {
                    this.setupWebGL();
                }
            } catch (e) {
                console.warn("WebGPU initialization failed, falling back to WebGL:", e);
                this.setupWebGL();
            }
        } else {
          await this.setupEngine();
        }
      } catch (e) {
        console.error("Mount scene failed:", e);
        this.isMounting = false;
        const loader = document.getElementById("globalLoader");
        if (loader) loader.style.display = "none";
      }
    },

    setupWebGL() {
      this.engine = new BABYLON.Engine(this.canvas, true, { 
        preserveDrawingBuffer: true, 
        stencil: true, 
        antialias: true,
        adaptToDeviceRatio: false
      });
      this.setupEngine();
    },

    async setupEngine() {
      console.log("Setting up engine...");
      const devicePixelRatio = window.devicePixelRatio || 1;
      this.engine.setHardwareScalingLevel(1 / devicePixelRatio);
      
      // Ensure canvas is correctly sized before first render/resize
      this.resizeCanvas();
      
      window.addEventListener("resize", () => { this.resizeCanvas(); });
      
      try {
        console.log("Creating scene...");
        await this.createScene();
        console.log("Initializing template:", this.template);
        this.initTemplate(this.scene, this.config);
        
        this.activeTemplateName = this.template;
        this.isTransitioning = false;
        
        console.log("Starting render loop...");
        this.engine.runRenderLoop(() => this.babylonRender());
      } catch (e) {
        console.error("Engine setup failed:", e);
        this.isTransitioning = false;
      }
      
      this.isMounting = false;
      const loader = document.getElementById("globalLoader");
      if (loader) loader.style.display = "none";
    },

    async createScene() {
      this.scene = new BABYLON.Scene(this.engine);
      this.scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
      new BABYLON.PointLight("Omni", new BABYLON.Vector3(0, 0, 100), this.scene);
      this.scene.createDefaultLight();
      
      const width = this.canvas ? this.canvas.width : 1080;
      const height = this.canvas ? this.canvas.height : 1080;
      
      console.log("Initializing UI Text...");
      try {
          await TEXT.init(this.scene, this.config.title || "noterender", this.config.subtitle || "visualizer", width, height);
          TEXT.update(this.config.title || "noterender", this.config.subtitle || "visualizer", !this.removeWatermark);
      } catch (e) { 
          console.error("TEXT init failed:", e); 
      }

      console.log("Initializing Effects...");
      Effects.init(this.scene);

      this.scene.registerBeforeRender(() => { 
          this.alpha += this.multiplierValue; 
      });
    },

    initTemplate(scene, config) {
      if (this.camera) {
        this.camera.dispose();
      }
      this.camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 4, 320, BABYLON.Vector3.Zero(), scene);
      this.camera.attachControl(this.canvas, true);
      
      // Initialize Camera Physics Component BEFORE template so template can override it or lock it
      CAMERA.init(this.camera, config);

      const t = this.templates[this.template];
      if (t) {
        const width = this.canvas ? this.canvas.width : 1080;
        const height = this.canvas ? this.canvas.height : 1080;
        try {
          t.init(this.camera, this.engine, 10, scene, width, height, 1080, config);
        } catch (e) { 
          console.error("Template init failed:", e);
        }
      }

      Effects.update(this.$store.state.activeEffects);
    },

    babylonRender() {
      if (this.isTransitioning || !this.scene || !this.scene.activeCamera || !this.camera) return;
      
      this.scene.render();
      
      // Get FFT or fallback to pre-allocated empty array
      let fft = this.audio ? this.audio.getFtt() : this.emptyFft;
      if (!fft) fft = this.emptyFft;
      
      TEXT.render();
      CAMERA.render(fft);

      // Performance Optimization: Cache active template and config
      if (!this._cachedTemplate || this._cachedTemplateName !== this.activeTemplateName) {
        this._cachedTemplate = this.templates[this.activeTemplateName];
        this._cachedTemplateName = this.activeTemplateName;
        const tData = this.config.templates.find(t => t.name === this.activeTemplateName);
        this._cachedConfig = tData ? tData.currentConfig : {};
      }

      if (this._cachedTemplate) {
        this._cachedTemplate.render(fft, this.config);
      }
      Effects.render(fft, this.config);
    }
  },
  mounted() {
    // Check Trial from LocalStorage
    const trialStart = localStorage.getItem('noterender_trial_start');
    if (trialStart) {
      const start = parseInt(trialStart);
      this.$store.commit('setTrial', start);
      // Check if expired
      if (Date.now() - start < 7 * 24 * 60 * 60 * 1000) {
        this.$store.commit('setLivePro', true);
      } else {
        this.$store.commit('setLivePro', false);
      }
    }

    // Check Pro Status from URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      this.isPro = true;
      this.$store.dispatch("toggleRemoveWatermark", true);
      // Optional: Clear URL params to clean up
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    this.mountScene();
    this.title = this.$store.state.title;
    this.subtitle = this.$store.state.subtitle;

    // Load user projects and set up QR
    if (this.isLoggedIn) {
      this.loadProjects();
    }

    // Enumerate audio devices (for device selector)
    this.enumerateAudioDevices();
    navigator.mediaDevices?.addEventListener("devicechange", () => this.enumerateAudioDevices());

    // Set QR URL for shoutouts
    const shoutoutUrl = `${window.location.origin}/shout?club=${this.currentUserId || 1}&utm_source=shoutout&utm_medium=qr&utm_campaign=audience_participation`;
    TEXT.setQrUrl(shoutoutUrl);

    // Start shoutout polling
    this.shoutoutTimer = setInterval(() => this.pollShoutouts(), 5000);

    // Poll pending shoutouts for moderation
    this.loadPendingShoutouts();
    this.pendingShoutoutTimer = setInterval(() => this.loadPendingShoutouts(), 5000);

    // Auto-save every 2 minutes
    this.autoSaveTimer = setInterval(() => {
      if (this.isLoggedIn) this.saveCurrentProject();
    }, 120000);

    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("mousemove", this.handleMouseMove);
    window.addEventListener("touchstart", this.handleMouseMove);

    const audioEl = document.getElementById("audio");
    if (audioEl) {
      audioEl.muted = true;
    }

    if (this.isDesktop) {
      this.loadMonitors();
    }
  },

  beforeDestroy() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("mousemove", this.handleMouseMove);
    window.removeEventListener("touchstart", this.handleMouseMove);
    if (this.mouseTimer) clearTimeout(this.mouseTimer);
    if (this.shoutoutTimer) clearInterval(this.shoutoutTimer);
    if (this.pendingShoutoutTimer) clearInterval(this.pendingShoutoutTimer);
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
  }
};
</script>

<style scoped>
.logo-wrapper {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.studio-app {
  background-color: #000 !important;
  overflow: hidden !important;
}

.studio-app.hide-cursor {
  cursor: none !important;
}

.mode-toggle {
  background-color: rgba(255, 255, 255, 0.03) !important;
}

.mode-toggle .v-btn {
  border: none !important;
  text-transform: none !important;
  letter-spacing: 1px !important;
  font-weight: 600 !important;
}

.pulse-red {
  animation: pulse-red-animation 2s infinite;
}

.status-dot {
  width: 8px;
  height: 8px;
  background-color: #4CAF50;
  border-radius: 50%;
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
  animation: status-pulse 2s infinite;
}

@keyframes status-pulse {
  0% { opacity: 1; }
  50% { opacity: 0.4; }
  100% { opacity: 1; }
}

@keyframes pulse-red-animation {
  0% { box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(255, 82, 82, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 82, 82, 0); }
}

/* Hide scrollbars globally for studio elements */
.no-scrollbar,
.no-scrollbar >>> .v-navigation-drawer__content,
.no-scrollbar >>> .v-window__container,
.no-scrollbar >>> .v-tabs-items {
  -ms-overflow-style: none !important;
  scrollbar-width: none !important;
}

.no-scrollbar::-webkit-scrollbar,
.no-scrollbar >>> .v-navigation-drawer__content::-webkit-scrollbar,
.no-scrollbar >>> .v-window__container::-webkit-scrollbar,
.no-scrollbar >>> .v-tabs-items::-webkit-scrollbar {
  display: none !important;
}

.visualizer-container {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #050505;
}

#renderCanvas {
  outline: none;
  box-shadow: 0 0 100px rgba(0,0,0,0.5);
}

.studio-sidebar {
  z-index: 100;
  height: 100vh !important;
}

.studio-tabs {
  display: flex;
  flex-direction: row;
}

.tabs-scroll-area {
  width: 95px;
  overflow-y: auto;
  border-right: 1px solid rgba(255,255,255,0.05);
}

.studio-tab-content {
  width: calc(100% - 95px);
  overflow-y: auto;
}

.transparent-bg {
  background-color: transparent !important;
}

.letter-spacing-2 { letter-spacing: 2px; }
.opacity-10 { opacity: 0.1; }
.border-thin { border: 1px solid rgba(255,255,255,0.1) !important; }

.transport-container {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
  pointer-events: none;
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.8s ease;
}

.transport-container.ui-hidden {
  transform: translate(-50%, 120px);
  opacity: 0;
}

.sidebar-toggle.ui-hidden {
  transform: translateX(-120px);
  opacity: 0;
}

.sidebar-toggle {
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.8s ease;
}

.v-btn--fixed.v-btn--top.right.ui-hidden {
  transform: translateX(120px);
  opacity: 0;
}

.v-btn--fixed.v-btn--top.right {
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.8s ease;
}

.transport-bar {
  pointer-events: auto;
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255,255,255,0.1) !important;
}

.studio-tabs >>> .v-tabs-bar {
  height: auto !important;
  background-color: transparent !important;
}

.studio-tabs >>> .v-tab {
  min-width: unset !important;
  padding: 0 4px !important;
  font-weight: 700;
  font-size: 0.7rem;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  height: 90px !important;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.tab-text {
  margin-top: 8px;
  margin-left: 0 !important;
}

.studio-tabs >>> .v-tab--active {
  background: rgba(0, 229, 255, 0.08);
}

.custom-scrollbar::-webkit-scrollbar { width: 3px; height: 3px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }

.recording-active {
  animation: rec-pulse 1.5s infinite;
  color: #ff5252 !important;
}

@keyframes rec-pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 rgba(0, 229, 255, 0.5); }
  70% { box-shadow: 0 0 0 18px rgba(0, 229, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 229, 255, 0); }
}

.play-btn-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-btn-wrapper.pulse-ring::after {
  content: '';
  position: absolute;
  top: -4px;
  left: -4px;
  width: calc(100% + 8px);
  height: calc(100% + 8px);
  border-radius: 50%;
  border: 2px solid rgba(0, 229, 255, 0.6);
  animation: pulse-ring 1.5s ease-in-out infinite;
  pointer-events: none;
}

.truncate-text {
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.preset-chip {
  cursor: pointer;
  transition: all 0.2s ease;
}
.preset-chip:hover {
  background: rgba(255,255,255,0.05) !important;
}
.preset-preview {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

@media (max-width: 600px) {
  .transport-container {
    bottom: 16px;
    width: 92%;
  }
  .transport-bar {
    width: 100%;
    justify-content: center;
    height: 52px !important;
    padding-left: 8px !important;
    padding-right: 8px !important;
  }
  .transport-bar >>> .v-btn--icon {
    width: 40px;
    height: 40px;
  }
  .transport-bar >>> .v-icon {
    font-size: 28px !important;
  }
  .transport-bar >>> .v-btn-toggle {
    margin-left: 4px !important;
  }
  .transport-bar >>> .v-btn-toggle .v-btn {
    font-size: 0.7rem;
    padding-left: 8px !important;
    padding-right: 8px !important;
    height: 32px !important;
  }
  .transport-bar > .v-btn:not(.v-btn--icon) {
    height: 34px !important;
    font-size: 0.7rem;
    padding-left: 10px !important;
    padding-right: 10px !important;
    margin-left: 4px !important;
  }
  .transport-bar > .v-btn:not(.v-btn--icon) .v-icon {
    font-size: 16px !important;
  }
  .transport-bar > .v-divider {
    margin-left: 8px !important;
    margin-right: 8px !important;
  }
  .tabs-scroll-area {
    width: 60px;
  }
  .studio-tab-content {
    width: calc(100% - 60px);
  }
  .tab-text {
    display: none;
  }
  .studio-tabs >>> .v-tab {
    padding: 0 !important;
    height: 72px !important;
    min-width: unset !important;
  }
  .studio-tabs >>> .v-tab .v-icon {
    font-size: 20px !important;
  }

  /* Sidebar drawer full-width on mobile */
  .studio-sidebar {
    width: 100% !important;
    max-width: 100vw !important;
  }
  .studio-sidebar .pa-8 {
    padding: 16px !important;
  }
  .studio-sidebar .logo-wrapper {
    padding: 8px !important;
  }
  .studio-sidebar .logo-wrapper img {
    width: 48px !important;
  }
  .studio-sidebar .pa-6 {
    padding: 12px !important;
  }
  .studio-sidebar .px-6 {
    padding-left: 12px !important;
    padding-right: 12px !important;
  }
  .studio-sidebar .pa-4 {
    padding: 8px !important;
  }
  .studio-sidebar .mx-8 {
    margin-left: 16px !important;
    margin-right: 16px !important;
  }

  /* Sidebar toggle button smaller on mobile */
  .sidebar-toggle {
    width: 40px !important;
    height: 40px !important;
    margin-top: 8px !important;
    margin-left: 8px !important;
  }
  .sidebar-toggle .v-icon {
    font-size: 20px !important;
  }

  /* Help button smaller on mobile */
  .v-btn--fixed.v-btn--top.right {
    margin-top: 8px !important;
    margin-right: 8px !important;
  }

  .preset-chip {
    font-size: 0.7rem;
    height: 28px !important;
  }
  .text-overline {
    font-size: 0.6rem !important;
  }
}
</style>

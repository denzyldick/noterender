const path = require('path');

// GitHub Pages serves the repo under /noterender/; the Docker image serves /
const isGhPages = process.env.DEPLOY_TARGET === 'gh-pages';
const publicPath = isGhPages ? '/noterender/' : '/';
const iconPath = (p) => publicPath + p;

module.exports = {
  lintOnSave: false,
  publicPath,
  transpileDependencies: [
    'vuetify'
  ],
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      }
    },
    devtool: process.env.NODE_ENV === 'production' ? false : 'eval-cheap-module-source-map',
    performance: {
      hints: false
    }
  },
  devServer: {
    proxy: {
      '/api': {
        target: process.env.API_PROXY_TARGET || 'https://localhost:8443',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  chainWebpack: config => {
    if (process.env.NODE_ENV === 'production') {
      // Production optimizations
      config.optimization.splitChunks({
        chunks: 'all'
      });
    }
  },
  pwa: {
    name: 'Noterender',
    themeColor: '#00E5FF',
    msTileColor: '#000000',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',
    manifestPath: 'manifest.json',
    iconPaths: {
      faviconSVG: 'favicon.svg',
      favicon32: 'favicon-32x32.png',
      favicon16: 'favicon-16x16.png',
      appleTouchIcon: 'apple-touch-icon.png',
      maskIcon: 'favicon.svg',
      msTileImage: null,
    },
    manifestOptions: {
      name: 'Noterender',
      short_name: 'Noterender',
      start_url: publicPath,
      display: 'standalone',
      background_color: '#000000',
      theme_color: '#00E5FF',
      icons: [
        { src: iconPath('android-chrome-192x192.png'), sizes: '192x192', type: 'image/png' },
        { src: iconPath('android-chrome-512x512.png'), sizes: '512x512', type: 'image/png' },
      ],
    },
    workboxOptions: {
      skipWaiting: true,
      clientsClaim: true
    }
  }
}

const path = require('path');

module.exports = {
  lintOnSave: false,
  publicPath: process.env.NODE_ENV === 'production' ? '/noterender/' : '/',
  transpileDependencies: [
    'vuetify'
  ],
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      }
    },
    performance: {
      hints: false
    }
  },
  devServer: {
    proxy: {
      '/api': {
        target: 'http://api:8080',
        changeOrigin: true,
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
    workboxOptions: {
      skipWaiting: true,
      clientsClaim: true
    }
  }
}

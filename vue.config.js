const path = require('path');

module.exports = {
  lintOnSave: false,
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
  chainWebpack: config => {
    config.plugin('define').tap(args => {
      args[0]['process.env.BASE_URL'] = JSON.stringify('/');
      return args;
    });

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
      skipWaiting: true
    }
  }
}

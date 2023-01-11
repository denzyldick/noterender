const {VueLoaderPlugin} = require('vue-loader')
const path = require('path');
module.exports = {
    output: {
        publicPath: path.join(__dirname, 'public'),
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist'),
        },
        compress: true,
        port: 8080,
    },
    entry: {
        main: './src/main.ts',
    },
    mode: 'development',
    module: {

        rules: [
            {
                test: /\.html/,
                loader: 'file-loader?name=[name].[ext]',
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader'
            },
            // this will apply to both plain `.js` files
            // AND `<script>` blocks in `.vue` files
            {
                test: /\.js$/,
                loader: 'babel-loader'
            },
            // this will apply to both plain `.css` files
            // AND `<style>` blocks in `.vue` files
            {
                test: /\.css$/,
                use: [
                    'vue-style-loader',
                    'css-loader'
                ]
            }
        ],
    },
    plugins: [
        // make sure to include the plugin!
        new VueLoaderPlugin()
    ]
}
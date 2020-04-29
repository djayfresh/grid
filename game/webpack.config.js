const path = require('path');

module.exports = [{
    name: 'dev',
    entry: "./build/runner.js",
    output: {
        filename: "./runner.js",
    },
    devtool: "source-map",
    resolve: {
        extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"],
        alias: {
            "models/*": path.resolve(__dirname, '../../models/')
        }
    },
    module: {
        rules: [
            {
                enforce: 'pre',
                test: /\.js$/,
                loader: 'source-map-loader',
                exclude: /(node_modules)/,
            },
            {
                test: /\.tsx?$/,
                loaders: ['awesome-typescript-loader'],
                exclude: /(node_modules)/
            }
        ]
    }
}, {
    name: 'deploy',
    entry: "./build/main.js",
    output: {
        filename: "./launcher.js",
        library: 'Grid'
    },
    resolve: {
        extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loaders: ['awesome-typescript-loader'],
                exclude: /(node_modules)/
            }
        ]
    }
}];
module.exports = {
    entry: "./build/main.js",
    output: {
        filename: "./launcher.js",
    },

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
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
    },

    // Other options...
};
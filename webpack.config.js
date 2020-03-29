module.exports = {
    entry: "./scripts/main.ts",
    output: {
        filename: "./dist/launcher.js",
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
                test: /\.tsx?$/,
                loader: 'tslint',
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
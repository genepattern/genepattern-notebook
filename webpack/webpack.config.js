const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: ['./src/js/index.js', './src/js/gp.js'],
    output: {
        path: path.resolve(__dirname, 'genepattern/static/resources'),
        filename: 'genepattern.bundle.js',
        libraryTarget: "amd"
    },
    externals: {
        "jquery": {amd: "jquery", root: "$"},
        "jqueryui": {amd: "jqueryui", root: "$"},
        "nbtools": {amd: "nbtools", root: "NBToolManager"},
        "base/js/namespace": {amd: "base/js/namespace", root: "Jupyter"},
        "nbextensions/jupyter-js-widgets/extension": {amd: "nbextensions/jupyter-js-widgets/extension", root: "widgets"},
        "base/js/dialog": {amd: "base/js/dialog", root: "dialog"},
        "genepattern": {root: "GenePattern"},
        "genepattern/navigation": {root: "GPNotebook"},
        "genepattern/authentication": {root: "auth"}
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    {
                        loader: 'css-loader',
                        options: {
                            sourceMap: true
                        }
                    }]
            },
            {
                test: /\.(png|svg|jpg|gif|js)$/,
                use: [{
                    loader: 'file-loader',
                    options: {
                        name: '[name].[ext]'
                    }
                }]
            }
        ]
    }
};

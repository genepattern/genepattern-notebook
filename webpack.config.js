const path = require('path');

module.exports = {
    entry: './src/js/index.js',
    output: {
        path: path.resolve(__dirname, 'genepattern/static/resources'),
        filename: 'genepattern.bundle.js'
    },
    externals: {
        "jquery": "$",
        "jqueryui": "$"
    },
    module: {
        rules: [
            {test: /\.css$/, use: 'css-loader'},
            {test: /\.ts$/, use: 'ts-loader'}
        ]
    }
};

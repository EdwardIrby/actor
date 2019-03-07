process.env.CHROME_BIN = require('puppeteer').executablePath();
const resolve = require('rollup-plugin-node-resolve');

module.exports = config => {
  config.set({
    singleRun: true,
    browsers: ['ChromeHeadless'],
    frameworks: ['mocha', 'chai'],
    reporters: ['mocha'],
    files: [
      { pattern: 'src/**/*.spec.js', watched: false },
    ],
    client: {
      mocha: {
        ui: 'tdd',
      },
    },
    preprocessors: {
      'src/**/*.spec.js': ['rollup'],
    },
    rollupPreprocessor: {
      plugins: [
        resolve(),
      ],
      output: {
        format: 'esm',
        sourcemap: 'inline',
      },
    },
  });
};

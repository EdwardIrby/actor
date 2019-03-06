module.exports = config => {
  config.set({
    frameworks: ['mocha'],
    files: [
      { pattern: 'src/**/*.spec.js', watched: false },
    ],
    preprocessors: {
      'src/**/*.spec.js': ['rollup'],
    },
    rollupPreprocessor: {
      plugins: [
        resolve(),
        common(),
      ],
      output: {
        format: 'esm',
        sourcemap: 'inline',
      },
    },
  });
};

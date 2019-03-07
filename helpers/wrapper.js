const path = require('path');

const pattern = file => ({
  pattern: file,
  included: true,
  served: true,
  watched: false,
});

const framework = files => {
  files.unshift(pattern(path.join(__dirname, 'adapter.js')));
  files.unshift(pattern(path.resolve(require.resolve('riteway'), '../riteway.js')));
};

framework.$inject = ['config.files'];
module.exports = { 'framework:riteway': ['factory', framework] };

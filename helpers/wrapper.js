const path = require('path');

const pattern = file => ({
  pattern: file,
  included: true,
  served: true,
  watched: false,
});

const framework = files => {
  files.unshift(pattern(path.join(__dirname, 'adapter.js')));
  files.unshift(pattern(path.join(__dirname, './rite.js')));
};

framework.$inject = ['config.files'];
module.exports = { 'framework:chai-rite': ['factory', framework] };

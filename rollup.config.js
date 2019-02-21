import path from 'path';

export default {
  input: path.resolve(__dirname, './src/actor.js'),
  plugins: [
  ],
  external: ['@dxworks/utils'],
  output: {
    format: 'cjs',
    file: path.resolve(__dirname, './dist/actor.js'),
  },
};

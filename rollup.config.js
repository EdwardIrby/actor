import path from 'path';
import cleanup from 'rollup-plugin-cleanup';

export default {
  input: path.resolve(__dirname, './src/actor.js'),
  plugins: [
    cleanup(),
  ],
  external: ['@dxworks/utils'],
  output: {
    format: 'cjs',
    file: path.resolve(__dirname, './dist/actor.js'),
  },
};

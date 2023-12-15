import * as path from 'path';
import { Configuration, BannerPlugin } from 'webpack';
import * as TerserPlugin from 'terser-webpack-plugin';

const config: Configuration = {
  mode: 'production',
  entry: {
    timetable2lua: './src/bootstrap.ts',
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
      },
    ],
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: true,
          format: {
            beautify: true,
            comments: /UserScript|^ @\w/,
            indent_level: 2,
          },
          mangle: false,
        },
        extractComments: false,
      }),
    ],
  },
  plugins: [
    new BannerPlugin({
      raw: true,
      banner: `// ==UserScript==
// @name         timetable2lua
// @namespace    https://dvxg.de/
// @version      ${require('./package.json').version}
// @description  导出轨道交通时刻表数据为Lua对象
// @author       davidxuang
// @match        https://www.cqmetro.cn/smbsj.html
// @homepageURL  https://github.com/davidxuang/timetable2lua
// @icon         https://upload.wikimedia.org/wikipedia/commons/5/5f/BSicon_SUBWAY-CHN.svg
// @license      AGPL-3.0
// @grant        GM_setClipboard
// ==/UserScript==\
`,
    }),
  ],
};

export default config;

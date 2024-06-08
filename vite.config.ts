import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  build: {
    target: 'es2020',
  },
  plugins: [
    monkey({
      entry: 'src/main.ts',
      build: {
        metaFileName: true,
      },
      userscript: {
        icon: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji/assets/Metro/3D/metro_3d.png',
        namespace: 'https://dvxg.de/',
        match: 'https://www.cqmetro.cn/smbsj.html',
        updateURL:
          'https://github.com/davidxuang/timetable2lua/releases/latest/download/timetable2lua.meta.js',
        downloadURL:
          'https://github.com/davidxuang/timetable2lua/releases/latest/download/timetable2lua.user.js',
      },
    }),
  ],
});

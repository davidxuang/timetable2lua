import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  build: {
    target: 'es2020',
  },
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        icon: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji/assets/Metro/3D/metro_3d.png',
        namespace: 'https://dvxg.de/',
        match: 'https://www.cqmetro.cn/smbsj.html',
      },
    }),
  ],
});

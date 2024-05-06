import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  plugins: [
    (() => {
      const reExt = /\.(?:js|cjs|mjs)$/;
      const reBlk = /^[ \t]*\/\*(.*\n)*?[ \t]*\*\/[ \t]*\n/gm;
      return {
        name: 'strip-block-comments',
        transform(code, id, _options) {
          return {
            code: id.match(reExt) ? code.replace(reBlk, '') : code,
          };
        },
      };
    })(),
    monkey({
      entry: 'src/main.ts',
      userscript: {
        icon: 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji/assets/Metro/3D/metro_3d.png',
        namespace: 'https://dvxg.de/',
        match: "https://www.cqmetro.cn/smbsj.html",
      },
    }),
    {
      name: '',
      enforce: 'post',
      generateBundle(_options, bundle, _isWrite) {
        Object.entries(bundle).forEach(([f, file]) => {
          if (
            typeof file['code'] === 'string' &&
            file.fileName.endsWith('.user.js')
          ) {
            console.debug(file['code'].length);
            file['code'] = file['code'].replace('__import__', 'import');
            console.debug(file['code'].length);
          }
        });
      },
    },
  ],
});

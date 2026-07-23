// Makes `bun test` able to run Solid components:
//   1. happy-dom → a real DOM in the test process
//   2. babel-preset-solid → Solid's compile-time JSX transform (Bun's built-in JSX is not enough)
import { transformAsync } from '@babel/core';
import presetTypeScript from '@babel/preset-typescript';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
import presetSolid from 'babel-preset-solid';
import { plugin } from 'bun';

GlobalRegistrator.register();

plugin({
  name: 'solid-jsx',
  setup(build) {
    build.onLoad({ filter: /\.tsx$/ }, async (args) => {
      const source = await Bun.file(args.path).text();
      const result = await transformAsync(source, {
        filename: args.path,
        babelrc: false,
        configFile: false,
        presets: [
          [presetSolid, { generate: 'dom', hydratable: false }],
          [presetTypeScript, { isTSX: true, allExtensions: true }],
        ],
      });

      return { contents: result?.code ?? source, loader: 'js' };
    });
  },
});

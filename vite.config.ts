import { readFileSync } from 'node:fs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { load } from 'js-yaml';
import { defineConfig, type Plugin } from 'vite';

// Content is authored as YAML (docs/02-content-bible.md writes every schema and example
// in it) and compiled to JS objects at bundle time, so there is no generated-JSON
// artifact to keep in sync. `enforce: 'pre'` claims .yaml before Vite's asset plugin
// turns it into a URL string.
function yamlContent(): Plugin {
  return {
    name: 'servus-yaml-content',
    enforce: 'pre',
    load(id) {
      const [path] = id.split('?');
      if (!path || !/\.ya?ml$/.test(path)) return null;
      return `export default ${JSON.stringify(load(readFileSync(path, 'utf8')))};`;
    },
  };
}

export default defineConfig({
  plugins: [yamlContent(), react(), tailwindcss()],
  server: {
    ...(process.env.PORT ? { port: Number(process.env.PORT) } : {}),
  },
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
// 直接使用 require 导入插件，避免 ESM 导入问题

import monacoEditorPlugin from "vite-plugin-monaco-editor";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    monacoEditorPlugin.default({ 
      languageWorkers: ['editorWorkerService', 'html'],
      publicPath: 'monaco-editor/min',
      customDistPath: (root: string) => `${root}/public/monaco-editor/min`,
    })
  ],
  resolve: {
    alias: [{ find: "@", replacement: "/src" }],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});

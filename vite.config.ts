import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

// Serve ONNX Runtime .mjs modules from node_modules in dev mode.
// Vite blocks dynamic import() of ES modules from /public/, so we
// intercept /wasm/*.mjs requests and serve the real files from the
// onnxruntime-web dist directory.
function onnxWasmServer() {
  const onnxDist = path.resolve('node_modules/onnxruntime-web/dist')
  return {
    name: 'onnx-wasm-server',
    configureServer(server: any) {
      server.middlewares.use('/wasm', (req: any, res: any, next: any) => {
        const url = new URL(req.url, 'http://localhost')
        const name = url.pathname.replace(/^\/+/, '')
        if (!name.endsWith('.mjs') && !name.endsWith('.wasm')) return next()
        const filepath = path.join(onnxDist, name)
        if (!fs.existsSync(filepath)) return next()
        res.setHeader('Content-Type', name.endsWith('.mjs') ? 'text/javascript' : 'application/wasm')
        res.end(fs.readFileSync(filepath))
      })
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    onnxWasmServer(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    clearScreen: false,
  },
  build: {
    target: 'esnext',
  },
  worker: {
    format: 'es',
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})

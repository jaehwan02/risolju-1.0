<img width="1672" height="941" alt="image" src="https://github.com/user-attachments/assets/09d69802-1720-48a0-81f7-7616c2caa981" />

# 리설주 1.0

Browser UI for running the RiSolJu 1.0 MLC/WebLLM model.

- Base model: [jaehwan02/risolju-1.0](https://huggingface.co/jaehwan02/risolju-1.0)
- MLC/WebLLM model: [jaehwan02/risolju-1.0-1.7b-mlc](https://huggingface.co/jaehwan02/risolju-1.0-1.7b-mlc)

## Run

```bash
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

Chrome with WebGPU support is required.

## Model Source

By default, the app loads the bundled local model files from:

```text
public/mlc/risolju-1.0-mobile-qwen3-1.7b/
```

For deployment, point the app at a Hugging Face repo that already contains the MLC model files.
The model URL must be the directory that contains `mlc-chat-config.json`, `tensor-cache.json`,
tokenizer files, and `params_shard_*.bin`.

Production builds already default to:

```text
https://huggingface.co/jaehwan02/risolju-1.0-1.7b-mlc
```

The setting lives in `.env.production`. It loads model weights from Hugging Face and keeps the
small local WebGPU wasm library in the deployed app.

Use one of these options in your deployment environment only when you need to override it.

### Direct URLs

```bash
VITE_MLC_MODEL_ID=RiSolJu-1.0-Mobile-Qwen3-1.7B-q4f16_1-MLC
VITE_MLC_MODEL_URL=https://huggingface.co/<user>/<repo>/resolve/main/
VITE_MLC_MODEL_LIB_URL=https://huggingface.co/<user>/<repo>/resolve/main/RiSolJu-1.0-Mobile-Qwen3-1.7B-q4f16_1-ctx2k-webgpu.wasm
```

If the model files are inside a subdirectory, include that directory in `VITE_MLC_MODEL_URL`:

```bash
VITE_MLC_MODEL_URL=https://huggingface.co/<user>/<repo>/resolve/main/<model-dir>/
```

### Hugging Face Short Form

```bash
VITE_HF_MODEL_REPO=jaehwan02/risolju-1.0-1.7b-mlc
VITE_HF_MODEL_REVISION=main
VITE_HF_MODEL_DIR=
# Optional: set only if the wasm library is also hosted in the Hugging Face repo.
# VITE_HF_MODEL_LIB_FILE=RiSolJu-1.0-Mobile-Qwen3-1.7B-q4f16_1-ctx2k-webgpu.wasm
```

Set `VITE_HF_MODEL_DIR` only when the MLC model files are in a subdirectory.

## Build

```bash
npm run build
```

For deployment, use:

```bash
npm run build:deploy
```

This runs the production build and removes the copied local model weights from `dist/mlc/.../resolve`,
so the static artifact does not include the multi-GB model. The app will still fetch weights from
Hugging Face at runtime.

## GitHub Pages

This repo includes `.github/workflows/deploy-pages.yml`. Pushing to `main` builds the app with:

```text
VITE_BASE_PATH=/risolju-1.0/
```

The workflow uploads `dist` to GitHub Pages. It also registers a small service worker that adds
cross-origin isolation headers after the first production load, which WebLLM needs for browser-side
model execution on static hosting.

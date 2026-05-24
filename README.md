<img width="1672" height="941" alt="image" src="https://github.com/user-attachments/assets/09d69802-1720-48a0-81f7-7616c2caa981" />

# 리설주 1.0

리설주 1.0 MLC/WebLLM 모델을 브라우저에서 실행하는 대화 UI입니다.

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

The app uses a single model source:

```text
https://huggingface.co/jaehwan02/risolju-1.0-1.7b-mlc
```

No production `.env` file is required. Model weights are loaded from the Hugging Face repo above.
The deployed app only keeps the WebGPU library at:

```text
public/mlc/risolju-1.0-1.7b-mlc/risolju-1.0-1.7b-mlc-webgpu.wasm
```

## Build

```bash
npm run build
```

For deployment, use:

```bash
npm run build:deploy
```

This runs the production build and removes non-deploy model artifacts from `dist/mlc`, so the static
artifact stays small while the app fetches model weights from Hugging Face at runtime.

## GitHub Pages

This repo includes `.github/workflows/deploy-pages.yml`. Pushing to `main` builds the app with:

```text
VITE_BASE_PATH=/risolju-1.0/
```

The workflow uploads `dist` to the `gh-pages` branch for GitHub Pages. It also registers a small service worker that adds
cross-origin isolation headers after the first production load, which WebLLM needs for browser-side
model execution on static hosting.

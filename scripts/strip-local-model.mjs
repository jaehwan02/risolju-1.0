import { readdir, rm, rmdir } from "node:fs/promises";
import path from "node:path";

const mlcDir = path.resolve("dist/mlc");
const keepFiles = new Set(
  [
    "dist/mlc/risolju-1.0-mobile-qwen3-1.7b/RiSolJu-1.0-Mobile-Qwen3-1.7B-q4f16_1-ctx2k-webgpu.wasm"
  ].map((file) => path.resolve(file))
);

async function stripDirectory(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error && error.code === "ENOENT") return;
    throw error;
  }

  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await stripDirectory(entryPath);
        await rmdir(entryPath).catch((error) => {
          if (error.code !== "ENOTEMPTY" && error.code !== "ENOENT") throw error;
        });
        return;
      }

      if (!keepFiles.has(path.resolve(entryPath))) {
        await rm(entryPath, { force: true });
      }
    })
  );
}

await stripDirectory(mlcDir);

console.log("Removed copied local model weights from dist/mlc");

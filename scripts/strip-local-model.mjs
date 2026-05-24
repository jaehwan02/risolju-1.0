import { readdir, rm, rmdir } from "node:fs/promises";
import path from "node:path";

const mlcDir = path.resolve("dist/mlc");
const keepFiles = new Set(
  ["dist/mlc/risolju-1.0-1.7b-mlc/risolju-1.0-1.7b-mlc-webgpu.wasm"].map((file) =>
    path.resolve(file)
  )
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

console.log("Removed non-deploy model artifacts from dist/mlc");

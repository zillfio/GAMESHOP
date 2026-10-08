import { copyFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";

const exportDirectory = resolve("out");

async function mirrorRoutePayloads(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const nestedDirectory = join(directory, entry.name);
    if (entry.name.startsWith("__next.")) {
      const payloads = await readdir(nestedDirectory, { withFileTypes: true });
      for (const payload of payloads) {
        if (!payload.isFile()) continue;
        await copyFile(
          join(nestedDirectory, payload.name),
          join(directory, `${entry.name}.${payload.name}`),
        );
      }
    }

    await mirrorRoutePayloads(nestedDirectory);
  }
}

await mirrorRoutePayloads(exportDirectory);
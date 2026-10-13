import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvironment, requireEnvironmentValue } from "./envInterface.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptDirectory, "..");
const environment = await loadEnvironment(join(projectDirectory, ".env"));
const pluginDirectory = requireEnvironmentValue(environment, "OBSIDIAN_PLUGIN_DIR");
const filesToDeploy = ["main.js", "manifest.json", "styles.css"];

await mkdir(pluginDirectory, { recursive: true });

for (const fileName of filesToDeploy) {
  await copyFile(
    join(projectDirectory, fileName),
    join(pluginDirectory, fileName),
  );
}

console.log(`Deployed Notionize to ${pluginDirectory}`)
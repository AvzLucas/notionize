import { readFile } from "node:fs/promises";

/**
 * Loads the small, local environment interface used by development scripts.
 * The real values stay in .env, which Git ignores.
 */
export async function loadEnvironment(environmentPath) {
  const content = await readFile(environmentPath, "utf8");
  const environment = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) continue;

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) continue;

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim();

    environment[key] = value;
  }

  return environment;
}

export function requireEnvironmentValue(environment, key) {
  const value = environment[key];

  if (!value) {
    throw new Error(`Missing ${key} in .env.`);
  }

  return value;
}

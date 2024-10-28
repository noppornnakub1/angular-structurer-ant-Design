const { writeFileSync } = require("fs");
const { join } = require("path");

const PACKAGE_JSON_PATH = join(__dirname, "package.json");

function readPackageJson() {
  try {
    return require(PACKAGE_JSON_PATH);
  } catch (error) {
    console.error("Error reading package.json:", error);
    process.exit(1);
  }
}

function writePackageJson(packageJson) {
  try {
    writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2));
  } catch (error) {
    console.error("Error writing package.json:", error);
    process.exit(1);
  }
}

let packageJson = readPackageJson();
let currentVersion = packageJson.version || "0.0.0.0";
let versionParts = currentVersion.split(".");
let buildNumber = parseInt(versionParts[3]) + 1;
let newVersion = `0.0.0.${buildNumber}`;

packageJson.version = newVersion;

writePackageJson(packageJson);
const { readFileSync, writeFileSync } = require("fs");
const { join } = require("path");

const PACKAGE_JSON_PATH = join(__dirname, "package.json");

// Function to read the package.json file
function readPackageJson() {
  try {
    return require(PACKAGE_JSON_PATH);
  } catch (error) {
    console.error("Error reading package.json:", error);
    process.exit(1);
  }
}

// Function to write the package.json file
function writePackageJson(packageJson) {
  try {
    writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2));
  } catch (error) {
    console.error("Error writing package.json:", error);
    process.exit(1);
  }
}

// Read the current package.json
let packageJson = readPackageJson();

// Extract the version from the package.json
let currentVersion = packageJson.version || "0.0.0.0";

// Increment the build number by 1
let versionParts = currentVersion.split(".");
let buildNumber = parseInt(versionParts[3]) + 1;
let newVersion = `0.0.0.${buildNumber}`;

// Update the package.json with the new version
packageJson.version = newVersion;

// Write the updated package.json back to the file
writePackageJson(packageJson);

// Log the new version
console.log(newVersion);

const fs = require('fs');
const path = require('path');

// --- Path Definitions ---
// The script runs from 'react-form-app'. The portal files are in a subfolder.
const webFilesDir = path.resolve(__dirname, 'pages/back-office-portal/web-files/');
const assetsDir = path.resolve(__dirname, './dist/assets');

// Define the full destination FILE paths
// const destJsPath = path.join(webFilesDir, 'pr-settings.js');
// const destCssPath = path.join(webFilesDir, 'pr-settings.css');
const destJsPath = path.join(webFilesDir, 'pr-services.js');
const destCssPath = path.join(webFilesDir, 'pr-services.css');
console.log(`Source assets directory: ${assetsDir}`);
console.log(`Destination JS file path: ${destJsPath}`);
console.log(`Destination CSS file path: ${destCssPath}`);
// ------------------------

// 1. Ensure the parent 'web-files' directory exists

// 2. Find the generated JS and CSS files from the build output
console.log('Reading build assets...');
const files = fs.readdirSync(assetsDir);
const jsFile = files.find(file => file.startsWith('index-') && file.endsWith('.js'));
const cssFile = files.find(file => file.startsWith('index-') && file.endsWith('.css'));

if (!jsFile || !cssFile) {
    console.error('ERROR: Could not find required JS or CSS files in dist/assets');
    process.exit(1);
}
console.log(`Found JS file: ${jsFile}`);
console.log(`Found CSS file: ${cssFile}`);

// 3. Define the full source file paths
const sourceJsPath = path.join(assetsDir, jsFile);
const sourceCssPath = path.join(assetsDir, cssFile);

// 4. Copy the files directly to their final destination
console.log(`Copying ${sourceJsPath} to ${destJsPath}`);
fs.copyFileSync(sourceJsPath, destJsPath);

console.log(`Copying ${sourceCssPath} to ${destCssPath}`);
fs.copyFileSync(sourceCssPath, destCssPath);

console.log('✓ Copy operation completed successfully!');
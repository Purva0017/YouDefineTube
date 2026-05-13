# Build Instructions for Mozilla Reviewers

This document provides step-by-step instructions to create an exact copy of the YouDefineTube add-on code from the provided source files. The extension is built using the Plasmo framework.

## 1. Operating System and Build Environment Requirements
- **Operating System**: Cross-platform (Windows, macOS, or Linux).
- **Node.js**: Version 18.x or higher is required.
  - Download and install Node.js from [nodejs.org](https://nodejs.org/).
- **Package Manager**: `pnpm` (Version 8.x or higher).
  - Install pnpm globally by running: `npm install -g pnpm`

## 2. Step-by-Step Build Instructions

1. Unzip the provided source code archive (`source-code.zip`) into a directory.
2. Open a terminal or command prompt.
3. Navigate into the root directory of the unzipped source code.
   ```bash
   cd path/to/unzipped/folder
   ```
4. Install all required dependencies:
   ```bash
   pnpm install
   ```
5. Execute the build script to generate the production extension for Firefox:
   ```bash
   pnpm plasmo build --target=firefox-mv3 --zip
   ```

## 3. Build Output
Once the build script finishes executing, it will generate a bundled, un-minified (if configured) or standard production build.
The final reproducible add-on zip file will be located at:
`build/firefox-mv3-prod.zip`

*(Note: The build process uses Parcel under the hood, managed entirely by the Plasmo framework, which handles the necessary transpilation from TypeScript to JavaScript).*

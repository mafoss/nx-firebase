"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
function updatePackageJson(options, context) {
    const mainFile = path_1.basename(options.main).replace(/\.[tj]s$/, '');
    const typingsFile = `${mainFile}.d.ts`;
    const mainJsFile = `${mainFile}.js`;
    const packageJson = JSON.parse(fs_1.readFileSync(path_1.join(context.root, options.packageJson)).toString());
    if (!packageJson.main) {
        packageJson.main = `${options.relativeMainFileOutput}${mainJsFile}`;
    }
    if (!packageJson.typings) {
        packageJson.typings = `${options.relativeMainFileOutput}${typingsFile}`;
    }
    fs_1.writeFileSync(`${options.outputPath}/package.json`, JSON.stringify(packageJson));
}
exports.default = updatePackageJson;
//# sourceMappingURL=update-package-json.js.map
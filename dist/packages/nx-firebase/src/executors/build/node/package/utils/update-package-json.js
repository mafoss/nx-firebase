"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const devkit_1 = require("@nrwl/devkit");
const path_1 = require("path");
function updatePackageJson(options, context) {
    const mainFile = path_1.basename(options.main).replace(/\.[tj]s$/, '');
    const typingsFile = `${mainFile}.d.ts`;
    const mainJsFile = `${mainFile}.js`;
    const packageJson = devkit_1.readJsonFile(path_1.join(context.root, options.packageJson));
    if (!packageJson.main) {
        packageJson.main = `${options.relativeMainFileOutput}${mainJsFile}`;
    }
    if (!packageJson.typings) {
        packageJson.typings = `${options.relativeMainFileOutput}${typingsFile}`;
    }
    devkit_1.writeJsonFile(`${options.outputPath}/package.json`, packageJson);
}
exports.default = updatePackageJson;
//# sourceMappingURL=update-package-json.js.map
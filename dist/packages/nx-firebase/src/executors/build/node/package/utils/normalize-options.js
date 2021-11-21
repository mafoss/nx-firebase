"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const devkit_1 = require("@nrwl/devkit");
const assets_1 = require("@nrwl/workspace/src/utilities/assets");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
function normalizeOptions(options, context, libRoot) {
    const outDir = path_1.join(context.root, options.outputPath);
    const files = assets_1.assetGlobsToFiles(options.assets, context.root, outDir);
    const rootDir = libRoot || '';
    if (options.main && !fs_extra_1.existsSync(options.main)) {
        throw new Error(`Please verify that the "main" option for project "${context.projectName}" is valid.`);
    }
    const mainFileDir = path_1.dirname(options.main);
    // Always include a preceding dot to match format used for entry points
    const relativeDir = devkit_1.normalizePath(path_1.relative(rootDir, mainFileDir));
    const relativeMainFileOutput = relativeDir === '' ? `./` : `./${relativeDir}/`;
    if (options.buildableProjectDepsInPackageJsonType == undefined) {
        options.buildableProjectDepsInPackageJsonType = 'dependencies';
    }
    return Object.assign(Object.assign({}, options), { files,
        relativeMainFileOutput, normalizedOutputPath: path_1.join(context.root, options.outputPath) });
}
exports.default = normalizeOptions;
//# sourceMappingURL=normalize-options.js.map
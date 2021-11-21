"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.packageExecutor = void 0;
const tslib_1 = require("tslib");
const project_graph_1 = require("@nrwl/workspace/src/core/project-graph");
const assets_1 = require("@nrwl/workspace/src/utilities/assets");
const buildable_libs_utils_1 = require("@nrwl/workspace/src/utilities/buildable-libs-utils");
const compile_typescript_files_1 = require("./utils/compile-typescript-files");
const update_package_json_1 = require("./utils/update-package-json");
const normalize_options_1 = require("./utils/normalize-options");
const cli_1 = require("./utils/cli");
function packageExecutor(options, context) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const libRoot = context.workspace.projects[context.projectName].root;
        const normalizedOptions = normalize_options_1.default(options, context, libRoot);
        const { target, dependencies } = buildable_libs_utils_1.calculateProjectDependencies(project_graph_1.readCachedProjectGraph(), context.root, context.projectName, context.targetName, context.configurationName);
        const dependentsBuilt = buildable_libs_utils_1.checkDependentProjectsHaveBeenBuilt(context.root, context.projectName, context.targetName, dependencies);
        if (!dependentsBuilt) {
            throw new Error();
        }
        const result = yield compile_typescript_files_1.default(normalizedOptions, context, libRoot, dependencies, () => tslib_1.__awaiter(this, void 0, void 0, function* () {
            return yield updatePackageAndCopyAssets(normalizedOptions, context, target, dependencies);
        }));
        if (options.cli) {
            cli_1.default(normalizedOptions, context);
        }
        return Object.assign(Object.assign({}, result), { outputPath: normalizedOptions.outputPath });
    });
}
exports.packageExecutor = packageExecutor;
function updatePackageAndCopyAssets(options, context, target, dependencies) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        yield assets_1.copyAssetFiles(options.files);
        update_package_json_1.default(options, context);
        if (dependencies.length > 0 &&
            options.updateBuildableProjectDepsInPackageJson) {
            buildable_libs_utils_1.updateBuildableProjectPackageJsonDependencies(context.root, context.projectName, context.targetName, context.configurationName, target, dependencies, options.buildableProjectDepsInPackageJsonType);
        }
    });
}
exports.default = packageExecutor;
//# sourceMappingURL=package.js.map
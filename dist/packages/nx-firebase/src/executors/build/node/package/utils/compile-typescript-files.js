"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const buildable_libs_utils_1 = require("@nrwl/workspace/src/utilities/buildable-libs-utils");
const compilation_1 = require("@nrwl/workspace/src/utilities/typescript/compilation");
const path_1 = require("path");
const load_ts_plugins_1 = require("../../../../../utils/load-ts-plugins");
function compileTypeScriptFiles(options, context, libRoot, projectDependencies, postCompleteAction) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        let tsConfigPath = path_1.join(context.root, options.tsConfig);
        if (projectDependencies.length > 0) {
            tsConfigPath = buildable_libs_utils_1.createTmpTsConfig(tsConfigPath, context.root, libRoot, projectDependencies);
        }
        const { compilerPluginHooks } = load_ts_plugins_1.loadTsPlugins(options.tsPlugins);
        const getCustomTransformers = (program) => ({
            before: compilerPluginHooks.beforeHooks.map((hook) => hook(program)),
            after: compilerPluginHooks.afterHooks.map((hook) => hook(program)),
            afterDeclarations: compilerPluginHooks.afterDeclarationsHooks.map((hook) => hook(program))
        });
        const tcsOptions = {
            outputPath: options.normalizedOutputPath,
            projectName: context.projectName,
            projectRoot: libRoot,
            tsConfig: tsConfigPath,
            deleteOutputPath: options.deleteOutputPath,
            rootDir: options.srcRootForCompilationRoot,
            watch: options.watch,
            getCustomTransformers
        };
        if (options.watch) {
            return compilation_1.compileTypeScriptWatcher(tcsOptions, (d) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                // Means tsc found 0 errors, in watch mode. https://github.com/microsoft/TypeScript/blob/main/src/compiler/diagnosticMessages.json
                if (d.code === 6194) {
                    yield postCompleteAction();
                }
            }));
        }
        else {
            const result = compilation_1.compileTypeScript(tcsOptions);
            yield postCompleteAction();
            return result;
        }
    });
}
exports.default = compileTypeScriptFiles;
//# sourceMappingURL=compile-typescript-files.js.map
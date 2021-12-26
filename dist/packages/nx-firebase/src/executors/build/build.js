"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
//SM: as of nx v12.1.1, we need this patch for ensuring the correct workspace is set in e2e runs
// See: https://github.com/nrwl/nx/issues/5065
const devkit_1 = require("@nrwl/devkit");
const project_graph_1 = require("@nrwl/workspace/src/core/project-graph");
const assets_1 = require("@nrwl/workspace/src/utilities/assets");
const buildable_libs_utils_1 = require("@nrwl/workspace/src/utilities/buildable-libs-utils");
const fs_extra_1 = require("fs-extra");
const path = require("path");
require("../../utils/e2ePatch");
const cli_1 = require("./node/package/utils/cli");
//SM: Much of our build executor is based on @nrwl/node:package executor
const compile_typescript_files_1 = require("./node/package/utils/compile-typescript-files");
const normalize_options_1 = require("./node/package/utils/normalize-options");
const update_package_json_1 = require("./node/package/utils/update-package-json");
const ENABLE_DEBUG = false;
function debugLog(...args) {
    if (ENABLE_DEBUG) {
        console.log(args);
    }
}
/**
 * Custom Firebase Functions "Application" nx build executor
 * Based on @nrwl/node:package executor
 *
 * - Builds the current application as a Typescript package library for Firebase functions
 * - Copies any dependent libraries to the dist folder
 * - Auto generates the firebase functions package.json
 * - Updates the firebase functions package.json to convert library dependency references to local file references
 *
 * After building, the project can be deployed using the firebase CLI as usual
 *
 * @param options
 * @param context
 * @returns build success/failure outcome
 */
function runExecutor(options, context) {
    var _a, _b, _c;
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        debugLog("Running Executor for Firebase Build for project '" +
            context.projectName +
            "'");
        debugLog('options=', options);
        // get the project graph; returns an object containing all nodes in the workspace, files, and dependencies
        const projGraph = project_graph_1.readCachedProjectGraph();
        // nx firebase functions are essentially @nrwl/node:package libraries, but are added to the project
        // as applications as they are fundamentally the deployable "application" output of a build pipeline.
        // Due to this, we can import standard node libraries as dependencies from within the workspace
        //  however, they must be created as "buildable" node libraries, because we have to ensure the
        //  firebase CLI can reference these libraries locally from within the dist folder when they are deployed.
        const appRoot = context.workspace.projects[context.projectName].root;
        const normalizedOptions = normalize_options_1.default(options, context, appRoot);
        //SM: note that the dependency search matches only buildable nodes in the tree
        // also, it matches candidate deps by targetName, so if your executor is called something other than "build" it wont find
        // any dependencies. Took me a few hours to figure that one out.
        const { target, dependencies } = buildable_libs_utils_1.calculateProjectDependencies(projGraph, context.root, context.projectName, context.targetName, context.configurationName);
        // ensure dependent libraries exist (ie. have been built at least once)
        // note that this check does not check if they are out of date. Not quite sure yet how to do that, but --with-deps will always work.
        const dependentsBuilt = buildable_libs_utils_1.checkDependentProjectsHaveBeenBuilt(context.root, context.projectName, context.targetName, dependencies);
        if (!dependentsBuilt) {
            throw new Error("Dependent libraries need to be built first. Try adding '--with-deps' CLI option");
        }
        // clean the output folder first
        // this way, if there are any issues with the compilation or dependency checks
        // we do not have inconsistent build output left lying around
        if (normalizedOptions.deleteOutputPath) {
            fs_extra_1.removeSync(normalizedOptions.outputPath);
        }
        // there aren't really any assets needed for firebase functions
        // but left here for compatibility with node:package
        debugLog('- Copying functions assets');
        yield assets_1.copyAssetFiles(normalizedOptions.files);
        // ensure the output package file has typings and a correct "main" entry point
        update_package_json_1.default(normalizedOptions, context);
        // Process Firebase Functions dependencies
        devkit_1.logger.log("- Processing dependencies for firebase functions app '" +
            context.projectName +
            "':");
        debugLog('dependencies=' + JSON.stringify(dependencies, null, 3));
        // list npm deps first, sorted alphabetically
        const npmDeps = dependencies
            .filter((dep) => dep.node.type !== 'lib')
            .sort((a, b) => a.name.localeCompare(b.name));
        for (const d of npmDeps) {
            const type = d.node.type;
            devkit_1.logger.log(" -  Added '" + type + "' dependency '" + d.name + "'");
        }
        // Sniff out any dependencies of this application that are
        //  non-buildable libraries
        // These won't show up in `dependencies` because they don't have a `build` target
        //
        // Probably added as user error (done it myself) so better to warn here explicitly
        // than ignore it and allow weird side-effects to happen if we proceed.
        const projectDeps = projGraph.dependencies[context.projectName].map((dep) => {
            const depName = dep.target;
            const node = projGraph.nodes[depName];
            return node;
        });
        const nonBuildableDeps = projectDeps.filter((dep) => {
            var _a, _b;
            return (dep === null || dep === void 0 ? void 0 : dep.type) === 'lib' && ((_b = (_a = dep === null || dep === void 0 ? void 0 : dep.data) === null || _a === void 0 ? void 0 : _a.targets) === null || _b === void 0 ? void 0 : _b['build']) === undefined;
        });
        //console.log("nonBuildableDeps=", JSON.stringify(nonBuildableDeps, null, 3));
        // automatically add any dependencies this application has to the output "package.json"
        // this will include both npm imports and workspace library imports
        // non-buildable deps will not show up here, but we've captured them already
        if (dependencies.length > 0 &&
            normalizedOptions.updateBuildableProjectDepsInPackageJson) {
            buildable_libs_utils_1.updateBuildableProjectPackageJsonDependencies(context.root, context.projectName, context.targetName, context.configurationName, target, dependencies, normalizedOptions.buildableProjectDepsInPackageJsonType);
        }
        // final custom step for building firebase functions applications is to:
        // - identify any workspace library dependencies
        // - copy them to the application dist folder
        // - update the output "package.json" to use local file references to these libraries
        //
        // This ensures that:
        // - the firebase CLI deploy command will work correctly
        // - all code for the functions is self contained with the dist/app/<firebaseapp> folder
        // - all local code for the functions will be uploaded to GCP without any need to faff with private npm packages
        // create a list of dependencies that are nx workspace libraries, sorted alphabetically
        const workspaceDependencies = dependencies
            .filter((dep) => {
            return dep.node.type === 'lib';
        })
            .sort((a, b) => a.name.localeCompare(b.name));
        // copy each of their build outputs in dist to a "libs" sub directory in our application dist output folder
        const depLibsDir = 'libs';
        const workspaceRoot = path.resolve(context.root);
        const localLibraries = {};
        for (const dep of workspaceDependencies) {
            const localPackageName = dep.name; // the library dependency package name
            const localLibraryName = dep.node.name; // the library dependency project name
            localLibraries[localPackageName] = dep;
            const srcDir = devkit_1.joinPathFragments(workspaceRoot, dep.outputs[0]);
            const outDir = devkit_1.joinPathFragments(workspaceRoot, normalizedOptions.outputPath, depLibsDir, localLibraryName);
            // we also copy libraries to node_modules in dist, because the Firebase CLI also runs the entry point script during a deploy to determine the exported functions
            // however, firebase does NOT upload node_modules to GCP, so we have to make two copies of each dependent local library package
            // see: https://firebase.google.com/docs/functions/handle-dependencies
            const nodeModulesDir = devkit_1.joinPathFragments(workspaceRoot, normalizedOptions.outputPath, 'node_modules', localPackageName);
            try {
                debugLog("- Copying dependent workspace library '" +
                    dep.node.name +
                    "' from '" +
                    srcDir +
                    "' to '" +
                    outDir +
                    "'");
                debugLog("- Copying dependent workspace library '" +
                    dep.node.name +
                    "' from '" +
                    srcDir +
                    "' to '" +
                    nodeModulesDir +
                    "'");
                yield fs_extra_1.copy(srcDir, outDir);
                yield fs_extra_1.copy(srcDir, nodeModulesDir);
                devkit_1.logger.log(" - Copied 'lib' dependency '" + dep.name + "'");
            }
            catch (err) {
                devkit_1.logger.error(err.message);
            }
        }
        const incompatibleNestedDeps = [];
        // rewrite references to library packages in the functions package.json
        // to be local package references to the copies we made
        const functionsPackageFile = `${options.outputPath}/package.json`;
        debugLog('- functions PackageFile=' + functionsPackageFile);
        const functionsPackageJson = devkit_1.readJsonFile(functionsPackageFile);
        const functionsPackageDeps = functionsPackageJson.dependencies;
        if (functionsPackageDeps) {
            debugLog('- Updating local dependencies for Firebase functions package.json');
            for (const d in functionsPackageDeps) {
                const localDep = localLibraries[d];
                debugLog("- Checking dependency '" +
                    d +
                    "', isLocalDep=" +
                    (localDep !== undefined));
                if (localDep) {
                    const localRef = 'file:' + devkit_1.joinPathFragments('.', 'libs', localDep.node.name);
                    debugLog(" - Replacing '" + d + "' with '" + localRef + "'");
                    functionsPackageDeps[d] = localRef;
                    // detect any incompatible nested libraries
                    if (d.split('/').length > 2) {
                        incompatibleNestedDeps.push(d);
                    }
                }
            }
        }
        devkit_1.writeJsonFile(functionsPackageFile, functionsPackageJson);
        devkit_1.logger.log('- Updated firebase functions package.json');
        debugLog('functions package deps = ', JSON.stringify(functionsPackageDeps, null, 3));
        // Final dep check before we compile for:
        // 1) non-buildable libraries
        // 2) nested libraries generated without `--importPath`
        // These are both show-stoppers for successful Firebase functions compilation
        // If any bad dependencies were found, report and throw
        // Non-buildable library dependencies are a show stopper
        // If any bad dependencies were found, report and throw
        for (const dep of nonBuildableDeps) {
            devkit_1.logger.error("ERROR: Found non-buildable library dependency '" +
                dep.name +
                "' in Firebase Application. Imported libraries must be created with `--buildable`.");
        }
        for (const dep of incompatibleNestedDeps) {
            devkit_1.logger.error("ERROR: Found incompatible nested library dependency '" +
                dep +
                "' in Firebase Application. Imported nested libraries must be created with `--importPath`.");
        }
        if (nonBuildableDeps.length || incompatibleNestedDeps.length) {
            throw new Error('ERROR: Firebase Application contains references to non-buildable or incompatible nested libraries, please fix in order to proceed with build.');
        }
        if (options.cli) {
            cli_1.default(normalizedOptions, context);
        }
        // Finally, compile the firebase functions Typescript application
        // uses the same builder logic as @nrwl/node:package
        // since we do not want or need to use webpack for cloud functions
        // So that we can support --watch (https://github.com/simondotm/nx-firebase/issues/11)
        // We run tsc as the last step, but we disable `deleteOutputPath` so that our previous steps are not deleted.
        normalizedOptions.deleteOutputPath = false;
        const result = yield compile_typescript_files_1.default(normalizedOptions, context, appRoot, dependencies, () => {
            //
        });
        return {
            success: (_c = (_b = (_a = result['value']) === null || _a === void 0 ? void 0 : _a.success) !== null && _b !== void 0 ? _b : result['success']) !== null && _c !== void 0 ? _c : false,
            outputPath: normalizedOptions.outputPath,
        };
    });
}
exports.default = runExecutor;
//# sourceMappingURL=build.js.map
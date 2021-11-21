"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applicationSchematic = exports.applicationGenerator = exports.addGitIgnoreEntry = exports.addLintingToApplication = void 0;
const tslib_1 = require("tslib");
const devkit_1 = require("@nrwl/devkit");
const path = require("path");
const fs = require("fs");
const init_1 = require("../init/init");
const linter_1 = require("@nrwl/linter");
const jest_1 = require("@nrwl/jest");
const run_tasks_in_serial_1 = require("@nrwl/workspace/src/utilities/run-tasks-in-serial");
function normalizeOptions(host, options) {
    var _a, _b;
    const { appsDir, npmScope } = devkit_1.getWorkspaceLayout(host);
    const appDirectory = options.directory
        ? `${devkit_1.names(options.directory).fileName}/${devkit_1.names(options.name).fileName}`
        : devkit_1.names(options.name).fileName;
    const appProjectName = appDirectory.replace(new RegExp('/', 'g'), '-');
    const appProjectRoot = devkit_1.joinPathFragments(appsDir, appDirectory);
    const parsedTags = options.tags
        ? options.tags.split(',').map((s) => s.trim())
        : [];
    // SM: we put the scoped project name into the firebase functions package.json
    // it's not actually necessary to do this for firebase functions, 
    // but it gives the package.json more context when viewed
    const importPath = options.importPath || `@${npmScope}/${appProjectName}`;
    return Object.assign(Object.assign({}, options), { name: devkit_1.names(appProjectName).fileName, appProjectRoot, appProjectName: appProjectName, parsedTags, linter: (_a = options.linter) !== null && _a !== void 0 ? _a : linter_1.Linter.EsLint, unitTestRunner: (_b = options.unitTestRunner) !== null && _b !== void 0 ? _b : 'jest', importPath: importPath });
}
/**
 * Add lint target to the firebase functions app
 * @param tree
 * @param options
 * @returns
 */
function addLintingToApplication(tree, options) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const lintTask = yield linter_1.lintProjectGenerator(tree, {
            linter: options.linter,
            project: options.name,
            tsConfigPaths: [
                devkit_1.joinPathFragments(options.appProjectRoot, 'tsconfig.app.json'),
            ],
            eslintFilePatterns: [
                `${options.appProjectRoot}/**/*.ts`,
            ],
            skipFormat: true,
        });
        return lintTask;
    });
}
exports.addLintingToApplication = addLintingToApplication;
/**
 * Create build target for NxFirebase apps
 * @param project
 * @param options
 * @returns target configuration
 */
function getBuildConfig(project, options) {
    return {
        executor: '@simondotm/nx-firebase:build',
        outputs: ['{options.outputPath}'],
        options: {
            outputPath: devkit_1.joinPathFragments('dist', options.appProjectRoot),
            main: devkit_1.joinPathFragments(project.sourceRoot, 'index.ts'),
            tsConfig: devkit_1.joinPathFragments(options.appProjectRoot, 'tsconfig.app.json'),
            packageJson: devkit_1.joinPathFragments(options.appProjectRoot, 'package.json'),
            assets: [devkit_1.joinPathFragments(options.appProjectRoot, '*.md'), devkit_1.joinPathFragments(options.appProjectRoot, '.runtimeconfig.json')],
        }
    };
}
/**
 * Create `emulate` target for NxFirebase apps
 * Uses run-commands executor to run the firebase emulator(s)
 *
 * @param project
 * @param options
 * @returns target configuration
 */
function getEmulateConfig(project, options) {
    return {
        executor: '@nrwl/workspace:run-commands',
        options: {
            command: `firebase emulators:start --config firebase.${options.appProjectName}.json`
        }
    };
}
/**
 * Create serve target for NxFirebase apps
 * Uses run-commands executor to:
 * 1. compile the functions app in watch mode
 * 2. select a firebase project
 * 3. run the firebase emulator(s)
 *
 * @param project
 * @param options
 * @returns target configuration
 */
function getServeConfig(project, options) {
    return {
        executor: '@nrwl/workspace:run-commands',
        options: {
            commands: [
                {
                    command: `nx run ${options.appProjectName}:build --with-deps && nx run ${options.appProjectName}:build --watch`
                },
                {
                    command: `nx run ${options.appProjectName}:emulate`
                }
            ],
            parallel: true
        }
    };
}
/**
 * Create deploy target for NxFirebase apps
 * Uses run-commands executor to run firebase CLI
 * Default Firebase Config has build+lint as predeploy
 * Additional command arguments are forwarded by default
 *
 * @param project
 * @param options
 * @returns target configuration
 */
function getDeployConfig(project, options) {
    return {
        executor: '@nrwl/workspace:run-commands',
        options: {
            command: `firebase deploy --config firebase.${options.appProjectName}.json`
        }
    };
}
/**
 * Create functions `getconfig` target
 * Uses run-commands executor to run firebase CLI
 *
 * @param project
 * @param options
 * @returns target configuration
 */
function getGetConfigConfig(project, options) {
    return {
        executor: '@nrwl/workspace:run-commands',
        options: {
            command: `firebase functions:config:get --config firebase.${options.appProjectName}.json > ${options.appProjectRoot}/.runtimeconfig.json`
        }
    };
}
/**
 * Add `.runtimeconfig.json` to workspace `.gitignore` file if not already added
 * @param host
 */
function addGitIgnoreEntry(host) {
    if (host.exists('.gitignore')) {
        let content = host.read('.gitignore', 'utf-8');
        if (!content.includes(".runtimeconfig.json")) {
            content = `${content}\n.runtimeconfig.json\n`;
            host.write('.gitignore', content);
        }
    }
    else {
        devkit_1.logger.warn(`Couldn't find .gitignore file to update`);
    }
}
exports.addGitIgnoreEntry = addGitIgnoreEntry;
/**
 * Generate the new Firebase app project in the workspace
 * @param tree
 * @param options
 */
function addProject(tree, options) {
    const project = {
        root: options.appProjectRoot,
        sourceRoot: devkit_1.joinPathFragments(options.appProjectRoot, 'src'),
        projectType: 'application',
        targets: {},
        tags: options.parsedTags,
    };
    project.targets.build = getBuildConfig(project, options);
    project.targets.deploy = getDeployConfig(project, options);
    project.targets.getconfig = getGetConfigConfig(project, options);
    project.targets.emulate = getEmulateConfig(project, options);
    project.targets.serve = getServeConfig(project, options);
    devkit_1.addProjectConfiguration(tree, options.name, project);
    const workspace = devkit_1.readWorkspaceConfiguration(tree);
    if (!workspace.defaultProject) {
        workspace.defaultProject = options.name;
        devkit_1.updateWorkspaceConfiguration(tree, workspace);
    }
    addGitIgnoreEntry(tree);
}
/**
 * Populate the NxFirebase app directory with the application files it needs:
 * - default database rules & indexes
 * - functions Typescript source directory & default entry script
 * - functions package.json
 * Also creates default `firebase.json` `.firebaserc` in the workspace root if they dont already exist
 * @param tree
 * @param options
 */
function addAppFiles(tree, options) {
    const relativeRootPath = devkit_1.offsetFromRoot(options.appProjectRoot);
    const firebaseAppConfig = `firebase.${options.appProjectName}.json`;
    const offsetFirebaseAppConfig = devkit_1.joinPathFragments(relativeRootPath, firebaseAppConfig);
    const templateOptions = Object.assign(Object.assign(Object.assign({}, options), devkit_1.names(options.name)), { offsetFromRoot: relativeRootPath, offsetFirebaseAppConfig: offsetFirebaseAppConfig, firebaseAppConfig: firebaseAppConfig, template: '' });
    // generate the firebase app specific files
    // we put the functions package & template typescript source files in here
    // it has no side effects if the user isn't using functions, and is easier to just assume.
    // user can delete if not wanted, and update their firebase config accordingly
    // 
    // we also put any additional rules files in the application folder;
    // 1. so that they dont clutter up the root workspace
    // 2. so that they are more meaningfully associated with and located as assets within the nx firebase application project they relate to
    devkit_1.generateFiles(tree, path.join(__dirname, 'files'), options.appProjectRoot, templateOptions);
    // we put the template firebase.json config file in the root of the workspace, named (__name__) after the 
    // app project, so that it can be easily located with the cli command, and also enables nx workspaces
    // to contain multiple firebase projects
    // *.firebase.json files have to go in the root of the workspace, because firebase function deployment only allows
    //  the deployed package for functions to exist in a sub directory from where the firebase.json config is located
    // In principle for users that are not using the firebase functions feature, they could put this firebase.json config
    //  inside their app folder, but it's better to have consistent behaviour for every workspace
    devkit_1.generateFiles(tree, path.join(__dirname, 'files_workspace'), '', templateOptions);
    // generate these firebase files in the root workspace only if they dont already exist 
    // ( since we dont want to overwrite any existing configs)
    // For a fresh workspace, the firebase CLI needs at least an empty firebase.json and an empty .firebaserc
    //  in order to use commands like 'firebase use --add'
    // firebase.json is an annoying artefact of this requirement, as it isn't actually used by our firebase apps
    //  which each have their own firebase.<appname>.json config
    const firebaseDefaultConfig = path.join(tree.root, "firebase.json");
    //console.log("firebaseDefaultConfig=" + firebaseDefaultConfig)
    if (!fs.existsSync(firebaseDefaultConfig)) {
        devkit_1.generateFiles(tree, path.join(__dirname, 'files_firebase'), '', templateOptions);
    }
    else {
        devkit_1.logger.log("✓ firebase.json already exists in this workspace");
    }
    const firebaseRc = path.join(tree.root, ".firebaserc");
    //console.log("firebaseRc=" + firebaseRc)
    if (!fs.existsSync(firebaseRc)) {
        devkit_1.generateFiles(tree, path.join(__dirname, 'files_firebaserc'), '', templateOptions);
    }
    else {
        devkit_1.logger.log("✓ .firebaserc already exists in this workspace");
    }
}
/**
 * NxFirebase application generator
 * Creates a new firebase application in the nx workspace
 * @param tree
 * @param schema
 * @returns
 */
function applicationGenerator(tree, schema) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const options = normalizeOptions(tree, schema);
        const tasks = [];
        const initTask = yield init_1.initGenerator(tree, Object.assign(Object.assign({}, options), { skipFormat: true }));
        tasks.push(initTask);
        addAppFiles(tree, options);
        addProject(tree, options);
        if (options.linter !== linter_1.Linter.None) {
            const lintTask = yield addLintingToApplication(tree, options);
            tasks.push(lintTask);
        }
        if (options.unitTestRunner === 'jest') {
            const jestTask = yield jest_1.jestProjectGenerator(tree, {
                project: options.name,
                setupFile: 'none',
                skipSerializers: true,
                supportTsx: false,
                babelJest: options.babelJest,
            });
            tasks.push(jestTask);
        }
        return run_tasks_in_serial_1.runTasksInSerial(...tasks);
    });
}
exports.applicationGenerator = applicationGenerator;
exports.default = applicationGenerator;
exports.applicationSchematic = devkit_1.convertNxGenerator(applicationGenerator);
//# sourceMappingURL=application.js.map
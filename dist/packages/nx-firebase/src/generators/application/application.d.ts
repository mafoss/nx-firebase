import { Tree, GeneratorCallback } from '@nrwl/devkit';
import { Schema } from './schema';
interface NormalizedSchema extends Schema {
    appProjectRoot: string;
    appProjectName: string;
    parsedTags: string[];
}
/**
 * Add lint target to the firebase functions app
 * @param tree
 * @param options
 * @returns
 */
export declare function addLintingToApplication(tree: Tree, options: NormalizedSchema): Promise<GeneratorCallback>;
/**
 * Add `.runtimeconfig.json` to workspace `.gitignore` file if not already added
 * @param host
 */
export declare function addGitIgnoreEntry(host: Tree): void;
/**
 * NxFirebase application generator
 * Creates a new firebase application in the nx workspace
 * @param tree
 * @param schema
 * @returns
 */
export declare function applicationGenerator(tree: Tree, schema: Schema): Promise<GeneratorCallback>;
export default applicationGenerator;
export declare const applicationSchematic: (options: Schema) => (tree: any, context: any) => Promise<any>;

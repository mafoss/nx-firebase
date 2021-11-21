import { CompilerPluginHooks, TsPluginEntry } from './types';
export declare function loadTsPlugins(plugins: TsPluginEntry[], moduleResolver?: typeof require.resolve): {
    compilerPluginHooks: CompilerPluginHooks;
    hasPlugin: boolean;
};

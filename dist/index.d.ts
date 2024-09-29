import type { PluginCreator } from 'postcss';

declare const creator: PluginCreator<pluginOptions>;
export default creator;

/** postcss-inline-properties plugin options */
export declare type pluginOptions = {
    /** Preserve the original notation. default: false */
    preserve?: boolean;
    /** Declaration value patterns to match against. Only matched values will have their variables replaced. default: [/^.*(var\([a-zA-Z0-9-_]+\)).*$/] */
    matchers?: RegExp[];
    /** Transform variable values as well as standard property values. default: true */
    includeVars?: boolean;
};

export { }

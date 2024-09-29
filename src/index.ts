import type { Node, Plugin, PluginCreator } from 'postcss'
import type valuesParser from 'postcss-value-parser'

import getCustomPropertiesFromRoot from './get-custom-properties-from-root'
import getCustomPropertiesFromSiblings from './get-custom-properties-from-siblings'
import { HAS_VAR_FUNCTION_REGEX } from './is-var-function'
import { hasSupportsAtRuleAncestor } from '@csstools/utilities'
import { transformProperties } from './transform-properties'

/** postcss-inline-properties plugin options */
export type pluginOptions = {
  /** Preserve the original notation. default: false */
  preserve?: boolean
  /** Declaration value patterns to match against. Only matched values will have their variables replaced. default: [/^.*(var\([a-zA-Z0-9-_]+\)).*$/] */
  matchers?: RegExp[]
  /** Transform variable values as well as standard property values. default: true */
  includeVars?: boolean
}

const SUPPORTS_REGEX = /\bvar\(|\(top: var\(--f\)/i

const creator: PluginCreator<pluginOptions> = (opts?: pluginOptions) => {
  const preserve = 'preserve' in Object(opts) ? Boolean(opts?.preserve) : false
  let matchers = opts?.matchers ?? [/^.*(var\([a-zA-Z0-9-_]+\)).*$/]
  if (!Array.isArray(matchers)) matchers = [matchers]
  const includeVars =
    'includeVars' in Object(opts) ? Boolean(opts?.includeVars) : false

  return {
    postcssPlugin: 'postcss-inline-properties',
    prepare(): Plugin {
      let rootCustomProperties: Map<string, valuesParser.ParsedValue> =
        new Map()
      const customPropertiesByParent: WeakMap<
        Node,
        Map<string, valuesParser.ParsedValue>
      > = new WeakMap()
      const parsedValuesCache: Map<string, valuesParser.ParsedValue> = new Map()

      return {
        postcssPlugin: 'postcss-inline-properties',
        Once(root): void {
          rootCustomProperties = getCustomPropertiesFromRoot(
            root,
            parsedValuesCache,
          )
        },
        Declaration(decl): void {
          if (!HAS_VAR_FUNCTION_REGEX.test(decl.value)) {
            return
          }

          if (!matchers.some(matcher => matcher.test(decl.value))) {
            return
          }

          if (hasSupportsAtRuleAncestor(decl, SUPPORTS_REGEX)) {
            return
          }

          let customProperties = rootCustomProperties

          if (preserve && decl.parent) {
            customProperties =
              customPropertiesByParent.get(decl.parent) ??
              getCustomPropertiesFromSiblings(
                decl,
                rootCustomProperties,
                parsedValuesCache,
              )
            customPropertiesByParent.set(decl.parent, customProperties)
          }

          transformProperties(decl, customProperties, {
            preserve,
            matchers,
            includeVars,
          })
        },
      }
    },
  }
}

creator.postcss = true

export default creator

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CleanCSS = require("../pre-bundled/node_modules/clean-css");
const html_minifier_1 = require("../pre-bundled/node_modules/html-minifier");
/**
 * The default <code>clean-css</code> options, optimized for production
 * minification.
 */
exports.defaultMinifyCSSOptions = {};
/**
 * The default <code>html-minifier</code> options, optimized for production
 * minification.
 */
exports.defaultMinifyOptions = {
    caseSensitive: true,
    collapseWhitespace: true,
    decodeEntities: true,
    minifyCSS: exports.defaultMinifyCSSOptions,
    minifyJS: true,
    processConditionalComments: true,
    removeAttributeQuotes: false,
    removeComments: true,
    removeEmptyAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    useShortDoctype: true
};
/**
 * The default strategy. This uses <code>html-minifier</code> to minify HTML and
 * <code>clean-css</code> to minify CSS.
 */
exports.defaultStrategy = {
    getPlaceholder(parts) {
        // Using @ and (); will cause the expression not to be removed in CSS.
        // However, sometimes the semicolon can be removed (ex: inline styles).
        // In those cases, we want to make sure that the HTML splitting also
        // accounts for the missing semicolon.
        const suffix = '();';
        let placeholder = '@TEMPLATE_EXPRESSION';
        while (parts.some(part => part.text.includes(placeholder + suffix))) {
            placeholder += '_';
        }
        return placeholder + suffix;
    },
    combineHTMLStrings(parts, placeholder) {
        return parts.map(part => part.text).join(placeholder);
    },
    minifyHTML(html, options = {}) {
        let minifyCSSOptions;
        if (options.minifyCSS) {
            if (options.minifyCSS !== true &&
                typeof options.minifyCSS !== 'function') {
                minifyCSSOptions = { ...options.minifyCSS };
            }
            else {
                minifyCSSOptions = {};
            }
        }
        else {
            minifyCSSOptions = false;
        }
        if (minifyCSSOptions) {
            minifyCSSOptions = adjustMinifyCSSOptions(minifyCSSOptions);
        }
        return html_minifier_1.minify(html, {
            ...options,
            minifyCSS: minifyCSSOptions
        });
    },
    minifyCSS(css, options = {}) {
        const output = new CleanCSS(adjustMinifyCSSOptions(options)).minify(css);
        if (output.errors && output.errors.length) {
            throw new Error(output.errors.join('\n\n'));
        }
        return output.styles;
    },
    splitHTMLByPlaceholder(html, placeholder) {
        // Make the last character (a semicolon) optional. See above.
        // return html.split(new RegExp(`${placeholder}?`, 'g'));
        return html.split(placeholder);
    }
};
function adjustMinifyCSSOptions(options = {}) {
    const levelOne = {
        transform(_property, value) {
            if (value.startsWith('@TEMPLATE_EXPRESSION') && !value.endsWith(';')) {
                // The CSS minifier has removed the semicolon from the placeholder
                // and we need to add it back.
                return `${value};`;
            }
            else {
                return value;
            }
        }
    };
    const level = options.level;
    if (typeof level === 'undefined' || level === 1) {
        return {
            ...options,
            level: {
                1: levelOne
            }
        };
    }
    else if (level === 2) {
        return {
            ...options,
            level: {
                1: levelOne,
                2: { all: true }
            }
        };
    }
    else if (level === 0) {
        return {
            ...options,
            level: 0
        };
    }
    else {
        const newLevel = { ...level };
        if (!newLevel[1]) {
            newLevel[1] = levelOne;
        }
        else {
            newLevel[1] = {
                ...levelOne,
                ...newLevel[1]
            };
        }
        return {
            ...options,
            level: newLevel
        };
    }
}
exports.adjustMinifyCSSOptions = adjustMinifyCSSOptions;
//# sourceMappingURL=strategy.js.map
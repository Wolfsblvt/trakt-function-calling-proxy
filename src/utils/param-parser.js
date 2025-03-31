/**
 * Utility functions for parsing request query parameters
 *
 * @example
 * const { number, date, string, boolean, enum } = paramParser;
 *
 * const num = number('123'); // 123
 * const invalidNum = number('abc'); // throws TypeError
 * const validDate = date('2022-01-01'); // Date object
 * const invalidDate = date('abc'); // throws TypeError
 * const str = string('abc'); // 'abc'
 * const invalidStr = string(123); // throws TypeError
 * const bool = boolean('true'); // true
 * const invalidBool = boolean('abc'); // throws TypeError
 * const validEnum = enum('value', ['value', 'other']); // 'value'
 * const invalidEnum = enum('invalid', ['invalid', 'other']); // throws TypeError
 */

export const paramParser = {
    /**
     * Parses a numerical parameter from a request query. Allows null/undefined, which returns undefined.
     * @param {any} param - The request query parameter
     * @returns {number|undefined} - The parsed number if it is a valid number
     */
    number(param) {
        if (param === null || param === undefined) {
            return undefined;
        }

        const parsed = Number(param);
        if (!Number.isNaN(parsed)) {
            return parsed;
        }

        throw new TypeError(`paramParser.number: Expected a number or null, got ${typeof param}`);
    },

    /**
     * Parses a numerical parameter from a request query. Does not allow null/undefined and throws an error.
     * @param {any} param - The request query parameter
     * @returns {number} - The parsed number if it is a valid number
     */
    numberStrict(param) {
        const number = this.number(param);
        if (number !== undefined) return number;
        throw new TypeError('paramParser.numberStrict: Parameter cannot be null or undefined');
    },

    /**
     * Parses a date parameter from a request query. Allows null/undefined, which returns undefined.
     * @param {any} param - The request query parameter
     * @returns {Date|undefined} - The parsed date if it is a valid date, undefined otherwise
     */
    date(param) {
        if (param === null || param === undefined) {
            return undefined;
        }

        const parsed = new Date(param);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed;
        }

        throw new TypeError(`paramParser.date: Expected a date or null, got ${typeof param}`);
    },

    /**
     * Parses a date parameter from a request query. Does not allow null/undefined and throws an error.
     * @param {any} param - The request query parameter
     * @returns {Date} - The parsed date if it is a valid date
     */
    dateStrict(param) {
        const date = this.date(param);
        if (date !== undefined) return date;
        throw new TypeError('paramParser.dateStrict: Parameter cannot be null or undefined');
    },

    /**
     * Parses a boolean parameter from a request query. Allows null/undefined, which returns undefined.
     * @param {any} param - The request query parameter
     * @returns {boolean|undefined} - The parsed boolean if it is a valid boolean, undefined otherwise
     */
    boolean(param) {
        if (param === null || param === undefined) {
            return undefined;
        }

        if (param === 'true') return true;
        if (param === 'false') return false;

        throw new TypeError(`paramParser.boolean: Expected a boolean or null, got ${typeof param}`);
    },

    /**
     * Parses a boolean parameter from a request query. Does not allow null/undefined and throws an error.
     * @param {any} param - The request query parameter
     * @returns {boolean} - The parsed boolean if it is a valid boolean
     */
    booleanStrict(param) {
        const boolean = this.boolean(param);
        if (boolean !== undefined) return boolean;
        throw new TypeError('paramParser.booleanStrict: Parameter cannot be null or undefined');
    },

    /**
     * Parses a string parameter from a request query. Allows null/undefined, which returns undefined.
     * @param {any} param - The request query parameter
     * @returns {string|undefined} - The parsed string if it is a valid string, undefined otherwise
     */
    string(param) {
        if (param === null || param === undefined) {
            return undefined;
        }

        if (typeof param === 'string') {
            return param;
        }

        throw new TypeError(`paramParser.string: Expected a string or null, got ${typeof param}`);
    },

    /**
     * Parses a string parameter from a request query. Does not allow null/undefined and throws an error.
     * @param {any} param - The request query parameter
     * @returns {string} - The parsed string if it is a valid string
     */
    stringStrict(param) {
        const string = this.string(param);
        if (string !== undefined) return string;
        throw new TypeError('paramParser.stringStrict: Parameter cannot be null or undefined');
    },

    /**
     * Parses an enum parameter from a request query. Allows null/undefined, which returns undefined.
     * @param {any} param - The request query parameter
     * @param {string[]|Record<string, string>} enumValues - The allowed enum values, or an enum object (which will then use the values)
     * @param {object} [options={}] - Options for parsing
     * @param {boolean} [options.matchCase=false] - Whether to match the case of the enum value
     * @returns {string|undefined} - The parsed enum value if it is a valid enum value
     */
    enum(param, enumValues, { matchCase = false } = {}) {
        if (param === null || param === undefined) {
            return undefined;
        }

        if (typeof param !== 'string') {
            throw new TypeError('paramParser.enum: Expected a string, got ' + typeof param);
        }

        const values = Array.isArray(enumValues) ? enumValues : Object.values(enumValues);
        const validValues = matchCase ? values : values.map(v => v.toLowerCase());
        const paramValue = matchCase ? param : param.toLowerCase();

        if (validValues.includes(paramValue)) {
            return values[validValues.indexOf(paramValue)];
        }

        throw new TypeError(`paramParser.enum: Expected one of [${values.join(', ')}], got ${param}`);
    },

    /**
     * Parses an enum parameter from a request query. Does not allow null/undefined and throws an error.
     * @param {any} param - The request query parameter
     * @param {string[]|Record<string, string>} enumValues - The allowed enum values, or an enum object (which will then use the values)
     * @param {object} [options={}] - Options for parsing
     * @param {boolean} [options.matchCase=false] - Whether to match the case of the enum value
     * @returns {string} - The parsed enum value if it is a valid enum value
     */
    enumStrict(param, enumValues, { matchCase = false } = {}) {
        const enumValue = this.enum(param, enumValues, { matchCase });
        if (enumValue !== undefined) return enumValue;
        throw new TypeError('paramParser.enumStrict: Parameter cannot be null or undefined');
    },
};

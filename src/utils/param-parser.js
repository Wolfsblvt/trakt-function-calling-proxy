import { ParameterValidationError } from '../utils/error-handler.js';

/**
 * Utility functions for parsing request query parameters
 *
 * @example
 * const { number, date, string, boolean, enum } = paramParser;
 *
 * const num = number('123'); // 123
 * const invalidNum = number('abc'); // throws ParameterValidationError
 * const validDate = date('2022-01-01'); // Date object
 * const invalidDate = date('abc'); // throws ParameterValidationError
 * const str = string('abc'); // 'abc'
 * const invalidStr = string(123); // throws ParameterValidationError
 * const bool = boolean('true'); // true
 * const invalidBool = boolean('abc'); // throws ParameterValidationError
 * const validEnum = enum('value', ['value', 'other']); // 'value'
 * const invalidEnum = enum('invalid', ['value', 'other']); // throws ParameterValidationError
 */
export const paramParser = {
    // Don't ask me, VSCode needs this or it screws up formatting
    _this: this,

    /**
     * Parses a numerical parameter from a request query. Allows null/undefined, which returns undefined.
     * @param {any} param - The request query parameter
     * @param {string} [paramName='<number>'] - Name of the parameter for error messages
     * @param {object} [options={}] - Additional options
     * @param {boolean} [options.allowNegative=false] - Whether to allow negative numbers
     * @param {?number} [options.min=null] - Minimum value
     * @param {?number} [options.max=null] - Maximum value
     * @returns {number|undefined} - The parsed number if it is a valid number
     */
    number(param, paramName = '<number>', { allowNegative = false, min = null, max = null } = {}) {
        if (param === null || param === undefined) {
            return undefined;
        }

        const parsed = Number(param);
        if (Number.isNaN(parsed)) {
            throw new ParameterValidationError(paramName,
                'invalid_value',
                `Expected a number, got ${typeof param === 'string' ? `'${param}'` : typeof param}`,
            );
        }
        if (!allowNegative && parsed < 0) {
            throw new ParameterValidationError(paramName,
                'negative_not_allowed',
                `Expected a non-negative number, got ${parsed}`,
            );
        }
        if (min !== null && parsed < min) {
            throw new ParameterValidationError(paramName,
                'below_minimum',
                `Expected a number greater than or equal to ${min}, got ${parsed}`,
            );
        }
        if (max !== null && parsed > max) {
            throw new ParameterValidationError(paramName,
                'above_maximum',
                `Expected a number less than or equal to ${max}, got ${parsed}`,
            );
        }

        return parsed;
    },

    /**
     * Parses a numerical parameter from a request query. Does not allow null/undefined and throws an error.
     * @param {any} param - The request query parameter
     * @param {string} [paramName='<number>'] - Name of the parameter for error messages
     * @param {object} [options={}] - Additional options
     * @param {boolean} [options.allowNegative=false] - Whether to allow negative numbers
     * @param {?number} [options.min=null] - Minimum value
     * @param {?number} [options.max=null] - Maximum value
     * @returns {number} - The parsed number if it is a valid number
     */
    numberStrict(param, paramName = '<number>', { allowNegative = false, min = null, max = null } = {}) {
        const number = this.number(param, paramName, { allowNegative, min, max });
        if (number !== undefined) return number;
        throw new ParameterValidationError(paramName, 'missing_required', 'Required parameter cannot be null or undefined');
    },

    /**
     * Parses a date parameter from a request query. Allows null/undefined, which returns undefined.
     * @param {any} param - The request query parameter
     * @param {string} [paramName='<date>'] - Name of the parameter for error messages
     * @returns {Date|undefined} - The parsed date if it is a valid date, undefined otherwise
     */
    date(param, paramName = '<date>') {
        if (param === null || param === undefined) {
            return undefined;
        }

        const parsed = new Date(param);
        if (Number.isNaN(parsed.getTime())) {
            throw new ParameterValidationError(paramName,
                'invalid_value',
                `Expected a valid date, got ${typeof param === 'string' ? `'${param}'` : typeof param}`,
            );
        }

        return parsed;
    },

    /**
     * Parses a date parameter from a request query. Does not allow null/undefined and throws an error.
     * @param {any} param - The request query parameter
     * @param {string} [paramName='<date>'] - Name of the parameter for error messages
     * @returns {Date} - The parsed date if it is a valid date
     */
    dateStrict(param, paramName = '<date>') {
        const date = this.date(param, paramName);
        if (date !== undefined) return date;
        throw new ParameterValidationError(paramName, 'missing_required', 'Required parameter cannot be null or undefined');
    },

    /**
     * Parses a boolean parameter from a request query. Allows null/undefined, which returns undefined.
     * @param {any} param - The request query parameter
     * @param {string} [paramName='<boolean>'] - Name of the parameter for error messages
     * @param {object} [options={}] - Additional options
     * @param {boolean} [options.allowBit=false] - Whether to allow '0' or '1' as a valid boolean
     * @param {boolean} [options.allowOnOff=false] - Whether to allow 'on' or 'off' as a valid boolean
     * @returns {boolean|undefined} - The parsed boolean if it is a valid boolean, undefined otherwise
     */
    boolean(param, paramName = '<boolean>', { allowBit = false, allowOnOff = false } = {}) {
        if (param === null || param === undefined) {
            return undefined;
        }

        const validValues = ['true', 'false'];
        allowBit && validValues.push('0', '1');
        allowOnOff && validValues.push('on', 'off');

        if (!validValues.includes(param)) {
            throw new ParameterValidationError(paramName,
                'invalid_value',
                `Expected one of [${validValues.join(', ')}], got ${typeof param === 'string' ? `'${param}'` : typeof param}`,
            );
        }

        return ['true', '1', 'on'].includes(param);
    },

    /**
     * Parses a boolean parameter from a request query. Does not allow null/undefined and throws an error.
     * @param {any} param - The request query parameter
     * @param {string} [paramName='<boolean>'] - Name of the parameter for error messages
     * @param {object} [options={}] - Additional options
     * @param {boolean} [options.allowBit=false] - Whether to allow '0' or '1' as a valid boolean
     * @param {boolean} [options.allowOnOff=false] - Whether to allow 'on' or 'off' as a valid boolean
     * @returns {boolean} - The parsed boolean if it is a valid boolean
     */
    booleanStrict(param, paramName = '<boolean>', { allowBit = false, allowOnOff = false } = {}) {
        const boolean = this.boolean(param, paramName, { allowBit, allowOnOff });
        if (boolean !== undefined) return boolean;
        throw new ParameterValidationError(paramName, 'missing_required', 'Required parameter cannot be null or undefined');
    },

    /**
     * Parses a string parameter from a request query. Allows null/undefined, which returns undefined.
     * @param {any} param - The request query parameter
     * @param {string} [paramName='<string>'] - Name of the parameter for error messages
     * @returns {string|undefined} - The parsed string if it is a valid string, undefined otherwise
     */
    string(param, paramName = '<string>') {
        if (param === null || param === undefined) {
            return undefined;
        }

        if (typeof param !== 'string') {
            throw new ParameterValidationError(paramName,
                'invalid_value',
                `Expected a string, got ${typeof param}`,
            );
        }

        return param;
    },

    /**
     * Parses a string parameter from a request query. Does not allow null/undefined and throws an error.
     * @param {any} param - The request query parameter
     * @param {string} [paramName='<string>'] - Name of the parameter for error messages
     * @returns {string} - The parsed string if it is a valid string
     */
    stringStrict(param, paramName = '<string>') {
        const string = this.string(param, paramName);
        if (string !== undefined) return string;
        throw new ParameterValidationError(paramName, 'missing_required', 'Required parameter cannot be null or undefined');
    },

    /**
     * Parses an enum parameter from a request query. Allows null/undefined, which returns undefined.
     * @param {any} param - The request query parameter
     * @param {string[]|Record<string, string>} enumValues - The allowed enum values, or an enum object (which will then use the values)
     * @param {string} [paramName='<enum>'] - Name of the parameter for error messages
     * @param {object} [options={}] - Options for parsing
     * @param {boolean} [options.matchCase=false] - Whether to match the case of the enum value
     * @param {Record<string, string[]>} [options.acceptedAliases={}] - Accepted aliases for the enum values
     * @returns {string|undefined} - The parsed enum value if it is a valid enum value
     */
    enum(param, enumValues, paramName = '<enum>', { matchCase = false, acceptedAliases = {} } = {}) {
        if (param === null || param === undefined) {
            return undefined;
        }

        if (typeof param !== 'string') {
            throw new ParameterValidationError(paramName,
                'invalid_value',
                `Expected a string, got ${typeof param}`,
            );
        }

        const values = Array.isArray(enumValues) ? enumValues : Object.values(enumValues);
        const validValues = matchCase ? values : values.map(v => v.toLowerCase());
        let paramValue = matchCase ? param : param.toLowerCase();

        // Check if the paramValue is an accepted alias
        if (acceptedAliases) {
            for (const enumKey in acceptedAliases) {
                if (acceptedAliases[enumKey].map(alias => matchCase ? alias : alias.toLowerCase()).includes(paramValue)) {
                    paramValue = matchCase ? enumKey : enumKey.toLowerCase();
                    break;
                }
            }
        }

        if (!validValues.includes(paramValue)) {
            throw new ParameterValidationError(paramName,
                'invalid_option',
                `Expected one of [${values.join(', ')}], got '${param}'`,
                { allowedValues: values },
            );
        }

        return values[validValues.indexOf(paramValue)];
    },

    /**
     * Parses an enum parameter from a request query. Does not allow null/undefined and throws an error.
     * @param {any} param - The request query parameter
     * @param {string[]|Record<string, string>} enumValues - The allowed enum values, or an enum object (which will then use the values)
     * @param {string} [paramName='<enum>'] - Name of the parameter for error messages
     * @param {object} [options={}] - Options for parsing
     * @param {boolean} [options.matchCase=false] - Whether to match the case of the enum value
     * @param {Record<string, string[]>} [options.acceptedAliases={}] - Accepted aliases for the enum values
     * @returns {string} - The parsed enum value if it is a valid enum value
     */
    enumStrict(param, enumValues, paramName = '<enum>', { matchCase = false, acceptedAliases = {} } = {}) {
        const enumValue = this.enum(param, enumValues, paramName, { matchCase, acceptedAliases });
        if (enumValue !== undefined) return enumValue;
        throw new ParameterValidationError(paramName, 'missing_required', 'Required parameter cannot be null or undefined');
    },
};

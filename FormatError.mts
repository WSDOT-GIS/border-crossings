/**
 * This module defines the {@link FormatError} class.
 * @packageDocumentation
 */

/**
 * An extension of {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error | Error} for use when the input
 * to a function is not in the expected format.
 */
export class FormatError extends Error {
    /**
     * 
     * @param value - The string value that was not in the expected format.
     * @param expectedFormat - A string or regular expression that describes the
     * format that was expected.
     */
    constructor(
        /** The string value that was not in the expected format. */
        public readonly value: string,
        /** 
         * A string or regular expression that describes the
         * format that was expected.
         */
        public readonly expectedFormat?: string | RegExp
    ) {
        const message = `${value} does not match the expected format: ${expectedFormat}`;
        super(message);
    }
}

export default FormatError;
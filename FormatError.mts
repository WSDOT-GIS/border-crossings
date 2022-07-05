/**
 * An extension of {@link Error} for use when the input
 * to a function is not in the expected format.
 */
export default class FormatError extends Error {
    constructor(
        public readonly value: string,
        public readonly expectedFormat?: string | RegExp,
        message?: string,
        errorOptions?: ErrorOptions
    ) {
        if (!message && expectedFormat) {
            message = `${value} does not match the expected format: ${expectedFormat}`;
        }
        super(message, errorOptions);
    }
}
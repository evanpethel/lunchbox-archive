export class ValidationError extends Error {
    constructor(message, code) {
        super(message);
        this.code = code;
    }
}

export function assertNonEmpty(value, fieldName, code) {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new ValidationError(`${fieldName} is required.`, code);
    }
}

export function assertPositiveNumber(value, fieldName, code) {
    if (typeof value !== "number" || Number.isNaN(value) || value <= 0) {
        throw new ValidationError(`${fieldName} must be a positive number.`, code);
    }
}
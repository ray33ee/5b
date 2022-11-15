class ConversionError extends Error {
  constructor(type, reason, ...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ConversionError);
    }

    this.name = "ConversionError";

    // Reason for conversion error
    this.reason = reason;
    this.type = type;
    this.date = new Date();
  }

  toString() {
    return this.name + ": Conversion to '" + this.type + "' bytes (from string) failed. Reason: '" + this.reason + "'"
  }

}

class ToBytesError extends ConversionError {
  constructor(input, ...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ToBytesError);
    }

    this.name = "ToBytesError";

    // Reason for conversion error
    this.input = input;
    this.date = new Date();
  }

}

class FromBytesError extends ConversionError {
  constructor(bytes, ...params) {
    // Pass remaining arguments (including vendor specific ones) to parent constructor
    super(...params);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FromBytesError);
    }

    this.name = "FromBytesError";

    // Reason for conversion error
    this.bytes = bytes;
    this.date = new Date();
  }
}
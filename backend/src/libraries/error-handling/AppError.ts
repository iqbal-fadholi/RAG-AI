export class AppError extends Error {
  constructor(
    public readonly name: string,
    public readonly httpStatusCode: number,
    public readonly message: string,
    public readonly isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

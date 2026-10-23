import type { ErrorRequestHandler, RequestHandler } from "express";
import { z } from "zod";

/** An error with an HTTP status, sent to the client as `{ message }`. */
export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Parses with `schema`, or throws a 400 describing what is wrong. */
export function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new HttpError(400, z.prettifyError(result.error));
  }
  return result.data;
}

export const notFound: RequestHandler = (_request, response) => {
  response.status(404).json({ message: "Not found" });
};

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _request,
  response,
  // Express recognises an error handler by its four parameters.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next,
) => {
  if (error instanceof HttpError) {
    response.status(error.status).json({ message: error.message });
    return;
  }
  // Body parser errors (malformed JSON, too large) carry their own status.
  const status = (error as { status?: unknown }).status;
  if (typeof status === "number" && status >= 400 && status < 500) {
    response.status(status).json({ message: "Invalid request body" });
    return;
  }
  console.error(error);
  response.status(500).json({ message: "Something went wrong" });
};

import { NextResponse } from "next/server";

/**
 * Standardize error responses across the API
 * @param message The error message to display to the client
 * @param status HTTP status code (default: 400)
 * @param details Additional debug details (optional)
 */
export function errorResponse(message: string, status: number = 400, details?: any) {
  return NextResponse.json(
    {
      error: message,
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * Standardize success responses across the API
 * @param data The main payload data
 * @param meta Additional metadata like pagination (optional)
 * @param status HTTP status code (default: 200)
 */
export function successResponse(data: any, meta?: any, status: number = 200) {
  return NextResponse.json(
    {
      ...data,
      ...(meta && { meta }),
    },
    { status }
  );
}

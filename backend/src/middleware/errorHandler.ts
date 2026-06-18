import { Request, Response, NextFunction } from "express";

export interface CustomError extends Error {
  statusCode?: number;
}

/**
 * Express middleware to gracefully handle and log backend exceptions
 */
export function errorHandler(
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = err.statusCode || 500;
  const message = err.message || "An unexpected error occurred in CarbonLeaf backend proxy.";

  console.error(`[SERVER ERROR] [${req.method} ${req.url}] - Status ${statusCode}:`, err);

  res.status(statusCode).json({
    error: message,
    timestamp: new Date().toISOString()
  });
}

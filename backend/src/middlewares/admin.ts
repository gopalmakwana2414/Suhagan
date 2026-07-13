import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

export const adminOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || !req.jwtPayload) {
    res.status(401).json({
      message: "Unauthorized",
    });
    return;
  }

  if (req.user.role !== "admin" || req.jwtPayload.role !== "admin") {
    res.status(403).json({
      message: "Admin access required",
    });
    return;
  }

  next();
};
import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.js";

export const customerOnly = (
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

  const userRole = req.user.role;
  const jwtRole = req.jwtPayload.role;

  const isUserCustomer = userRole === "customer" || userRole === "user";
  const isJwtCustomer = jwtRole === "customer" || jwtRole === "user";

  if (!isUserCustomer || !isJwtCustomer) {
    res.status(403).json({
      message: "Customer access required",
    });
    return;
  }

  next();
};

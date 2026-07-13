import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { User } from "../models/User";
import { Session } from "../models/Session";

export interface AuthRequest extends Request {
  user?: any;
  sessionDoc?: any;
  jwtPayload?: {
    id: string;
    role: string;
    sessionId?: string;
  };
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        message: "No token provided",
      });
      return;
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id: string;
      role: string;
      sessionId?: string;
    };

    if (!decoded.role) {
      res.status(401).json({
        message: "Invalid or expired token",
      });
      return;
    }

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      res.status(401).json({
        message: "User not found",
      });
      return;
    }

    // Check account lockout status (even if token is valid, if user gets locked out, block their requests)
    if (user.lockUntil && user.lockUntil > new Date()) {
      res.status(403).json({
        message: "Your account is temporarily locked. Please try again later.",
      });
      return;
    }

    // Validate Session if sessionId is embedded in the token
    if (decoded.sessionId) {
      const activeSession = await Session.findOne({
        _id: decoded.sessionId,
        user: user._id,
        isActive: true,
      });

      if (!activeSession) {
        res.status(401).json({
          message: "Session has been invalidated. Please log in again.",
        });
        return;
      }

      // Throttle session lastActivity update to once every 2 minutes
      const now = new Date();
      if (now.getTime() - activeSession.lastActivity.getTime() > 2 * 60 * 1000) {
        activeSession.lastActivity = now;
        await activeSession.save();
      }

      req.sessionDoc = activeSession;
    }

    req.user = user;
    req.jwtPayload = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};
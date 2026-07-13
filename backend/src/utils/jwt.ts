import jwt from "jsonwebtoken";
import { env } from "../config/env";

export const generateToken = (id: string, role: string, sessionId?: string) => {
  return jwt.sign({ id, role, sessionId }, env.JWT_SECRET, {
    expiresIn: "7d",
  });
};
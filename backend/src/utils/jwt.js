import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "wellness_super_secret_jwt_key_2026_xyz!";

export const signToken = (payload, expiresIn = "7d") => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

import jwt from "jsonwebtoken";
import { Role } from "../generated/prisma/enums";

export const generateAppAccessToken = (userId: string, role: Role) => {
  return jwt.sign(
    { userId, role },
    process.env.ACCESS_TOKEN_SECRET as string,
    {
      expiresIn: "7d",
    }
  );
};

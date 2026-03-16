import jwt from "jsonwebtoken";

export const generateAppAccessToken = (orgId: number) => {
  return jwt.sign(
    { orgId },
    process.env.ACCESS_TOKEN_SECRET as string,
    {
      expiresIn: "7d",
    }
  );
};

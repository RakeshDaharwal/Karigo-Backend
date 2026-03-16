import prisma from "../../config/db.conn";
import bcrypt from "bcrypt";

export const orgSignUpService = async (
  name: string,
  email: string,
  password: string
) => {
  
  const existingOrg = await prisma.organization.findUnique({
    where: { email },
  });

  if (existingOrg) {
    throw new Error("Organization already exists with this email");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  const organization = await prisma.organization.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  return organization;
};


export const orgSignInService = async (
  email: string,
  password: string
) => {
  const organization = await prisma.organization.findUnique({
    where: { email },
  });

  if (!organization) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    organization.password
  );

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  return organization;
};

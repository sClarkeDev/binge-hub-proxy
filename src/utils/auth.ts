import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET);

export const isJwtValid = async (token: string): Promise<boolean> => {
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
};

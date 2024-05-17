import { Base64 } from "js-base64";

export const hashPassword = (password: string): string => {
  const hashedPassword = Base64.encode(password);
  return hashedPassword;
};

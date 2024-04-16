export const generateUserName = () => {
  const randomString = Math.random().toString(36).substring(7);
  return `użytkownik#${randomString}`;
};

export const getAvatarText = (fullname: string) =>
  fullname
    .split(" ")
    .map((n) => n.charAt(0).toUpperCase())
    .join("");

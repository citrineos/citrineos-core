export const smartcase = (str: string): string =>
  str.replace(
    /\b(\w)(\w*)/g,
    (match, p1, p2) => p1.toUpperCase() + p2.toLowerCase(),
  );

export const parseDuration = (durationStr: string) => {
  const regex = /^(\d+)(ms|s|m|h)$/;
  const match = durationStr.match(regex);

  return match;
};

export const convertToMs = (time: number, unit: string): number => {
  switch (unit) {
    case "ms":
      return time;
    case "s":
      return time * 1000;
    case "m":
      return time * 60 * 1000;
    case "h":
      return time * 60 * 60 * 1000;
    default:
      throw new Error("Invalid time unit");
  }
};

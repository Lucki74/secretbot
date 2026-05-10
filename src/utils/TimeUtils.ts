export function parseDuration(durationStr: string): number | null {
  const regex = /^(\d+)(s|m|h|d|w|mo|y)$/;
  const match = durationStr.match(regex);
  if (!match) return null;

  const value = parseInt(match[1] || "0");
  const unit = match[2];

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    case "w":
      return value * 7 * 24 * 60 * 60 * 1000;
    case "mo":
      return value * 30 * 24 * 60 * 60 * 1000;
    case "y":
      return value * 365 * 24 * 60 * 60 * 1000;
    default:
      return null;
  }
}

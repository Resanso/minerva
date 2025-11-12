const BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim();

const normalizeBase = (value: string) => {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.toString().replace(/\/$/, "");
  } catch (error) {
    // Allow fallback even if the value is not a full URL (e.g. //api or localhost:8080)
    if (value.startsWith("//")) {
      return `http:${value}`.replace(/\/$/, "");
    }
    return value.replace(/\/$/, "");
  }
};

const baseUrl = normalizeBase(BASE) || "http://localhost:8080";

export const apiBaseUrl = baseUrl;

export const apiUrl = (path: string): string => {
  if (!path) return baseUrl;
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  try {
    const url = new URL(normalizedPath, `${baseUrl}/`);
    return url
      .toString()
      .replace(/\/$/, normalizedPath.endsWith("/") ? "/" : "");
  } catch (error) {
    return `${baseUrl}${normalizedPath}`;
  }
};

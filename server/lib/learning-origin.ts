/** One explicitly configured HTTPS deployment origin; forwarded headers are not trusted. */
export function configuredLearningOriginAllowed(
  headers: { host?: string | undefined; origin?: string | undefined }, env: NodeJS.ProcessEnv = process.env,
): boolean {
  const configured = env.LEARNING_PUBLIC_ORIGIN;
  if (!configured) return false;
  try {
    const url = new URL(configured);
    if (url.protocol !== 'https:' || url.hostname.includes('*') || url.username || url.password || url.pathname !== '/' || url.search || url.hash ||
      ![url.origin, `${url.origin}/`].includes(configured)) return false;
    return headers.host === url.host && (!headers.origin || headers.origin === url.origin);
  } catch { return false; }
}

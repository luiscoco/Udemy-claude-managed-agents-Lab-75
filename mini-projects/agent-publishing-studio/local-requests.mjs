export function localRequests(request, response, next) {
  const origin = request.headers.origin;
  if (origin) {
    let allowed = false;
    try { const url = new URL(origin); allowed = url.protocol === 'http:' && ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname); } catch {}
    if (!allowed) { response.status(403).json({ message: 'This project accepts requests only from a local browser.' }); return; }
  }
  next();
}

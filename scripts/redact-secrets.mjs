export function redactSecrets(value, secrets) {
  let redacted = String(value);
  for (const secret of secrets.filter(Boolean)) {
    for (const variant of new Set([secret, encodeURIComponent(secret)])) {
      redacted = redacted.split(variant).join("[REDACTED]");
    }
  }
  return redacted;
}

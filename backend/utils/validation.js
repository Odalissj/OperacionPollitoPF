function normalizePhone(value) {
  if (value == null || String(value).trim() === '') return null;
  const raw = String(value).trim();
  if (!/^\+?[0-9()\s-]+$/.test(raw)) return false;
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) return false;
  return raw.startsWith('+') ? `+${digits}` : digits;
}

module.exports = { normalizePhone };

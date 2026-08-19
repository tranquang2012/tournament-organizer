const pad = value => String(value).padStart(2, '0');

const toDateOnly = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }

  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] || null;
};

module.exports = { toDateOnly };

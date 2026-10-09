// Règles de validation des formulaires, alignées sur celles de l'API (app/models.py).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const rules = {
  name: (v) => (!v.trim() ? "Indique ton nom." : v.trim().length > 80 ? "80 caractères maximum." : ""),
  email: (v) => (!v.trim() ? "Indique ton email." : !EMAIL_RE.test(v.trim()) ? "Cet email n'a pas l'air valide." : ""),
  password: (v) => (!v ? "Indique ton mot de passe." : ""),
  newPassword: (v) =>
    v.length < 8 ? "8 caractères minimum." : v.length > 128 ? "128 caractères maximum." : "",
  terms: (v) => (v ? "" : "Accepte les conditions pour créer ton compte."),
};

/** Valide un ensemble de champs et renvoie { champ: message } pour ceux en erreur. */
export function validate(values, fieldRules) {
  const errors = {};
  for (const [field, rule] of Object.entries(fieldRules)) {
    const message = rule(values[field]);
    if (message) errors[field] = message;
  }
  return errors;
}

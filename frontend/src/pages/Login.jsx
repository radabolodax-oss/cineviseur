import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";
import FormField from "../components/FormField";
import useSeo from "../hooks/useSeo";
import { rules, validate } from "../lib/validation";

const FIELD_RULES = { email: rules.email, password: rules.password };

export default function Login() {
  useSeo("Connexion", "Connecte-toi pour retrouver ta liste de films et séries, tes notes et tes alertes de sortie.");
  const [values, setValues] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const visibleErrors = Object.fromEntries(Object.entries(errors).filter(([k]) => touched[k]));

  function update(field, value) {
    const next = { ...values, [field]: value };
    setValues(next);
    setErrors(validate(next, FIELD_RULES));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate(values, FIELD_RULES);
    setErrors(found);
    setTouched({ email: true, password: true });
    if (Object.keys(found).length) return;
    setServerError("");
    setLoading(true);
    try {
      const user = await api.login({ email: values.email.trim(), password: values.password });
      login(user);
      navigate("/discover");
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Connexion"
      intro="Retrouvez votre liste, vos notes et vos alertes de sortie."
      footer={
        <>
          Pas encore de compte ? <Link to="/register" className="link">Créer un compte</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <FormField
          id="login-email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.fr"
          value={values.email}
          onChange={(e) => update("email", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          error={visibleErrors.email}
        />
        <FormField
          id="login-password"
          label="Mot de passe"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={(e) => update("password", e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          error={visibleErrors.password}
        />
        {serverError && (
          <p role="alert" className="text-sm text-rose-300 -mt-1">
            {serverError}
          </p>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5 mt-2">
          {loading ? "Connexion en cours..." : "Se connecter"}
        </button>
      </form>
    </AuthShell>
  );
}

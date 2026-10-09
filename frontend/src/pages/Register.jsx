import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";
import FormField from "../components/FormField";
import useSeo from "../hooks/useSeo";
import { rules, validate } from "../lib/validation";

const FIELD_RULES = { name: rules.name, email: rules.email, password: rules.newPassword, terms: rules.terms };

export default function Register() {
  useSeo("Créer un compte", "Crée ton compte CineViseur gratuitement et suis tes films et séries sur le web, Windows et Android.");
  const [values, setValues] = useState({ name: "", email: "", password: "", terms: false, website: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const visibleErrors = Object.fromEntries(Object.entries(errors).filter(([k]) => touched[k]));
  const touch = (field) => () => setTouched((t) => ({ ...t, [field]: true }));

  function update(field, value) {
    const next = { ...values, [field]: value };
    setValues(next);
    setErrors(validate(next, FIELD_RULES));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validate(values, FIELD_RULES);
    setErrors(found);
    setTouched({ name: true, email: true, password: true, terms: true });
    if (Object.keys(found).length) return;
    setServerError("");
    setLoading(true);
    try {
      const data = await api.register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        accepted_terms: values.terms,
        website: values.website,
      });
      login(data.access_token, data.user);
      navigate("/discover");
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Créer un compte"
      intro="Gratuit. Votre liste vous suit ensuite sur le web, Windows et Android."
      footer={
        <>
          Déjà un compte ? <Link to="/login" className="link">Se connecter</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        <FormField
          id="register-name"
          label="Nom"
          autoComplete="name"
          value={values.name}
          onChange={(e) => update("name", e.target.value)}
          onBlur={touch("name")}
          error={visibleErrors.name}
        />
        <FormField
          id="register-email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.fr"
          value={values.email}
          onChange={(e) => update("email", e.target.value)}
          onBlur={touch("email")}
          error={visibleErrors.email}
        />
        <FormField
          id="register-password"
          label="Mot de passe"
          type="password"
          autoComplete="new-password"
          help="8 caractères minimum."
          value={values.password}
          onChange={(e) => update("password", e.target.value)}
          onBlur={touch("password")}
          error={visibleErrors.password}
        />

        {/* Champ piège anti-robots : invisible et ignoré par les humains et les lecteurs d'écran. */}
        <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
          <label htmlFor="register-website">Site web</label>
          <input
            id="register-website"
            tabIndex={-1}
            autoComplete="off"
            value={values.website}
            onChange={(e) => setValues((v) => ({ ...v, website: e.target.value }))}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-start gap-3 text-sm text-white/75 leading-relaxed cursor-pointer">
            <input
              type="checkbox"
              checked={values.terms}
              onChange={(e) => {
                update("terms", e.target.checked);
                setTouched((t) => ({ ...t, terms: true }));
              }}
              aria-invalid={Boolean(visibleErrors.terms)}
              className="mt-1 w-4 h-4 shrink-0 accent-[#7c5ce0] cursor-pointer"
            />
            <span>
              J'accepte les <Link to="/cgu" className="link">conditions d'utilisation</Link> et j'ai lu la{" "}
              <Link to="/confidentialite" className="link">politique de confidentialité</Link>.
            </span>
          </label>
          {visibleErrors.terms && <p role="alert" className="text-sm text-rose-300">{visibleErrors.terms}</p>}
        </div>

        {serverError && <p role="alert" className="text-sm text-rose-300">{serverError}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5 mt-2">
          {loading ? "Création en cours..." : "Commencer à suivre"}
        </button>
      </form>
    </AuthShell>
  );
}

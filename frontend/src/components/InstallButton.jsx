import Icon from "./Icon";
import { useInstall } from "./InstallGuide";

/** Ouvre la fenêtre de téléchargement (Windows, Mac, Android, iPhone & iPad). */
export default function InstallButton({ className = "btn-ghost" }) {
  const { openGuide, installed } = useInstall();
  if (installed) return null;
  return (
    <button onClick={openGuide} className={className}>
      <Icon name="download" className="w-4 h-4" />
      Installer l'application
    </button>
  );
}

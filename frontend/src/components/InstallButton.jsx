import Icon from "./Icon";
import { useInstall } from "./InstallGuide";

export default function InstallButton({ className = "btn-ghost" }) {
  const { handleInstall, installed } = useInstall();
  if (installed) return null;
  return (
    <button onClick={handleInstall} className={className}>
      <Icon name="download" className="w-4 h-4" />
      Installer l'application
    </button>
  );
}

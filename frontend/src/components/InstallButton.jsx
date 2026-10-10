import Icon from "./Icon";
import { useInstall } from "./InstallGuide";

/** Ouvre la marche à suivre pour installer le site en application. */
export default function InstallButton({ className = "btn-ghost" }) {
  const { openGuide, installed } = useInstall();
  if (installed) return null;
  return (
    <button onClick={openGuide} className={className}>
      <Icon name="mobile" className="w-4 h-4" />
      Installer l'application
    </button>
  );
}

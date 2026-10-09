import { useRef, useState } from "react";
import { motion } from "motion/react";
import useDismiss from "../hooks/useDismiss";
import Icon from "./Icon";
import { Popover } from "./motion";
import { SPRING } from "../lib/motionTokens";

const RELEASES_BASE = "https://github.com/radabolodax-oss/cineviseur-releases/releases/latest/download";

const OPTIONS = [
  { label: "Windows", hint: "Installateur .exe", icon: "windows", file: "CineViseur-Setup-1.0.0.exe" },
  { label: "Android", hint: "Application .apk", icon: "android", file: "CineViseur-1.0.0.apk" },
];

export default function DownloadButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useDismiss(ref, open, () => setOpen(false));

  return (
    <div className="relative inline-block" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="btn-ghost" aria-expanded={open}>
        <Icon name="download" className="w-4 h-4" />
        Télécharger l'application
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={SPRING} className="inline-flex">
          <Icon name="chevronDown" className="w-4 h-4" />
        </motion.span>
      </button>

      <Popover open={open} origin="top left" className="absolute left-0 bottom-full mb-2 sm:bottom-auto sm:mb-0 sm:top-full sm:mt-2 w-64 panel p-1.5 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.7)] z-50">
        {OPTIONS.map((opt) => (
          <a
            key={opt.file}
            href={`${RELEASES_BASE}/${opt.file}`}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/80 hover:bg-white/[0.07] hover:text-white transition"
            onClick={() => setOpen(false)}
          >
            <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/[0.06] ring-1 ring-inset ring-white/10">
              <Icon name={opt.icon} className="w-4 h-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold">{opt.label}</span>
              <span className="block text-xs text-white/50">{opt.hint}</span>
            </span>
          </a>
        ))}
      </Popover>
    </div>
  );
}

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import Icon from "./Icon";
import { getMyProviders, POPULAR_PROVIDERS, setMyProviders } from "../lib/providers";
import { play } from "../lib/feedback";

export default function ProvidersModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(getMyProviders());

  useEffect(() => {
    const handleOpen = () => {
      setSelected(getMyProviders());
      setIsOpen(true);
      play("pop");
    };

    window.addEventListener("cv:open-providers", handleOpen);
    return () => window.removeEventListener("cv:open-providers", handleOpen);
  }, []);

  const toggle = (id) => {
    play("tick");
    setSelected((prev) => {
      const next = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
      return next;
    });
  };

  const handleSave = () => {
    setMyProviders(selected);
    play("pop");
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-md rounded-3xl bg-[#0f111e]/95 border border-white/20 shadow-2xl p-6 md:p-8 z-10 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cine-violet/20 flex items-center justify-center text-cine-soft">
                  <Icon name="tv" className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-white">Mes Abonnements</h3>
                  <p className="text-xs text-white/50">Sélectionnez vos plateformes actives</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="btn-icon !w-8 !h-8 text-white/60 hover:text-white"
              >
                <Icon name="x" className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-white/70 mb-5 leading-relaxed">
              Cochez les services que vous possédez. CineViseur filtrera les catalogues pour vous proposer ce que vous pouvez regarder immédiatement sans frais supplémentaires.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1 mb-6">
              {POPULAR_PROVIDERS.map((prov) => {
                const isChecked = selected.includes(prov.id);
                return (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => toggle(prov.id)}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-left ${
                      isChecked
                        ? "bg-cine-violet/25 border-cine-soft/60 text-white ring-1 ring-cine-soft/40"
                        : "bg-white/[0.03] border-white/10 text-white/60 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: prov.color }}
                      />
                      <span className="font-medium text-sm truncate">{prov.name}</span>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                        isChecked
                          ? "bg-cine-soft text-cine-ink"
                          : "border border-white/20 text-transparent"
                      }`}
                    >
                      ✓
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                className="btn-primary !py-3 text-sm w-full font-semibold shadow-lg shadow-cine-violet/30"
              >
                <span>Enregistrer ({selected.length} active{selected.length > 1 ? "s" : ""})</span>
                <Icon name="check" className="w-4 h-4" weight="bold" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

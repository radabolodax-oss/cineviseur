import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[CineViseur ErrorBoundary]", error, errorInfo);
  }

  handleReload = () => {
    try {
      if ("caches" in window) {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
      }
    } catch {
      // ignore
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0c0b12] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center text-3xl mb-4">
            🍿
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display mb-2">Un petit accroc d'affichage</h1>
          <p className="text-white/60 text-sm max-w-md mb-6 leading-relaxed">
            Une mise à jour ou un élément en cache a provoqué une interruption. Vos listes et vos données locales restent strictement intactes.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
          >
            Actualiser CineViseur
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

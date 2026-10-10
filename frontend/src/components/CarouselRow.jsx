import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { api } from "../lib/api";
import MediaCard from "./MediaCard";
import SectionTitle from "./SectionTitle";
import Icon from "./Icon";
import { Reveal } from "./motion";
import { EASE_OUT, SPRING } from "../lib/motionTokens";

const CARD_WIDTH = "shrink-0 w-32 sm:w-36 md:w-40 lg:w-44";

export default function CarouselRow({ title, mediaType, genre, sort, minRating, year, listKind, staticItems, pending = false }) {
  const [items, setItems] = useState(staticItems || []);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [fetching, setLoading] = useState(!staticItems);
  // `pending` : les éléments sont fournis par le parent, qui les charge encore.
  const loading = fetching || pending;
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const scrollerRef = useRef(null);
  const startRef = useRef(null);
  const endRef = useRef(null);
  const fetchingMore = useRef(false);

  function fetchPage(pageNum) {
    return listKind
      ? api.list(listKind, "fr", pageNum)
      : api.discover(mediaType, "fr", { genre, sort, minRating, year, page: pageNum });
  }

  useEffect(() => {
    if (staticItems) {
      setItems(staticItems);
      setLoading(false);
      return;
    }
    setLoading(true);
    setItems([]);
    setPage(1);
    fetchPage(1)
      .then((data) => {
        setItems(data.results || []);
        setTotalPages(data.total_pages || 1);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
    if (scrollerRef.current) scrollerRef.current.scrollLeft = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaType, genre, sort, minRating, year, listKind, staticItems]);

  function loadMore() {
    if (staticItems || fetchingMore.current || page >= totalPages) return;
    fetchingMore.current = true;
    const nextPage = page + 1;
    fetchPage(nextPage)
      .then((data) => {
        setItems((prev) => [...prev, ...(data.results || [])]);
        setPage(nextPage);
      })
      .finally(() => {
        fetchingMore.current = false;
      });
  }

  // Bords du carrousel et chargement de la page suivante : deux sentinelles observées,
  // aucun calcul à chaque pixel de défilement.
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root || !startRef.current || !endRef.current) return;
    const edgeObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === startRef.current) setAtStart(entry.isIntersecting);
          else setAtEnd(entry.isIntersecting);
        }
      },
      { root }
    );
    const moreObserver = new IntersectionObserver(([entry]) => entry.isIntersecting && loadMore(), {
      root,
      rootMargin: "0px 600px 0px 0px",
    });
    edgeObserver.observe(startRef.current);
    edgeObserver.observe(endRef.current);
    moreObserver.observe(endRef.current);
    return () => {
      edgeObserver.disconnect();
      moreObserver.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, page, totalPages]);

  function scrollBy(dir) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -el.clientWidth * 0.8 : el.clientWidth * 0.8, behavior: "smooth" });
  }

  if (!loading && items.length === 0) return null;

  // Le conteneur gère l'apparition au survol de la rangée (CSS), le bouton son entrée/sortie (Motion).
  const arrowSlot =
    "hidden md:block absolute top-[38%] -translate-y-1/2 z-10 opacity-0 group-hover/row:opacity-100 focus-within:opacity-100 transition-opacity duration-300";
  const arrow =
    "flex items-center justify-center w-11 h-11 rounded-full bg-[#111116]/90 ring-1 ring-white/15 text-white shadow-[0_12px_32px_-8px_rgba(0,0,0,0.7)] backdrop-blur-md hover:bg-[#f4f4f6] hover:text-cine-ink transition-colors duration-200";

  return (
    <section className="mb-14">
      <Reveal y={16}>
        <SectionTitle className="px-4 sm:px-6 md:px-10">{title}</SectionTitle>
      </Reveal>

      <div className="relative group/row">
        <div
          ref={scrollerRef}
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scroll-px-4 sm:scroll-px-6 md:scroll-px-10 px-4 sm:px-6 md:px-10 pt-3 pb-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          <span ref={startRef} aria-hidden="true" className="shrink-0 w-px -mr-4" />
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className={CARD_WIDTH} aria-hidden="true">
                  <div className="aspect-[2/3] rounded-xl skeleton" />
                  <div className="h-3 w-3/4 mt-3 rounded skeleton" />
                  <div className="h-2.5 w-1/3 mt-1.5 rounded skeleton" />
                </div>
              ))
            : items.map((item, i) => (
                <motion.div
                  key={`${item.media_type || mediaType}-${item.id}`}
                  className={`${CARD_WIDTH} snap-start`}
                  initial={{ opacity: 0, x: 32 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.6, delay: (i % 8) * 0.045, ease: EASE_OUT }}
                >
                  <MediaCard item={item} mediaType={mediaType || item.media_type} />
                </motion.div>
              ))}
          <span ref={endRef} aria-hidden="true" className="shrink-0 w-px -ml-4" />
        </div>

        {!loading && (
          <>
            <div className={`${arrowSlot} left-3`}>
              <AnimatePresence>
                {!atStart && (
                  <motion.button
                    key="prev"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    
                    transition={SPRING}
                    onClick={() => scrollBy("left")}
                    className={arrow}
                    aria-label="Précédent"
                  >
                    <Icon name="chevronLeft" className="w-5 h-5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
            <div className={`${arrowSlot} right-3`}>
              <AnimatePresence>
                {!atEnd && (
                  <motion.button
                    key="next"
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    
                    transition={SPRING}
                    onClick={() => scrollBy("right")}
                    className={arrow}
                    aria-label="Suivant"
                  >
                    <Icon name="chevronRight" className="w-5 h-5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

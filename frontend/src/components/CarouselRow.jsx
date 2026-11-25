import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import PosterRack from "./PosterRack";

const ACCENT_PALETTE = ["crimson", "emerald", "indigo", "amber", "purple"];

function pickAccent(title = "") {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = (hash * 31 + title.charCodeAt(i)) >>> 0;
  return ACCENT_PALETTE[hash % ACCENT_PALETTE.length];
}

function dedupeWithPosters(list) {
  const seen = new Set();
  const out = [];
  for (const it of list || []) {
    if (!it || !it.poster_path) continue;
    const key = `${it.media_type || ""}-${it.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

export default function CarouselRow({
  title,
  mediaType,
  genre,
  sort,
  minRating,
  year,
  listKind,
  staticItems,
  pending = false,
  sectionIndex,
  sectionLabel,
  subtitle,
  accent,
}) {
  const [items, setItems] = useState(() => dedupeWithPosters(staticItems || []));
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(staticItems && !listKind && !mediaType ? 1 : 20);
  const [fetching, setLoading] = useState(!staticItems);
  const [loadingMore, setLoadingMore] = useState(false);
  const fetchingMoreRef = useRef(false);
  const loading = fetching || pending;

  const canPaginate = Boolean(listKind || mediaType);

  const fetchPage = useCallback(
    (pageNum) =>
      listKind
        ? api.list(listKind, "fr", pageNum)
        : api.discover(mediaType, "fr", { genre, sort, minRating, year, page: pageNum }),
    [listKind, mediaType, genre, sort, minRating, year]
  );

  useEffect(() => {
    if (staticItems) {
      setItems(dedupeWithPosters(staticItems));
      setPage(1);
      setTotalPages(canPaginate ? 20 : 1);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setItems([]);
    setPage(1);
    fetchPage(1)
      .then((data) => {
        if (cancelled) return;
        setItems(dedupeWithPosters(data.results || []));
        setTotalPages(Math.min(data.total_pages || 1, 50));
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchPage, staticItems, canPaginate]);

  const loadMore = useCallback(() => {
    if (!canPaginate || fetchingMoreRef.current || page >= totalPages) return;
    fetchingMoreRef.current = true;
    setLoadingMore(true);
    const nextPage = page + 1;
    fetchPage(nextPage)
      .then((data) => {
        const nextResults = data.results || [];
        if (nextResults.length === 0) {
          setTotalPages(page);
          return;
        }
        setItems((prev) => dedupeWithPosters([...prev, ...nextResults]));
        setPage(nextPage);
        if (data.total_pages) setTotalPages(Math.min(data.total_pages, 50));
      })
      .catch(() => {
        // ignore transient page fetch error
      })
      .finally(() => {
        fetchingMoreRef.current = false;
        setLoadingMore(false);
      });
  }, [canPaginate, page, totalPages, fetchPage]);

  if (!loading && items.length === 0) return null;

  const resolvedLabel =
    sectionLabel || (mediaType === "tv" ? "SÉRIES" : mediaType === "movie" ? "FILMS" : "SÉLECTION");

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-10 w-full mb-10">
      <PosterRack
        items={items}
        mediaType={mediaType}
        sectionIndex={sectionIndex || "3D"}
        sectionLabel={resolvedLabel}
        sectionTitle={title}
        subtitle={subtitle}
        accent={accent || pickAccent(title)}
        pending={loading}
        onLoadMore={canPaginate ? loadMore : undefined}
        hasMore={canPaginate && page < totalPages}
        loadingMore={loadingMore}
      />
    </div>
  );
}

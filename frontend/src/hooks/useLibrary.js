import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { libraryIndex, loadLibrary, subscribeLibrary } from "../lib/library";

/** La liste de l'utilisateur connecté, tenue à jour quand une autre partie du site la modifie. */
export default function useLibrary() {
  const { token, user } = useAuth();
  const [list, setList] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) {
      setList([]);
      return;
    }
    const unsubscribe = subscribeLibrary(setList);
    loadLibrary(token)
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setReady(true));
    return unsubscribe;
  }, [token, user]);

  const index = useMemo(() => libraryIndex(list), [list]);
  return { list, index, token, user, ready };
}

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase-firestore';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';

export function useCompetitionMode() {
  const [competitionMode, setCompetitionMode] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = doc(db, 'settings', 'global');
    const unsubscribe = onSnapshot(ref, (snapshot) => {
      const data = snapshot.data() as DocumentData | undefined;
      setCompetitionMode(data ? !!data.competitionMode : false);
      setLoading(false);
    }, () => setLoading(false));
    return unsubscribe;
  }, []);

  return { competitionMode, loading };
} 
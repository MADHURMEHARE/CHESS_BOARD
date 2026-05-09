import { useState, useEffect } from 'react';

interface Stats {
  players: number;
  tournaments: number;
  active: number;
}

type DbStatus = 'connected' | 'local';

export function useStats(dep: string) {
  const [stats, setStats] = useState<Stats>({ players: 0, tournaments: 0, active: 0 });
  const [dbStatus, setDbStatus] = useState<DbStatus>('local');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [pRes, tRes] = await Promise.all([
          fetch('/api/players'),
          fetch('/api/tournaments'),
        ]);

        const ct1 = pRes.headers.get('content-type');
        const ct2 = tRes.headers.get('content-type');

        if (!ct1?.includes('application/json') || !ct2?.includes('application/json')) {
          const text1 = await pRes.text();
          console.error('Non-JSON response from /api/players:', text1.slice(0, 100));
          throw new Error('SERVER_NOT_RETURNING_JSON');
        }

        const players = await pRes.json();
        const tournaments = await tRes.json();

        const playersArray = Array.isArray(players) ? players : [];
        const tournamentsArray = Array.isArray(tournaments) ? tournaments : [];

        setStats({
          players: playersArray.length,
          tournaments: tournamentsArray.length,
          active: tournamentsArray.filter((t: any) => t.status === 'active').length,
        });

        setDbStatus(pRes.headers.get('x-db-type') === 'neon' ? 'connected' : 'local');
      } catch (err) {
        console.error('Stats fetch error:', err);
      }
    };

    fetchStats();
  }, [dep]);

  return { stats, dbStatus };
}
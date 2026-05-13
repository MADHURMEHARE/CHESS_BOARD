import { useState, useEffect } from 'react';

interface Stats {
  players: number;
  tournaments: number;
  active: number;
}

type DbStatus =
  | 'connected'
  | 'local';

export function useStats(
  dep: string
) {

  const [stats, setStats] =
    useState<Stats>({
      players: 0,
      tournaments: 0,
      active: 0
    });

  const [dbStatus, setDbStatus] =
    useState<DbStatus>('local');

  useEffect(() => {

    const fetchStats =
      async () => {

      try {

        const API =
          import.meta.env
            .VITE_API_URL;

        const [pRes, tRes] =
          await Promise.all([

            fetch(
              `${API}/api/players`
            ),

            fetch(
              `${API}/api/tournaments`
            ),
          ]);

        const players =
          await pRes.json();

        const tournaments =
          await tRes.json();

        const playersArray =
          Array.isArray(players)
            ? players
            : [];

        const tournamentsArray =
          Array.isArray(tournaments)
            ? tournaments
            : [];

        setStats({
          players:
            playersArray.length,

          tournaments:
            tournamentsArray.length,

          active:
            tournamentsArray.filter(
              (t: any) =>
                t.status === 'active' ||
                t.status === 'pending'
            ).length,
        });

        setDbStatus(
          pRes.headers.get(
            'x-db-type'
          ) === 'neon'
            ? 'connected'
            : 'local'
        );

      } catch (err) {

        console.error(
          'Stats fetch error:',
          err
        );
      }
    };

    fetchStats();

  }, []);

  return {
    stats,
    dbStatus
  };
}
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  Target,
} from "lucide-react";

import DashboardCard from "../components/Dashboard";

export default function DashboardPage() {

  const navigate = useNavigate();

  const [stats, setStats] = useState({
    players: 0,
    tournaments: 0,
    active: 0,
  });

  useEffect(() => {

    const fetchStats = async () => {

      try {

        const API =
          import.meta.env.VITE_API_URL;

        const [
          pRes,
          tRes,
          activeRes,
        ] = await Promise.all([

          fetch(
            `${API}/api/players`
          ),

          fetch(
            `${API}/api/tournaments`
          ),

          fetch(
            `${API}/api/tournaments/active-count`
          ),
        ]);

        const players =
          await pRes.json();

        const tournaments =
          await tRes.json();

        const activeData =
          await activeRes.json();

        setStats({
          players:
            Array.isArray(players)
              ? players.length
              : 0,

          tournaments:
            Array.isArray(tournaments)
              ? tournaments.length
              : 0,

          active:
            activeData.activeCount || 0,
        });

      } catch (err) {

        console.error(
          "Stats fetch error:",
          err
        );
      }
    };

    fetchStats();

  }, []);

  return (
    <div className="space-y-8">

      {/* Header */}
      <header>
        <h1 className="text-4xl font-bold tracking-tighter uppercase italic">
          Grandmaster Control
        </h1>

        <p className="text-zinc-500 font-mono text-sm mt-2">
          v1.0.4 // SYSTEM_ACTIVE
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        <DashboardCard
          title="Total Players"
          value={stats.players.toString()}
          icon={
            <Users className="w-5 h-5" />
          }
        />

        <DashboardCard
          title="Total Tournaments"
          value={stats.tournaments.toString()}
          icon={
            <Target className="w-5 h-5" />
          }
          color="bg-emerald-500"
        />

      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        <div className="border border-zinc-800 bg-zinc-900/50 p-6 rounded-none">

          <div className="flex justify-between items-center mb-6">

            <h2 className="text-xl font-bold italic uppercase">
              Quick Actions
            </h2>

          </div>

          <div className="grid grid-cols-2 gap-4 mr-4">

            <button
              onClick={() =>
                navigate("/tournaments")
              }
              className="flex flex-col items-start p-4  hover:bg-zinc-700  border-l-2 border-orange-500 text-left"
            >

              <Plus className="w-5 h-5 mb-2" />

              <span className="font-bold text-sm uppercase ">
                New Tournament
              </span>

            </button>

            <button
              onClick={() =>
                navigate("/players")
              }
              className="flex flex-col items-start p-4  hover:bg-zinc-700 transition-colors border-l-2 border-emerald-500 text-left"
            >

              <Plus className="w-5 h-5 mb-2" />

              <span className="font-bold text-sm uppercase">
                Add Player
              </span>

            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
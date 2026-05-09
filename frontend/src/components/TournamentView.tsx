import React, { useState, useEffect } from 'react';
import { ChevronLeft, Play, Sword, Award, User, Target, Info, Users } from 'lucide-react';
import { motion } from 'motion/react';

import {
  useNavigate,
} from "react-router-dom";

interface Player {
  id: number;
  name: string;
  rating: number;
  points: number;
  is_disqualified: boolean;
}

interface Match {
  id: number;
  round: number;
  player1_id: number;
  player2_id: number;
  player1_name: string;
  player2_name: string;
  winner_id: number | null;
  winner_name: string | null;
  status: string;
}

interface TournamentDetail {
  id: number;
  name: string;
  status: string;
  players: Player[];
  matches: Match[];
}

export default function TournamentView({ id }: { id: number }) {
  const [tournament, setTournament] = useState<TournamentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const navigate = useNavigate();

  const fetchDetails = async () => {
    try {
      const res = await fetch(`/api/tournaments/${id}`);
      const data = await res.json();
      setTournament(data);
    } catch (error) {
      console.error('Error fetching tournament details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const res = await fetch(`/api/tournaments/${id}/simulate`, { method: 'POST' });
      if (res.ok) {
        await fetchDetails();
      }
    } catch (error) {
      console.error('Simulation error:', error);
    } finally {
      setSimulating(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-zinc-500 font-mono">LOADING_TOURNAMENT_INSTANCE...</div>;
  if (!tournament) return <div>Tournament not found.</div>;

  const matches = Array.isArray(tournament.matches) ? tournament.matches : [];
  const players = Array.isArray(tournament.players) ? tournament.players : [];

  const matchesByRound = matches.reduce((acc, m) => {
    acc[m.round] = acc[m.round] || [];
    acc[m.round].push(m);
    return acc;
  }, {} as Record<number, Match[]>);

  // Derive rankings
  const rankedPlayers = [...players].sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    return b.rating - a.rating;
  });

  return (
    <div className="space-y-16">
      <header className="flex justify-between items-start border-b-2 border-[#1A1A1A] pb-8">
        <div className="flex gap-8 items-center">
          <button 
            onClick={()=>navigate("/tournaments")}
            className="w-12 h-12 border-2 border-[#1A1A1A] flex items-center justify-center hover:bg-[#1A1A1A] hover:text-white transition-all transform hover:-translate-x-1"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-6xl font-serif font-black tracking-tighter uppercase italic leading-none">{tournament.name}</h1>
            <div className="flex gap-6 mt-4 items-center">
              <span className="text-xs font-mono font-bold text-[#1A1A1A]">INSTANCE: #{tournament.id}</span>
              <div className={`px-4 py-1 text-[10px] uppercase font-black tracking-widest ${
                tournament.status === 'completed' ? 'bg-[#B45309] text-white' : 'bg-[#1A1A1A] text-white'
              }`}>
                Circuit {tournament.status}
              </div>
            </div>
          </div>
        </div>

        {tournament.status === 'pending' && (
          <button 
            onClick={handleSimulate}
            disabled={simulating}
            className="bg-[#1A1A1A] text-white px-8 py-4 font-black uppercase text-xs tracking-[0.3em] flex items-center gap-3 hover:bg-[#B45309] transition-all shadow-[8px_8px_0_0_rgba(26,26,26,0.1)] disabled:opacity-50"
          >
            {simulating ? <Target className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
            Execute Circuit Simulation
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-16">
        {/* Leaderboard & Winners */}
        <div className="xl:col-span-1 space-y-12">
          <section>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-3 border-b border-[#1A1A1A] pb-1">
              <Award className="w-4 h-4 text-[#B45309]" />
              The Podium
            </h2>
            {tournament.status === 'completed' ? (
              <div className="space-y-4">
                <WinnerCard rank={1} player={rankedPlayers[0]} label="Gold Laurels" color="bg-[#B45309]" />
                <WinnerCard rank={2} player={rankedPlayers[1]} label="Silver Distinction" color="bg-[#1A1A1A]" />
                <WinnerCard rank={3} player={rankedPlayers[2]} label="Bronze Merit" color="bg-zinc-400" />
              </div>
            ) : (
              <div className="p-12 border-4 border-dashed border-[#1A1A1A]/10 text-center text-[#1A1A1A]/30 text-xs font-mono font-bold italic">
                AWAITING_ARENA_COMPLETION
              </div>
            )}
          </section>

          <section>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-3 border-b border-[#1A1A1A] pb-1">
              <Users className="w-4 h-4 text-[#B45309]" />
              The Roster
            </h2>
            <div className="border-2 border-[#1A1A1A] divide-y-2 divide-[#1A1A1A] bg-white">
              {rankedPlayers.map((player, idx) => (
                <div key={player.id} className="p-4 flex justify-between items-center group hover:bg-[#F8F7F2] transition-colors">
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-mono font-black text-[#1A1A1A]/30 group-hover:text-[#B45309] transition-colors">{idx + 1 < 10 ? `0${idx + 1}` : idx + 1}</span>
                    <span className={`text-sm font-black uppercase italic ${player.is_disqualified ? 'text-[#1A1A1A]/20 line-through' : 'text-[#1A1A1A]'}`}>
                      {player.name}
                    </span>
                  </div>
                  <div className="text-xs font-mono font-black text-[#B45309]">
                    {player.points} PT
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Match Brackets */}
        <div className="xl:col-span-3 space-y-20">
          {Object.keys(matchesByRound).length === 0 ? (
            <div className="h-96 flex flex-col items-center justify-center border-4 border-dashed border-[#1A1A1A]/10 bg-[#F8F7F2]/30 text-[#1A1A1A]/30 font-mono italic font-bold">
              <Sword className="w-12 h-12 mb-6 opacity-10" />
              IN_STASIS // GENERATE_SEQUENCE
            </div>
          ) : (
            <div className="space-y-24">
              {[1, 2, 3, 4].map(round => (
                <section key={round}>
                  <div className="flex items-center gap-6 mb-8">
                    <h2 className="text-xs font-black uppercase text-[#1A1A1A] tracking-[0.4em] whitespace-nowrap bg-white px-2 py-1 border-2 border-[#1A1A1A]">
                      {round === 3 ? 'Semi-Final Stage' : round === 4 ? 'The Grand Final' : `Elimination Round 0${round}`}
                    </h2>
                    <div className="h-0.5 flex-1 bg-[#1A1A1A]/10"></div>
                    <div className="text-[10px] font-mono font-bold text-[#1A1A1A]/30 uppercase tracking-widest leading-none">Phase_Index_{round}</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {matchesByRound[round]?.map(match => (
                      <div key={match.id} className="relative">
                        <MatchCard match={match} />
                        {round < 4 && (
                          <div className="hidden lg:block absolute -right-4 top-1/2 w-4 h-0.5 bg-[#1A1A1A]/10 z-0"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WinnerCard({ rank, player, label, color }: { rank: number, player: Player, label: string, color: string }) {
  return (
    <div className="relative border-b-8 border-r-8 border-[#1A1A1A] bg-white overflow-hidden group hover:-translate-y-1 transition-all">
      <div className={`absolute left-0 top-0 bottom-0 w-2 ${color}`}></div>
      <div className="p-6 flex items-center justify-between">
        <div className="relative z-10">
          <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[#1A1A1A]/40 mb-2">{label}</div>
          <div className="text-2xl font-serif font-black uppercase italic tracking-tighter leading-none">{player.name}</div>
        </div>
        <div className="text-5xl font-serif font-black italic text-[#1A1A1A]/[0.05] group-hover:text-[#1A1A1A]/10 transition-colors absolute -right-2 top-0 pointer-events-none">
          {rank}
        </div>
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: Match }) {
  return (
    <div className="border-2 border-[#1A1A1A] bg-white hover:shadow-[12px_12px_0_0_rgba(26,26,26,0.05)] transition-all p-6 space-y-4 relative group cursor-default">
      <div className="flex flex-col gap-3 relative z-10">
        <div className={`flex justify-between items-center px-4 py-3 border-l-4 transition-all ${match.winner_id === match.player1_id ? 'border-[#B45309] bg-[#F8F7F2]' : 'border-zinc-100 bg-transparent'}`}>
          <span className={`text-[11px] font-black uppercase italic tracking-tight ${match.winner_id === match.player1_id ? 'text-[#1A1A1A]' : 'text-zinc-300'}`}>
            {match.player1_name}
          </span>
          {match.winner_id === match.player1_id && <div className="w-2 h-2 bg-[#B45309] rounded-full" />}
        </div>
        <div className="flex justify-center text-[9px] font-mono font-bold text-zinc-200 uppercase tracking-[0.5em] py-1">VS</div>
        <div className={`flex justify-between items-center px-4 py-3 border-l-4 transition-all ${match.winner_id === match.player2_id ? 'border-[#B45309] bg-[#F8F7F2]' : 'border-zinc-100 bg-transparent'}`}>
          <span className={`text-[11px] font-black uppercase italic tracking-tight ${match.winner_id === match.player2_id ? 'text-[#1A1A1A]' : 'text-zinc-300'}`}>
            {match.player2_name}
          </span>
          {match.winner_id === match.player2_id && <div className="w-2 h-2 bg-[#B45309] rounded-full" />}
        </div>
      </div>
      
      <div className="pt-4 border-t border-[#1A1A1A]/5 flex justify-between items-center">
        <span className="text-[9px] font-mono font-bold text-[#1A1A1A]/30 uppercase">Arena_LOG_{match.id}</span>
        <div className={`text-[9px] font-black uppercase px-2 py-0.5 tracking-widest ${match.status === 'completed' ? 'text-[#B45309] border border-[#B45309]' : 'text-zinc-400 border border-zinc-200'}`}>
          {match.status}
        </div>
      </div>
    </div>
  );
}

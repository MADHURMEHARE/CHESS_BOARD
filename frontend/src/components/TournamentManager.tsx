import React, { useState, useEffect } from 'react';
import { Plus, ChevronRight, Users, X, Trophy, Crown, Clock, Sword, Loader2 } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';

const API = import.meta.env.VITE_API_URL;

interface Tournament {
  id: number;
  name: string;
  status: string;
  created_at: string;
}

interface Player {
  id: number;
  name: string;
  rating: number;
}

interface Match {
  id: string;
  round: number;
  position: number;
  player1: Player | null;
  player2: Player | null;
  winner: Player | null;
}

// ── Bracket builder for 10 players ──
function buildBracket(players: Player[]): Match[][] {
  const s = [...players];
  const round1: Match[] = [];
  for (let i = 0; i < 8; i++) {
    if (i < 3) {
      const p = s[i] || null;
      round1.push({ id: `R1-${i}`, round: 1, position: i, player1: p, player2: null, winner: p });
    } else if (i === 3) {
      round1.push({ id: `R1-${i}`, round: 1, position: i, player1: s[3], player2: s[9], winner: null });
    } else if (i === 4) {
      round1.push({ id: `R1-${i}`, round: 1, position: i, player1: s[4], player2: s[8], winner: null });
    } else if (i === 5) {
      round1.push({ id: `R1-${i}`, round: 1, position: i, player1: s[5], player2: s[7], winner: null });
    } else if (i === 6) {
      const p = s[6];
      round1.push({ id: `R1-${i}`, round: 1, position: i, player1: p, player2: null, winner: p });
    } else {
      round1.push({ id: `R1-${i}`, round: 1, position: i, player1: null, player2: null, winner: null });
    }
  }
  const round2: Match[] = Array.from({ length: 4 }, (_, i) => ({
    id: `R2-${i}`, round: 2, position: i,
    player1: round1[i * 2].winner, player2: round1[i * 2 + 1].winner, winner: null,
  }));
  const round3: Match[] = Array.from({ length: 2 }, (_, i) => ({
    id: `R3-${i}`, round: 3, position: i,
    player1: round2[i * 2].winner, player2: round2[i * 2 + 1].winner, winner: null,
  }));
  const round4: Match[] = [{
    id: 'R4-0', round: 4, position: 0,
    player1: round3[0].winner, player2: round3[1].winner, winner: null,
  }];
  return [round1, round2, round3, round4];
}

function propagateWinners(rounds: Match[][]): Match[][] {
  const u = rounds.map(r => r.map(m => ({ ...m })));
  for (let r = 0; r < u.length - 1; r++) {
    for (let i = 0; i < u[r + 1].length; i++) {
      u[r + 1][i].player1 = u[r][i * 2].winner;
      u[r + 1][i].player2 = u[r][i * 2 + 1].winner;
      if (!u[r + 1][i].player1 && !u[r + 1][i].player2) u[r + 1][i].winner = null;
    }
  }
  return u;
}

const ROUND_LABELS = ['Round 1', 'Quarter-Finals', 'Semi-Finals', 'Final'];

interface ServerMatchRow {
  id: number;
  round: number;
  player1_name: string;
  player2_name: string;
  winner_name: string | null;
}

interface PodiumRow {
  place: number;
  name: string;
}

interface ServerExpandPayload {
  matches: ServerMatchRow[];
  rankings: PodiumRow[] | null;
}

/** Read-only circuit log when matches already exist on the server (e.g. after simulation). */
function ExpandedServerCircuit({
  matches,
  rankings,
  onOpenFull,
}: {
  matches: ServerMatchRow[];
  rankings: PodiumRow[] | null;
  onOpenFull: () => void;
}) {
  const byRound = matches.reduce((acc, m) => {
    acc[m.round] = acc[m.round] || [];
    acc[m.round].push(m);
    return acc;
  }, {} as Record<number, ServerMatchRow[]>);

  return (
    <div className="space-y-6">
      <p className="text-[9px] font-mono uppercase tracking-widest text-[#1A1A1A]/40">
        Results from server simulation - interactive tree is for events not yet run on the API.
      </p>
      {rankings && rankings.length >= 1 && (
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-mono uppercase tracking-widest text-[#1A1A1A]/80 border-b border-[#1A1A1A]/10 pb-4">
          {rankings.slice(0, 3).map((r) => (
            <span key={r.place}>
              <span className="text-[#B45309] font-black">{r.place}</span>
              {' — '}
              {r.name}
            </span>
          ))}
        </div>
      )}
      {[1, 2, 3, 4].map((rn) => (
        <div key={rn}>
          <div className="text-[9px] font-mono font-bold uppercase tracking-[0.35em] text-[#1A1A1A]/40 mb-2">
            {ROUND_LABELS[rn - 1]}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(byRound[rn] || []).map((m) => (
              <div
                key={m.id}
                className="border-2 border-[#1A1A1A] bg-white p-3 text-[10px] font-black uppercase italic shadow-[3px_3px_0_0_#1A1A1A]"
              >
                <div className="flex justify-between gap-2 items-center">
                  <span className={m.winner_name === m.player1_name ? 'text-[#1A1A1A]' : 'text-[#1A1A1A]/30'}>
                    {m.player1_name}
                  </span>
                  <span className="text-[8px] font-mono text-[#1A1A1A]/30 shrink-0 not-italic">VS</span>
                  <span className={m.winner_name === m.player2_name ? 'text-[#1A1A1A]' : 'text-[#1A1A1A]/30'}>
                    {m.player2_name}
                  </span>
                </div>
                {m.winner_name && (
                  <p className="mt-2 text-[8px] font-mono text-[#1A1A1A]/50 normal-case not-italic tracking-widest">
                    Winner: <span className="text-[#B45309] font-bold">{m.winner_name}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={onOpenFull}
        className="text-[10px] font-black uppercase tracking-widest text-[#B45309] underline underline-offset-4"
      >
        Open full tournament page
      </button>
    </div>
  );
}

// ── Match Card ──
function MatchCard({ match, onSelectWinner, isFinal }: {
  match: Match;
  onSelectWinner?: (matchId: string, winner: Player) => void;
  isFinal?: boolean;
}) {
  const isBye = match.player2 === null && match.player1 !== null;
  const bothEmpty = !match.player1 && !match.player2;

  if (bothEmpty) {
    return (
      <div className={`border-2 border-dashed border-[#1A1A1A]/10 ${isFinal ? 'w-52' : 'w-44'} bg-transparent`}>
        <div className="p-3 text-[9px] font-mono text-[#1A1A1A]/20 uppercase tracking-widest text-center">TBD</div>
      </div>
    );
  }

  const PlayerRow = ({ player, isWinner }: { player: Player | null; isWinner: boolean }) => {
    if (!player) return (
      <div className="px-3 py-2.5 text-[9px] font-mono text-[#1A1A1A]/20 uppercase">— BYE —</div>
    );
    return (
      <button
        onClick={() => !match.winner && !isBye && onSelectWinner?.(match.id, player)}
        disabled={!!match.winner || isBye}
        className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 transition-all group
          ${isWinner ? 'bg-[#1A1A1A] text-white' : ''}
          ${!match.winner && !isBye ? 'hover:bg-[#B45309] hover:text-white cursor-pointer' : ''}
          ${match.winner && !isWinner ? 'opacity-30' : ''}
        `}
      >
        <span className="text-[10px] font-black uppercase tracking-tight truncate">{player.name}</span>
        <span className={`text-[8px] font-mono shrink-0 ${isWinner ? 'text-white/60' : 'text-[#1A1A1A]/40 group-hover:text-white/60'}`}>{player.rating}</span>
      </button>
    );
  };

  return (
    <div className={`border-2 border-[#1A1A1A] overflow-hidden ${isFinal ? 'w-52' : 'w-44'} bg-white shadow-[3px_3px_0_0_#1A1A1A]`}>
      {isBye && (
        <div className="px-3 py-1 bg-[#1A1A1A]/5 text-[8px] font-mono text-[#1A1A1A]/40 uppercase tracking-widest border-b border-[#1A1A1A]/10">
          Auto-advance
        </div>
      )}
      <PlayerRow player={match.player1} isWinner={match.winner?.id === match.player1?.id} />
      <div className="h-[1px] bg-[#1A1A1A]/10 mx-3" />
      <PlayerRow player={match.player2} isWinner={match.winner?.id === match.player2?.id} />
    </div>
  );
}

// ── SVG Connectors ──
function Connectors({ matchCount }: { matchCount: number }) {
  const matchH = 74, gapH = 24, unitH = matchH + gapH, pairH = unitH * 2;
  const totalH = matchCount * unitH;
  return (
    <svg width="40" height={totalH} className="shrink-0 self-start mt-0">
      {Array.from({ length: matchCount / 2 }).map((_, i) => {
        const top1 = i * pairH + matchH / 2;
        const top2 = i * pairH + matchH + gapH + matchH / 2;
        const midY = (top1 + top2) / 2;
        return (
          <g key={i}>
            <line x1="0" y1={top1} x2="20" y2={top1} stroke="#1A1A1A" strokeWidth="1.5" opacity="0.2" />
            <line x1="0" y1={top2} x2="20" y2={top2} stroke="#1A1A1A" strokeWidth="1.5" opacity="0.2" />
            <line x1="20" y1={top1} x2="20" y2={top2} stroke="#1A1A1A" strokeWidth="1.5" opacity="0.2" />
            <line x1="20" y1={midY} x2="40" y2={midY} stroke="#1A1A1A" strokeWidth="1.5" opacity="0.2" />
          </g>
        );
      })}
    </svg>
  );
}

// ── Inline Bracket Tree ──
function BracketTree({ rounds, champion, onSelectWinner }: {
  rounds: Match[][];
  champion: Player | null;
  onSelectWinner: (matchId: string, winner: Player) => void;
}) {
  return (
    <div className="space-y-4">
      <AnimatePresence>
        {champion && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1A1A1A] text-white p-5 flex items-center gap-4 border-4 border-[#B45309] shadow-[6px_6px_0_0_#B45309]"
          >
            <Trophy size={28} className="text-[#B45309] shrink-0" />
            <div>
              <p className="text-[9px] font-mono uppercase tracking-[0.4em] text-white/40">Champion</p>
              <h3 className="text-2xl font-serif font-black italic">{champion.name}</h3>
              <p className="text-[10px] font-mono text-white/40">Rating: {champion.rating}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto pb-4">
        <div className="flex items-start gap-0 min-w-max">
          {rounds.map((round, rIdx) => (
            <React.Fragment key={rIdx}>
              <div className="flex flex-col">
                <div className="mb-3 px-2">
                  <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#1A1A1A]/40 font-bold">
                    {ROUND_LABELS[rIdx]}
                  </span>
                </div>
                <div
                  className="flex flex-col"
                  style={{ gap: rIdx === 0 ? '6px' : `${(Math.pow(2, rIdx) - 1) * 74 + (Math.pow(2, rIdx) - 1) * 6}px` }}
                >
                  {round.map((match) => (
                    <div
                      key={match.id}
                      style={rIdx > 0 ? { marginTop: `${(Math.pow(2, rIdx - 1) - 0.5) * 80}px` } : {}}
                    >
                      <MatchCard
                        match={match}
                        onSelectWinner={onSelectWinner}
                        isFinal={rIdx === 3}
                      />
                    </div>
                  ))}
                </div>
              </div>
              {rIdx < rounds.length - 1 && (
                <div className="mt-9 self-start">
                  <Connectors matchCount={round.length} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {!champion && (
          <p className="text-[9px] font-mono uppercase tracking-widest text-[#1A1A1A]/30 mt-6 pt-4 border-t border-[#1A1A1A]/10">
            Click a player to pick the winner · Winners auto-advance
          </p>
        )}
      </div>
    </div>
  );
}

// ── Local bracket state per tournament ──
interface LocalBracket {
  rounds: Match[][];
  champion: Player | null;
}

export default function TournamentManager() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // bracket state: keyed by tournament id
  const [brackets, setBrackets] = useState<Record<number, LocalBracket>>({});
  /** Server-backed match log when the API already has rounds (e.g. simulated). */
  const [serverExpand, setServerExpand] = useState<Record<number, ServerExpandPayload>>({});
  const [bracketLoadingId, setBracketLoadingId] = useState<number | null>(null);
  const [expandError, setExpandError] = useState<Record<number, string>>({});
  // which tournament's bracket is expanded
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [tRes, pRes] = await Promise.all([
        fetch(`${API}/api/tournaments`),
        fetch(`${API}/api/players`),
      ]);
      const tData = await tRes.json();
      const pData = await pRes.json();
      setTournaments(Array.isArray(tData) ? tData : []);
      setAvailablePlayers(Array.isArray(pData) ? pData : []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const togglePlayer = (id: number) => {
    setSelectedPlayerIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : prev.length < 10 ? [...prev, id] : prev
    );
  };

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selectedPlayerIds.length !== 10) {
      alert("Please enter a name and select exactly 10 players.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/tournaments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, playerIds: selectedPlayerIds }),
      });
      if (res.ok) {
        const created = await res.json(); // expect { id, name, status, created_at }
        const players = selectedPlayerIds.map(id => availablePlayers.find(p => p.id === id)!);
        const newId = created.id ?? Date.now();

        // Build local bracket immediately
        const rounds = buildBracket(players);
        setBrackets(prev => ({ ...prev, [newId]: { rounds, champion: null } }));
        setExpandedId(newId);

        setShowAddForm(false);
        setName('');
        setSelectedPlayerIds([]);
        fetchData();
      }
    } catch (err) {
      console.error('Error creating tournament:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectWinner = (tId: number, matchId: string, winner: Player) => {
    setBrackets(prev => {
      const b = prev[tId];
      if (!b) return prev;
      const updatedRounds = propagateWinners(
        b.rounds.map(round => round.map(m => m.id === matchId ? { ...m, winner } : m))
      );
      const finalWinner = updatedRounds[3][0].winner;
      return { ...prev, [tId]: { rounds: updatedRounds, champion: finalWinner } };
    });
  };

  const hydrateExpandPanel = async (tId: number) => {
    setBracketLoadingId(tId);
    setExpandError((prev) => {
      const next = { ...prev };
      delete next[tId];
      return next;
    });
    try {
      const res = await fetch(`${API}/api/tournaments/${tId}`);
      const data = await res.json();
      if (!res.ok) {
        setExpandError((prev) => ({
          ...prev,
          [tId]: typeof data?.error === 'string' ? data.error : 'Failed to load tournament',
        }));
        return;
      }

      const rawPlayers = Array.isArray(data.players) ? data.players : [];
      const players: Player[] = rawPlayers
        .map((p: { id: number; name: string; rating?: number }) => ({
          id: p.id,
          name: p.name,
          rating: p.rating ?? 1200,
        }))
        .sort((a, b) => a.id - b.id);

      if (players.length !== 10) {
        setExpandError((prev) => ({
          ...prev,
          [tId]: `Bracket needs 10 players (found ${players.length}).`,
        }));
        return;
      }

      const matchesRaw = Array.isArray(data.matches) ? data.matches : [];
      const serverMatches: ServerMatchRow[] = matchesRaw.map(
        (m: {
          id: number;
          round: number;
          player1_name: string;
          player2_name: string;
          winner_name: string | null;
        }) => ({
          id: m.id,
          round: m.round,
          player1_name: m.player1_name,
          player2_name: m.player2_name,
          winner_name: m.winner_name,
        })
      );

      if (serverMatches.length > 0) {
        setBrackets((prev) => {
          const next = { ...prev };
          delete next[tId];
          return next;
        });
        const rankingsRaw = data.rankings;
        const rankings: PodiumRow[] | null = Array.isArray(rankingsRaw)
          ? rankingsRaw.map((r: { place: number; name: string }) => ({
              place: r.place,
              name: r.name,
            }))
          : null;
        setServerExpand((prev) => ({
          ...prev,
          [tId]: { matches: serverMatches, rankings },
        }));
      } else {
        setServerExpand((prev) => {
          const next = { ...prev };
          delete next[tId];
          return next;
        });
        const rounds = buildBracket(players);
        setBrackets((prev) => ({ ...prev, [tId]: { rounds, champion: null } }));
      }
    } catch {
      setExpandError((prev) => ({
        ...prev,
        [tId]: 'Network error while loading bracket.',
      }));
    } finally {
      setBracketLoadingId(null);
    }
  };

  const toggleExpand = (tId: number) => {
    if (expandedId === tId) {
      setExpandedId(null);
      return;
    }
    const row = tournaments.find((x) => x.id === tId);
    setExpandedId(tId);
    if (!serverExpand[tId] && (!brackets[tId] || row?.status === 'completed')) {
      void hydrateExpandPanel(tId);
    }
  };

  return (
    <div className="space-y-10">
      {/* ── Header ── */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b-2 border-[#1A1A1A] pb-6 gap-4">
        <div>
          <h1 className="text-5xl md:text-6xl font-serif font-black tracking-tighter uppercase italic leading-none">The Arena</h1>
          <p className="text-[#1A1A1A]/50 font-mono text-[10px] mt-2 uppercase tracking-widest font-bold">
            Tournament Log // {tournaments.length} Circuit{tournaments.length !== 1 ? 's' : ''} Active
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(v => !v)}
          className="flex items-center gap-2 bg-[#1A1A1A] text-white px-7 py-3 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#B45309] transition-colors shadow-[4px_4px_0_0_#B45309]"
        >
          <Plus size={13} />
          {showAddForm ? 'Abort' : 'New Tournament'}
        </button>
      </header>

      {/* ── Create Form ── */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-[#F8F7F2] border-4 border-[#1A1A1A] p-8 md:p-10 relative"
          >
            <button
              onClick={() => setShowAddForm(false)}
              className="absolute top-4 right-4 w-8 h-8 border-2 border-[#1A1A1A]/20 flex items-center justify-center hover:bg-[#1A1A1A] hover:text-white transition-all"
            >
              <X size={13} />
            </button>

            <form onSubmit={handleCreateTournament} className="space-y-8">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-[#1A1A1A]/40 tracking-widest">Arena Designation</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-white border-2 border-[#1A1A1A] px-5 py-4 focus:outline-none font-serif text-2xl italic font-black placeholder:text-[#1A1A1A]/20"
                  placeholder="The Autumn Open…"
                />
              </div>

              {/* Players */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-black text-[#1A1A1A]/40 tracking-widest flex items-center gap-2">
                    <Users size={11} /> Select 10 Players
                  </label>
                  <span className={`text-[10px] font-black font-mono ${selectedPlayerIds.length === 10 ? 'text-[#B45309]' : 'text-[#1A1A1A]/40'}`}>
                    {selectedPlayerIds.length} / 10
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {availablePlayers.map(player => {
                    const isSelected = selectedPlayerIds.includes(player.id);
                    const isDisabled = !isSelected && selectedPlayerIds.length === 10;
                    return (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => togglePlayer(player.id)}
                        disabled={isDisabled}
                        className={`flex flex-col gap-1.5 p-3.5 border-2 text-left transition-all
                          ${isSelected
                            ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white'
                            : isDisabled
                              ? 'border-[#1A1A1A]/5 text-[#1A1A1A]/20 cursor-not-allowed bg-white'
                              : 'bg-white border-[#1A1A1A]/15 text-[#1A1A1A]/60 hover:border-[#1A1A1A] hover:text-[#1A1A1A]'}
                        `}
                      >
                        <span className="text-[10px] font-black uppercase tracking-tight leading-tight">{player.name}</span>
                        <span className="text-[9px] font-mono opacity-60">{player.rating}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={selectedPlayerIds.length !== 10 || !name.trim() || submitting}
                className={`w-full h-14 font-black uppercase text-xs tracking-[0.3em] transition-all
                  ${selectedPlayerIds.length === 10 && name.trim() && !submitting
                    ? 'bg-[#1A1A1A] text-white shadow-[6px_6px_0_0_#B45309] hover:-translate-y-0.5 hover:shadow-[8px_8px_0_0_#B45309]'
                    : 'bg-[#1A1A1A]/10 text-[#1A1A1A]/30 cursor-not-allowed'}
                `}
              >
                {submitting ? 'Deploying…' : 'Execute Deployment — Generate Bracket'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tournament List ── */}
      {loading ? (
        <div className="p-20 text-center text-[#1A1A1A] font-mono font-bold animate-pulse text-sm">
          STREAMING_CIRCUIT_DATA...
        </div>
      ) : tournaments.length === 0 ? (
        <div className="p-20 text-center text-[#1A1A1A]/40 font-mono text-sm border-2 border-dashed border-[#1A1A1A]">
          ZERO_RECORDS_AVAILABLE
        </div>
      ) : (
        <div className="space-y-4">
          {tournaments.map(t => {
            const bracket = brackets[t.id];
            const serverSnap = serverExpand[t.id];
            const isExpanded = expandedId === t.id;
            const championLabel =
              bracket?.champion?.name ??
              serverSnap?.rankings?.find((r) => r.place === 1)?.name ??
              null;

            return (
              <motion.div
                key={t.id}
                layout
                className="border-4 border-[#1A1A1A] bg-white overflow-hidden"
              >
                {/* ── Tournament Row (always visible) ── */}
                <div
                  onClick={() => toggleExpand(t.id)}
                  className="p-6 md:p-8 flex items-center justify-between cursor-pointer hover:bg-[#F8F7F2] transition-colors group"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest
                        ${t.status === 'completed' ? 'bg-[#B45309] text-white' : 'bg-[#1A1A1A] text-white'}`}
                      >
                        {t.status}
                      </div>
                      {championLabel && (
                        <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#B45309] font-bold">
                          <Crown size={10} /> {championLabel}
                        </div>
                      )}
                      <span className="text-[10px] font-mono opacity-30 italic flex items-center gap-1">
                        <Clock size={9} /> {new Date(t.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-serif font-black uppercase italic tracking-tighter text-2xl md:text-3xl leading-none">
                      {t.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* View full page */}
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/tournaments/${t.id}`); }}
                      className="hidden sm:flex items-center gap-1.5 border-2 border-[#1A1A1A]/15 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest hover:border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-all"
                    >
                      excute Mathes <ChevronRight size={10} />
                    </button>
                    {/* Expand toggle */}
                    <div
  className={`w-8 h-8 border-2 border-[#1A1A1A]/20 flex items-center justify-center transition-all group-hover:border-[#1A1A1A]
    ${isExpanded ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : ''}
  `}
>
  <motion.div
    animate={{ rotate: isExpanded ? 90 : 0 }}
    transition={{ duration: 0.2 }}
  >
    <ChevronRight
      size={14}
      className={isExpanded ? 'text-white' : ''}
    />
  </motion.div>
</div>

<span className="ml-2">Matches List</span>
                  </div>
                </div>

                {/* ── Bracket Tree (expanded) ── */}
                <AnimatePresence>
                  {isExpanded && bracketLoadingId === t.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t-2 border-[#1A1A1A]/10 bg-[#F8F7F2] px-8 py-12 flex flex-col items-center gap-4"
                    >
                      <Loader2 size={28} className="text-[#B45309] animate-spin" />
                      <p className="text-[10px] font-mono uppercase tracking-widest text-[#1A1A1A]/40">
                        Loading bracket…
                      </p>
                    </motion.div>
                  )}
                  {isExpanded && bracketLoadingId !== t.id && serverSnap && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t-2 border-[#1A1A1A]/10 bg-[#F8F7F2] px-6 md:px-8 py-6 overflow-hidden"
                    >
                      <ExpandedServerCircuit
                        matches={serverSnap.matches}
                        rankings={serverSnap.rankings}
                        onOpenFull={() => navigate(`/tournaments/${t.id}`)}
                      />
                    </motion.div>
                  )}
                  {isExpanded && bracketLoadingId !== t.id && bracket && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="border-t-2 border-[#1A1A1A]/10 bg-[#F8F7F2] px-6 md:px-8 py-6 overflow-hidden"
                    >
                      <BracketTree
                        rounds={bracket.rounds}
                        champion={bracket.champion}
                        onSelectWinner={(matchId, winner) => handleSelectWinner(t.id, matchId, winner)}
                      />
                    </motion.div>
                  )}
                  {isExpanded && bracketLoadingId !== t.id && !bracket && !serverSnap && expandError[t.id] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t-2 border-[#1A1A1A]/10 bg-[#F8F7F2] px-8 py-8 text-center"
                    >
                      <div className="flex flex-col items-center gap-4">
                        <Sword size={24} className="text-[#1A1A1A]/20" />
                        <p className="text-[10px] font-mono uppercase tracking-widest text-[#1A1A1A]/40 max-w-md">
                          {expandError[t.id]}
                        </p>
                        <button
                          type="button"
                          onClick={() => void hydrateExpandPanel(t.id)}
                          className="text-[10px] font-black uppercase tracking-widest text-[#B45309] underline underline-offset-4"
                        >
                          Retry
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/tournaments/${t.id}`)}
                          className="text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/50 underline underline-offset-4"
                        >
                          Open full page
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
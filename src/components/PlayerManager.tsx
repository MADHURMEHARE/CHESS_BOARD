import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, UserPlus, Shield } from 'lucide-react';

interface Player {
  id: number;
  name: string;
  rating: number;
  wins: number;
  losses: number;
}

export default function PlayerManager() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRating, setNewRating] = useState('1200');

  const fetchPlayers = async () => {
    try {
      const res = await fetch('/api/players');
      const data = await res.json();
      setPlayers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, rating: parseInt(newRating) })
      });
      if (res.ok) {
        setNewName('');
        setNewRating('1200');
        setShowAddForm(false);
        fetchPlayers();
      }
    } catch (error) {
      console.error('Error adding player:', error);
    }
  };

  return (
    <div className="space-y-12">
      <header className="flex justify-between items-end border-b-2 border-[#1A1A1A] pb-6">
        <div>
          <h1 className="text-6xl font-serif font-black tracking-tighter uppercase italic leading-none">Registrar</h1>
          <p className="text-[#1A1A1A]/60 font-mono text-xs mt-3 uppercase tracking-widest font-bold">Player Database // Indexation Alpha</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-[#1A1A1A] text-white px-8 py-3 text-xs font-black uppercase tracking-[0.2em] hover:bg-[#B45309] transition-colors"
        >
          {showAddForm ? 'Close Entry' : 'Manual Enrollment'}
        </button>
      </header>

      {showAddForm && (
        <div className="bg-[#F8F7F2] border-4 border-[#1A1A1A] p-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleAddPlayer} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] uppercase font-black tracking-widest text-[#1A1A1A]/50">Candidate Name</label>
              <input 
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-white border-2 border-[#1A1A1A] px-4 py-3 focus:outline-none font-bold"
                placeholder="Last, First"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] uppercase font-black tracking-widest text-[#1A1A1A]/50">Opening Rating</label>
              <input 
                type="number" 
                value={newRating}
                onChange={(e) => setNewRating(e.target.value)}
                className="w-full bg-white border-2 border-[#1A1A1A] px-4 py-3 focus:outline-none font-mono font-bold"
              />
            </div>
            <div className="flex items-end">
              <button 
                type="submit"
                className="w-full bg-[#B45309] text-white h-[52px] font-black uppercase text-xs tracking-widest hover:bg-[#1A1A1A] transition-colors"
              >
                Execute Enrollment
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="border-4 border-[#1A1A1A] bg-white">
        <div className="grid grid-cols-5 p-5 bg-[#1A1A1A] text-[10px] font-black uppercase tracking-[0.2em] text-white/60">
          <div className="col-span-2">Designation</div>
          <div>Efficiency</div>
          <div>Record (W/L)</div>
          <div className="text-right">Tier</div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-[#1A1A1A] font-mono text-sm font-bold animate-pulse">SYNCHRONIZING_RECORDS...</div>
        ) : players.length === 0 ? (
          <div className="p-16 text-center text-[#1A1A1A]/40 font-mono text-sm">ARCHIVE_EMPTY</div>
        ) : (
          <div className="divide-y-2 divide-[#1A1A1A]">
            {players.map((player) => (
              <div key={player.id} className="grid grid-cols-5 p-6 hover:bg-[#F8F7F2] transition-colors group">
                <div className="col-span-2 flex items-center gap-6">
                  <div className="text-2xl font-serif font-black italic opacity-20 group-hover:opacity-100 transition-opacity">
                    {player.id < 10 ? `0${player.id}` : player.id}
                  </div>
                  <span className="font-black text-xl tracking-tighter uppercase italic font-serif text-[#1A1A1A]">{player.name}</span>
                </div>
                <div className="flex items-center font-mono font-bold text-xl text-[#B45309]">{player.rating}</div>
                <div className="flex items-center text-xs font-mono font-black text-[#1A1A1A]/40">
                  {player.wins} — {player.losses}
                </div>
                <div className="flex justify-end items-center">
                  <div className={`px-3 py-1 text-[10px] uppercase font-black tracking-widest ${player.rating > 2000 ? 'bg-[#1A1A1A] text-white' : 'border border-[#1A1A1A]'}`}>
                    {player.rating > 2000 ? 'Grandmaster' : 'Candidate'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Plus, Trophy, ChevronRight, Activity, Calendar } from 'lucide-react';
import { useNavigate } from "react-router-dom";
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

export default function TournamentManager() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
const navigate = useNavigate();
  const fetchData = async () => {
    try {
      const [tRes, pRes] = await Promise.all([
        fetch('/api/tournaments'),
        fetch('/api/players')
      ]);
      const tData = await tRes.json();
      const pData = await pRes.json();
      setTournaments(Array.isArray(tData) ? tData : []);
      setAvailablePlayers(Array.isArray(pData) ? pData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTournament = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating tournament with name:', name, 'and player IDs:', selectedPlayerIds);
    if (!name.trim() || selectedPlayerIds.length < 10) {
      alert("Please enter a name and select exactly 10 players.");
      return;
    }

    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, playerIds: selectedPlayerIds.slice(0, 10) })
      });
      if (res.ok) {
        setShowAddForm(false);
        setName('');
        setSelectedPlayerIds([]);
        fetchData();
      }
    } catch (error) {
      console.error('Error creating tournament:', error);
    }
  };

  const togglePlayer = (id: number) => {
    setSelectedPlayerIds(prev => 
      prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-12">
      <header className="flex justify-between items-end border-b-2 border-[#1A1A1A] pb-6">
        <div>
          <h1 className="text-6xl font-serif font-black tracking-tighter uppercase italic leading-none">The Arena</h1>
          <p className="text-[#1A1A1A]/60 font-mono text-xs mt-3 uppercase tracking-widest font-bold">Tournament Log // Circuit Queue 2024</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-[#1A1A1A] text-white px-8 py-3 text-xs font-black uppercase tracking-[0.2em] hover:bg-[#B45309] transition-colors"
        >
          {showAddForm ? 'Abort Initialization' : 'Open Phase One'}
        </button>
      </header>

      {showAddForm && (
        <div className="bg-[#F8F7F2] border-4 border-[#1A1A1A] p-10 animate-in fade-in slide-in-from-top-4 duration-300">
          <form onSubmit={handleCreateTournament} className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-3">
                <label className="text-[10px] uppercase font-black text-[#1A1A1A]/50 tracking-widest">Arena Designation</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border-2 border-[#1A1A1A] px-5 py-4 focus:outline-none font-serif text-2xl italic font-black"
                  placeholder="The Autumn Open..."
                />
              </div>
              <div className="flex items-end text-[10px] font-black uppercase text-[#1A1A1A]/60 font-mono">
                Participants: <span className="text-[#B45309] ml-2">{selectedPlayerIds.length} / 10 required</span>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] uppercase font-black text-[#1A1A1A]/50 tracking-widest block">Available Grandmasters</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {availablePlayers.map(player => (
                  <label 
                    key={player.id} 
                    className={`flex flex-col gap-2 p-4 border-2 cursor-pointer transition-all ${
                      selectedPlayerIds.includes(player.id) 
                        ? 'bg-[#1A1A1A] border-[#1A1A1A] text-white' 
                        : 'bg-white border-[#1A1A1A]/10 text-[#1A1A1A]/40 hover:border-[#1A1A1A]'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={selectedPlayerIds.includes(player.id)}
                      onChange={() => togglePlayer(player.id)}
                    />
                    <div className="text-[10px] font-black uppercase tracking-tighter truncate leading-none">{player.name}</div>
                    <div className="text-[9px] font-mono opacity-60 font-bold">{player.rating}</div>
                  </label>
                ))}
              </div>
            </div>

            <button 
              type="submit"
              disabled={selectedPlayerIds.length < 10}
              className={`w-full h-16 font-black uppercase text-sm tracking-[0.3em] transition-all transform hover:-translate-y-1 active:translate-y-0 ${
                selectedPlayerIds.length >= 10 
                  ? 'bg-[#1A1A1A] text-white shadow-[8px_8px_0_0_#B45309]' 
                  : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
              }`}
            >
              Execute Deployment
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {loading ? (
          <div className="col-span-2 p-20 text-center text-[#1A1A1A] font-mono font-bold animate-pulse">STREAMING_CIRCUIT_DATA...</div>
        ) : tournaments.length === 0 ? (
          <div className="col-span-2 p-20 text-center text-[#1A1A1A]/40 font-mono text-sm border-2 border-dashed border-[#1A1A1A]">ZERO_RECORDS_AVAILABLE</div>
        ) : (
          tournaments.map((t) => (
            <div 
              key={t.id} 
              onClick={()=> navigate(`/tournaments/${t.id}`)}
              className="border-b-8 border-r-8 border-[#1A1A1A] bg-white p-8 group hover:bg-[#F8F7F2] transition-colors cursor-pointer flex justify-between items-center relative overflow-hidden"
            >
              <div className="space-y-6 relative z-10">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest ${t.status === 'completed' ? 'bg-[#B45309] text-white' : 'bg-[#1A1A1A] text-white'}`}>
                      {t.status}
                    </div>
                    <span className="text-[10px] font-mono font-bold opacity-30 italic">{new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-serif font-black uppercase italic tracking-tighter text-3xl leading-none">{t.name}</h3>
                </div>
                <div className="h-0.5 w-12 bg-[#1A1A1A] group-hover:w-24 transition-all"></div>
              </div>
              <ChevronRight className="w-8 h-8 text-[#1A1A1A] opacity-10 group-hover:opacity-100 group-hover:translate-x-2 transition-all relative z-10" />
              <div className="absolute -bottom-4 -right-4 text-8xl font-serif font-black italic text-[#1A1A1A]/[0.02] select-none">
                {t.id < 10 ? `0${t.id}` : t.id}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

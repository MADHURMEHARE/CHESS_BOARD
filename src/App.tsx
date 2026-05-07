import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Users, 
  Plus, 
  ChevronRight, 
  LayoutDashboard, 
  Settings,
  Sword,
  Target,
  Award,
  ChevronLeft
} from 'lucide-react';
import PlayerManager from './components/PlayerManager';
import TournamentManager from './components/TournamentManager';
import TournamentView from './components/TournamentView';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'players' | 'tournaments' | 'settings'>('dashboard');
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
  const [stats, setStats] = useState({ players: 0, tournaments: 0, active: 0 });

  const [dbStatus, setDbStatus] = useState<'connected' | 'local'>('local');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [pRes, tRes] = await Promise.all([
          fetch('/api/players'),
          fetch('/api/tournaments')
        ]);
        
        const ct1 = pRes.headers.get('content-type');
        const ct2 = tRes.headers.get('content-type');

        if (!ct1?.includes('application/json') || !ct2?.includes('application/json')) {
          const text1 = await pRes.text();
          console.error("Non-JSON response from /api/players:", text1.slice(0, 100));
          throw new Error("SERVER_NOT_RETURNING_JSON");
        }
        
        const players = await pRes.json();
        const tournaments = await tRes.json();
        
        const playersArray = Array.isArray(players) ? players : [];
        const tournamentsArray = Array.isArray(tournaments) ? tournaments : [];

        setStats({
          players: playersArray.length,
          tournaments: tournamentsArray.length,
          active: tournamentsArray.filter((t: any) => t.status === 'active').length
        });
        
        // Check if actually using Neon DB or fallback
        // We'll trust the server's response code for now, but we can assume success means system is up
        setDbStatus(pRes.headers.get('x-db-type') === 'neon' ? 'connected' : 'local');
      } catch (err) {
        console.error("Stats fetch error:", err);
      }
    };
    fetchStats();
  }, [activeTab]);

  const renderContent = () => {
    if (selectedTournamentId) {
      return <TournamentView id={selectedTournamentId} onBack={() => setSelectedTournamentId(null)} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8">
            <header>
              <h1 className="text-4xl font-bold tracking-tighter uppercase italic">Grandmaster Control</h1>
              <p className="text-zinc-500 font-mono text-sm mt-2">v1.0.4 // SYSTEM_ACTIVE</p>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <DashboardCard 
                title="Active Tournaments" 
                value={stats.active.toString()} 
                icon={<Trophy className="w-5 h-5" />} 
                onClick={() => setActiveTab('tournaments')}
              />
              <DashboardCard 
                title="Total Players" 
                value={stats.players.toString()} 
                icon={<Users className="w-5 h-5" />} 
                onClick={() => setActiveTab('players')}
              />
              <DashboardCard 
                title="Matches Simulating" 
                value="ONLINE" 
                icon={<Target className="w-5 h-5" />} 
                color="bg-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="border border-zinc-800 bg-zinc-900/50 p-6 rounded-none">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold italic uppercase">Quick Actions</h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setActiveTab('tournaments')}
                    className="flex flex-col items-start p-4 bg-zinc-800 hover:bg-zinc-700 transition-colors border-l-2 border-orange-500 text-left"
                  >
                    <Plus className="w-5 h-5 mb-2" />
                    <span className="font-bold text-sm uppercase">New Tournament</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('players')}
                    className="flex flex-col items-start p-4 bg-zinc-800 hover:bg-zinc-700 transition-colors border-l-2 border-emerald-500 text-left"
                  >
                    <Plus className="w-5 h-5 mb-2" />
                    <span className="font-bold text-sm uppercase">Add Player</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      case 'players':
        return <PlayerManager />;
      case 'tournaments':
        return <TournamentManager onSelectTournament={setSelectedTournamentId} />;
      default:
        return <div>{activeTab} content coming soon</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F2] text-[#1A1A1A] font-sans border-8 border-[#1A1A1A]">
      <div className="flex h-[calc(100vh-1rem)] overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 border-r border-[#1A1A1A] flex flex-col p-8 space-y-12 bg-[#F8F7F2]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1A1A1A] text-white flex items-center justify-center font-serif text-2xl italic font-black">
              C
            </div>
            <span className="font-black tracking-tighter uppercase text-xl italic font-serif">Checkmate</span>
          </div>

          <nav className="flex-1 space-y-4">
            <NavItem 
              active={activeTab === 'dashboard'} 
              icon={<LayoutDashboard className="w-5 h-5" />} 
              label="Overview" 
              onClick={() => { setActiveTab('dashboard'); setSelectedTournamentId(null); }} 
            />
            <NavItem 
              active={activeTab === 'players'} 
              icon={<Users className="w-5 h-5" />} 
              label="Registrar" 
              onClick={() => { setActiveTab('players'); setSelectedTournamentId(null); }} 
            />
            <NavItem 
              active={activeTab === 'tournaments'} 
              icon={<Trophy className="w-5 h-5" />} 
              label="The Circuit" 
              onClick={() => { setActiveTab('tournaments'); setSelectedTournamentId(null); }} 
            />
          </nav>

          <footer className="pt-8 border-t border-[#1A1A1A]">
            <div className="text-[10px] uppercase tracking-widest text-[#1A1A1A]/40 mb-3 font-bold">Protocol Status</div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold">
              <div className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-500' : 'bg-[#B45309]'}`}></div>
              {dbStatus === 'connected' ? 'NEON_DB_ACTIVE' : 'LOCAL_SESSION_MODE'}
            </div>
          </footer>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-white relative">
          <div className="max-w-6xl mx-auto p-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab + (selectedTournamentId || '')}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}

function NavItem({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-2 py-3 text-sm font-bold transition-all group ${
        active 
          ? 'text-[#1A1A1A]' 
          : 'text-zinc-400 hover:text-[#1A1A1A]'
      }`}
    >
      <div className={`p-2 transition-colors ${active ? 'bg-[#1A1A1A] text-white' : 'bg-transparent text-zinc-300 group-hover:text-[#1A1A1A]'}`}>
        {icon}
      </div>
      <span className="uppercase tracking-widest text-xs italic font-black">{label}</span>
      {active && <div className="ml-auto w-2 h-2 bg-[#B45309] rounded-full" />}
    </button>
  );
}

function DashboardCard({ title, value, icon, color = "bg-[#1A1A1A]", onClick }: { title: string, value: string, icon: React.ReactNode, color?: string, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="p-8 border-b-4 border-r-4 border-[#1A1A1A] bg-[#F8F7F2] hover:bg-white transition-all cursor-pointer relative group"
    >
      <div className="flex justify-between items-start mb-6">
        <div className={`p-3 text-white ${color}`}>
          {icon}
        </div>
        <div className="text-[10px] font-mono font-bold opacity-30 group-hover:opacity-100 transition-opacity uppercase tracking-widest">View Module</div>
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-widest font-black mb-1 opacity-60">{title}</div>
        <div className="text-5xl font-serif font-black italic tracking-tighter leading-none">{value}</div>
      </div>
    </div>
  );
}

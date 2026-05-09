export default function Footer() {
  return (
    <footer className="pt-8 border-t border-[#1A1A1A] space-y-6">

      {/* Status */}
      <div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-400 mb-3 font-bold">
          System Status
        </div>

        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>

          <span className="text-sm font-mono font-bold tracking-wide">
            ALL SYSTEMS OPERATIONAL
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-200"></div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">

        <div className="bg-zinc-100 border border-zinc-200 p-3">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
            Build
          </div>

          <div className="font-black text-sm">
            v2.0.1
          </div>
        </div>

        <div className="bg-zinc-100 border border-zinc-200 p-3">
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">
            Region
          </div>

          <div className="font-black text-sm">
            INDIA
          </div>
        </div>

      </div>

      {/* Bottom */}
      <div className="text-xs text-zinc-400 leading-relaxed border-t border-zinc-200 pt-4">
        Competitive tournament management system for modern chess circuits.
      </div>

    </footer>
  );
}
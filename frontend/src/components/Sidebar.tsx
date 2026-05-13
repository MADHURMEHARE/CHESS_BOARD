import { Link, useLocation } from "react-router-dom";

import {
  Trophy,
  Users,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";

import { useState } from "react";

import Footer from "../Footer";

export default function Sidebar() {

  const location = useLocation();

  const [open, setOpen] = useState(false);

  const navItems = [
    {
      path: "/",
      label: "dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },

    {
      path: "/players",
      label: "Players",
      icon: <Users className="w-5 h-5" />,
    },

    {
      path: "/tournaments",
      label: "Tournaments",
      icon: <Trophy className="w-5 h-5" />,
    },
  ];

  return (
    <>

      {/* Mobile Topbar */}
      <div
        className="
          lg:hidden
          fixed
          top-0
          left-0
          right-0
          z-50

          h-16
          bg-[#F8F7F2]
          border-b
          border-[#1A1A1A]

          flex
          items-center
          justify-between

          px-4
        "
      >

        {/* Logo */}
        <div className="flex items-center gap-3">

          <div className="w-9 h-9 bg-black text-white flex items-center justify-center font-black italic">
            C
          </div>

          <span className="font-black uppercase tracking-tight">
            Checkmate
          </span>

        </div>

        {/* Toggle */}
        <button onClick={() => setOpen(!open)}>

          {open
            ? <X className="w-6 h-6" />
            : <Menu className="w-6 h-6" />
          }

        </button>

      </div>

      {/* Overlay */}
      {open && (
        <div
          className="
            fixed
            inset-0
            bg-black/40
            z-40
            lg:hidden
          "
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed
          top-0
          left-0
          z-50

          h-screen
          w-72

          bg-[#F8F7F2]
          border-r
          border-[#1A1A1A]

          flex
          flex-col

          p-8
          space-y-12

          transition-transform
          duration-300

          ${
            open
              ? "translate-x-0"
              : "-translate-x-full"
          }

          lg:translate-x-0
        `}
      >

        {/* Logo */}
        <div className="flex items-center gap-3">

          <div className="w-10 h-10 bg-[#1A1A1A] text-white flex items-center justify-center font-serif text-2xl italic font-black">
            C
          </div>

          <span className="font-black tracking-tighter uppercase text-xl italic font-serif">
            Checkmate
          </span>

        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-4">

          {navItems.map((item) => {

            const active =
              location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 border transition-all duration-200
                  ${
                    active
                      ? "bg-black text-white border-black"
                      : "border-zinc-300 hover:bg-zinc-100"
                  }
                `}
              >

                {item.icon}

                <span className="font-semibold uppercase text-sm tracking-wide">
                  {item.label}
                </span>

              </Link>
            );
          })}

        </nav>

        {/* Footer */}
        <Footer />

      </aside>

    </>
  );
}
import React, { useState, useEffect } from 'react';

import Swal from "sweetalert2";

import {
  Plus,
  Search,
  Trash2,
  UserPlus,
  Shield,
  Pencil,
} from 'lucide-react';

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

  const [showAddForm, setShowAddForm] =
    useState(false);

  const [newName, setNewName] = useState('');
  const [newRating, setNewRating] =
    useState('1200');

  // EDIT STATES
  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [editName, setEditName] = useState('');
  const [editRating, setEditRating] =
    useState('1200');

  const fetchPlayers = async () => {

    try {

      const res = await fetch('/api/players');

      const data = await res.json();

      setPlayers(Array.isArray(data) ? data : []);

    } catch (error) {

      console.error(
        'Error fetching players:',
        error
      );

    } finally {

      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  // CREATE PLAYER
  const handleAddPlayer = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    if (!newName.trim()) return;

    try {

      const res = await fetch('/api/players', {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          name: newName,
          rating: parseInt(newRating),
        }),
      });

      if (res.ok) {

        Swal.fire({
          title: 'Success!',
          text: 'Player added successfully',
          icon: 'success',
        });

        setNewName('');
        setNewRating('1200');

        setShowAddForm(false);

        fetchPlayers();
      }

    } catch (error) {

      console.error(
        'Error adding player:',
        error
      );

      Swal.fire({
        title: 'Error',
        text: 'Failed to add player',
        icon: 'error',
      });
    }
  };

  // DELETE PLAYER
  const handleDelete = async (
    id: number
  ) => {

    const result = await Swal.fire({
      title: 'Delete Player?',
      text: 'This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
    });

    if (!result.isConfirmed) return;

    try {

      const res = await fetch(
        `/api/players/${id}`,
        {
          method: 'DELETE',
        }
      );

      if (res.ok) {

        Swal.fire({
          title: 'Deleted!',
          text: 'Player removed successfully.',
          icon: 'success',
        });

        fetchPlayers();
      }

    } catch (error) {

      Swal.fire({
        title: 'Error',
        text: 'Failed to delete player',
        icon: 'error',
      });
    }
  };

  // UPDATE PLAYER
  const handleUpdate = async (
    id: number
  ) => {

    try {

      const res = await fetch(
        `/api/players/${id}`,
        {
          method: 'PUT',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            name: editName,
            rating: parseInt(editRating),
          }),
        }
      );

      if (res.ok) {

        Swal.fire({
          title: 'Updated!',
          text:
            'Player updated successfully.',
          icon: 'success',
        });

        setEditingId(null);

        fetchPlayers();
      }

    } catch (error) {

      Swal.fire({
        title: 'Error',
        text: 'Failed to update player',
        icon: 'error',
      });
    }
  };

  return (
    <div className="space-y-8 lg:space-y-12">

      {/* Header */}
      <header className="flex flex-col gap-6 md:flex-row md:justify-between md:items-end border-b-2 border-[#1A1A1A] pb-6">

        <div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-black tracking-tighter uppercase italic leading-none break-words">
            Registrar
          </h1>

          <p className="text-[#1A1A1A]/60 font-mono text-xs mt-3 uppercase tracking-widest font-bold">
            Player Database // Indexation Alpha
          </p>

        </div>

        <button
          onClick={() =>
            setShowAddForm(!showAddForm)
          }
          className="w-full md:w-auto bg-[#1A1A1A] text-white px-6 sm:px-8 py-3 text-xs font-black uppercase tracking-[0.2em] hover:bg-[#B45309] transition-colors"
        >
          {showAddForm
            ? 'Close Entry'
            : 'Manual Enrollment'}
        </button>

      </header>

      {/* Add Form */}
      {showAddForm && (

        <div className="bg-[#F8F7F2] border-4 border-[#1A1A1A] p-4 sm:p-6 lg:p-8 animate-in fade-in slide-in-from-top-4 duration-300">

          <form
            onSubmit={handleAddPlayer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
          >

            {/* Name */}
            <div className="space-y-3">

              <label className="text-[10px] uppercase font-black tracking-widest text-[#1A1A1A]/50">
                Candidate Name
              </label>

              <input
                type="text"
                value={newName}
                onChange={(e) =>
                  setNewName(
                    e.target.value
                  )
                }
                className="w-full bg-white border-2 border-[#1A1A1A] px-4 py-3 focus:outline-none font-bold"
                placeholder="Last, First"
              />

            </div>

            {/* Rating */}
            <div className="space-y-3">

              <label className="text-[10px] uppercase font-black tracking-widest text-[#1A1A1A]/50">
                Opening Rating
              </label>

              <input
                type="number"
                value={newRating}
                onChange={(e) =>
                  setNewRating(
                    e.target.value
                  )
                }
                className="w-full bg-white border-2 border-[#1A1A1A] px-4 py-3 focus:outline-none font-mono font-bold"
              />

            </div>

            {/* Submit */}
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

      {/* Table */}
      <div className="border-4 border-[#1A1A1A] bg-white overflow-x-auto">

        {/* Header */}
        <div className="min-w-[900px] grid grid-cols-6 p-5 bg-[#1A1A1A] text-[10px] font-black uppercase tracking-[0.2em] text-white/60">

          <div className="col-span-2">
            Designation
          </div>

          <div>
            Efficiency
          </div>

          <div>
            Record (W/L)
          </div>

          <div>
            Tier
          </div>

          <div className="text-right">
            Actions
          </div>

        </div>

        {/* Content */}
        {loading ? (

          <div className="p-16 text-center text-[#1A1A1A] font-mono text-sm font-bold animate-pulse">
            SYNCHRONIZING_RECORDS...
          </div>

        ) : players.length === 0 ? (

          <div className="p-16 text-center text-[#1A1A1A]/40 font-mono text-sm">
            ARCHIVE_EMPTY
          </div>

        ) : (

          <div className="divide-y-2 divide-[#1A1A1A]">

            {players.map((player) => (

              <div
                key={player.id}
                className="min-w-[900px] p-4 sm:p-6 hover:bg-[#F8F7F2] transition-colors group"
              >

                <div className="grid grid-cols-6 items-center">

                  {/* Name */}
                  <div className="col-span-2 flex items-center gap-4 sm:gap-6">

                    <div className="text-xl sm:text-2xl font-serif font-black italic opacity-20 group-hover:opacity-100 transition-opacity">

                      {player.id < 10
                        ? `0${player.id}`
                        : player.id}

                    </div>

                    <span className="font-black text-base sm:text-lg lg:text-xl tracking-tighter uppercase italic font-serif text-[#1A1A1A] break-words">

                      {player.name}

                    </span>

                  </div>

                  {/* Rating */}
                  <div className="flex items-center font-mono font-bold text-lg sm:text-xl text-[#B45309]">

                    {player.rating}

                  </div>

                  {/* Wins/Losses */}
                  <div className="flex items-center text-xs font-mono font-black text-[#1A1A1A]/40">

                    {player.wins} — {player.losses}

                  </div>

                  {/* Tier */}
                  <div className="flex justify-start items-center">

                    <div
                      className={`px-3 py-1 text-[10px] uppercase font-black tracking-widest ${
                        player.rating > 2000
                          ? 'bg-[#1A1A1A] text-white'
                          : 'border border-[#1A1A1A]'
                      }`}
                    >

                      {player.rating > 2000
                        ? 'Grandmaster'
                        : 'Candidate'}

                    </div>

                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2">

                    <button
                      onClick={() => {

                        setEditingId(
                          player.id
                        );

                        setEditName(
                          player.name
                        );

                        setEditRating(
                          player.rating.toString()
                        );
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-2 transition-colors"
                    >

                      <Pencil className="w-4 h-4" />

                    </button>

                    <button
                      onClick={() =>
                        handleDelete(
                          player.id
                        )
                      }
                      className="bg-red-600 hover:bg-red-700 text-white p-2 transition-colors"
                    >

                      <Trash2 className="w-4 h-4" />

                    </button>

                  </div>

                </div>

                {/* Edit Form */}
                {editingId === player.id && (

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 border-t pt-6">

                    <input
                      value={editName}
                      onChange={(e) =>
                        setEditName(
                          e.target.value
                        )
                      }
                      className="border-2 border-black px-4 py-3 font-bold"
                    />

                    <input
                      value={editRating}
                      onChange={(e) =>
                        setEditRating(
                          e.target.value
                        )
                      }
                      type="number"
                      className="border-2 border-black px-4 py-3 font-bold"
                    />

                    <button
                      onClick={() =>
                        handleUpdate(
                          player.id
                        )
                      }
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 font-black uppercase"
                    >
                      Save Changes
                    </button>

                  </div>
                )}

              </div>
            ))}

          </div>
        )}

      </div>

    </div>
  );
}
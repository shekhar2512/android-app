import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import toast from "react-hot-toast";
import { Edit2, Trash2, Calendar, FileText, Search, WifiOff } from "lucide-react";
import Navbar from "../components/Navbar";
import localforage from "localforage"; // NEW: Import the hidden database

const Homepage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  const searchInputRef = useRef(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    if (queryParams.get('action') === 'search' && searchInputRef.current) {
      searchInputRef.current.focus();
    }

    // --- NEW: Watch for internet dropping or coming back! ---
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- NEW: Fetching logic upgraded for offline capability ---
  const fetchNotes = async () => {
    try {
      setLoading(true);
      let apiNotes = [];
      
          // 1. ALWAYS try to fetch! If offline, your Service Worker will magically return the cached data!
      try {
        const response = await api.get(`/notes?createdBy=${searchQuery}`);
        apiNotes = response.data;
        await localforage.setItem('cached_api_notes', apiNotes); // Update cache with fresh data
      } catch (err) {
        // 2. If API fails, try to get cached notes from localforage
        apiNotes = await localforage.getItem('cached_api_notes') || [];
        console.error("API failed, couldn't reach cache either", err);
      }

      // 2. Grab any offline notes that are waiting to be synced
      const offlineNotes = await localforage.getItem('offline_notes') || [];
      
      // 3. Combine them! Put offline notes at the top so the user sees them immediately.
      setNotes([...offlineNotes, ...apiNotes]);

    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [searchQuery, isOffline]); // Re-fetch automatically if internet drops!

  const handleDelete = async (id) => {
    // Prevent deleting offline notes since they don't exist in MongoDB yet
    if (id.startsWith('offline-')) {
      toast.error("Cannot delete an offline note until it syncs!");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this note?")) return;

    try {
      await api.delete(`/notes/${id}`);
      toast.success("Note deleted successfully");
      setNotes(notes.filter((note) => note._id !== id));
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    }
  };

  return (
    <div className="min-h-screen bg-base-100 pb-12">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* FULLY RESPONSIVE HEADER */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-base-content mb-1">My Thinkboard</h2>
            <p className="text-sm text-base-content/60">Organize and keep track of your thoughts</p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
            <div className="badge badge-primary badge-outline font-semibold whitespace-nowrap">
              {notes.length} {notes.length === 1 ? "Note" : "Notes"}
            </div>

            <label className="input input-sm input-bordered input-primary flex items-center gap-2 w-full sm:w-64">
              <Search className="size-4 opacity-70" />
              <input
                type="text"
                className="grow"
                placeholder="Search createdby..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                ref={searchInputRef}
              />
            </label>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-base-content/60 font-medium animate-pulse">Loading notes...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-base-content/20 rounded-2xl max-w-md mx-auto px-6 bg-base-200/50 backdrop-blur-sm">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
              <FileText className="size-8" />
            </div>
            <h3 className="text-lg font-bold text-base-content mb-1">No notes yet</h3>
            <p className="text-sm text-base-content/60 mb-6">
              Create your first note on Thinkboard and start tracking your ideas.
            </p>
            <Link to="/create" className="btn btn-primary px-6 shadow-md hover:shadow-lg transition-all">
              Create a Note
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <div
                key={note._id}
                className="card bg-base-200 border border-base-content/10 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 group flex flex-col justify-between overflow-hidden relative"
              >

                {/* NEW: Warning Badge if the note is Offline */}
                {note._id.startsWith('offline-') && (
                  <div className="absolute top-4 left-4 badge badge-warning badge-sm font-bold shadow-md gap-1 z-10">
                    <WifiOff className="size-3" /> Pending Sync
                  </div>
                )}

                {note.image && (
                  <figure className="w-full h-48 border-b border-base-content/10 bg-base-300 shrink-0">
                    <img 
                      src={note.image} 
                      alt={note.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    />
                  </figure>
                )}

                <div className="card-body p-6 relative flex-grow">
                  <h3 className="card-title text-lg font-bold text-base-content group-hover:text-primary transition-colors line-clamp-1 pr-16">
                    {note.title}
                  </h3>
                  <p className="text-sm text-base-content/75 mt-2 line-clamp-4 whitespace-pre-line leading-relaxed">
                    {note.content}
                  </p>
                  <div className="absolute top-4 right-4 badge badge-secondary badge-sm font-semibold shadow-sm">
                    {note.createdBy}
                  </div>
                </div>

                <div className="px-6 py-4 bg-base-300/40 border-t border-base-content/5 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-1.5 text-xs text-base-content/50 font-medium">
                    <Calendar className="size-3.5" />
                    <span>
                      {new Date(note.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/notes/${note._id}`}
                      className={`btn btn-sm btn-ghost btn-circle text-base-content/70 hover:text-primary hover:bg-primary/10 transition-colors ${note._id.startsWith('offline-') ? 'btn-disabled opacity-50' : ''}`}
                      title="Edit Note"
                    >
                      <Edit2 className="size-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(note._id)}
                      className={`btn btn-sm btn-ghost btn-circle text-base-content/70 hover:text-error hover:bg-error/10 transition-colors ${note._id.startsWith('offline-') ? 'btn-disabled opacity-50' : ''}`}
                      title="Delete Note"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Homepage;
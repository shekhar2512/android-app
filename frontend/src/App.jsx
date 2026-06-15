import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import localforage from 'localforage';
import api from './api';

import Homepage from './pages/Homepage';
import CreatePage from './pages/createpage';
import NoteDetailsPage from './pages/NoteDetailsPage';

const App = () => {

  // --- NEW: THE AUTO-SYNC ENGINE ---
  useEffect(() => {
    const syncOfflineNotes = async () => {
      try {
        // Check the local database for offline notes
        const offlineNotes = await localforage.getItem('offline_notes');
        
        if (offlineNotes && offlineNotes.length > 0) {
          toast.loading(`Internet restored! Syncing ${offlineNotes.length} offline notes...`, { id: 'sync' });
          
          let successCount = 0;
          for (const note of offlineNotes) {
            try {
              // Push them to the real backend one by one
              await api.post('/notes', note);
              successCount++;
            } catch (err) {
              console.error("Failed to sync a note:", err);
            }
          }
          
          // Clear the local database once they are safely in MongoDB
          await localforage.removeItem('offline_notes');
          toast.success(`Successfully synced ${successCount} notes to database!`, { id: 'sync' });
          
          // Automatically refresh the page to show the new synced notes!
          setTimeout(() => window.location.reload(), 1500);
        }
      } catch (error) {
        console.error("Error during background sync:", error);
      }
    };

    // Listen for the internet to come back online
    window.addEventListener('online', syncOfflineNotes);
    
    // Also run it once when the app first loads, just in case
    if (navigator.onLine) {
      syncOfflineNotes();
    }

    return () => {
      window.removeEventListener('online', syncOfflineNotes);
    };
  }, []);
  // ---------------------------------

  return (
    <div data-theme="halloween" className="min-h-screen bg-base-100 text-base-content">
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/notes/:id" element={<NoteDetailsPage />} />
      </Routes>
      <Toaster position="top-right" />
    </div>
  );
};

export default App;
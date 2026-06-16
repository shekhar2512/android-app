import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import localforage from 'localforage';
import api from './api';

import Homepage from './pages/Homepage';
import CreatePage from './pages/createpage';
import NoteDetailsPage from './pages/NoteDetailsPage';

const App = () => {

  useEffect(() => {
    const syncOfflineNotes = async () => {
      try {
        const offlineNotes = await localforage.getItem('offline_notes');
        
        if (offlineNotes && offlineNotes.length > 0) {
          toast.loading(`Stabilized! Syncing ${offlineNotes.length} offline notes...`, { id: 'sync' });
          
          let successCount = 0;
          for (const note of offlineNotes) {
            try {
              await api.post('/notes', note);
              successCount++;
            } catch (err) {
              toast.error(`Sync Failed: ${err.message}`, { duration: 6000 });
              console.error("Failed to sync a note:", err);
            }
          }
          
          if (successCount > 0) {
            await localforage.removeItem('offline_notes');
            toast.success(`Successfully synced ${successCount} notes!`, { id: 'sync' });
            setTimeout(() => window.location.reload(), 1500);
          } else {
            toast.error("Failed to sync notes. Keeping them in the queue.", { id: 'sync' });
          }
        }
      } catch (error) {
        console.error("Error during background sync:", error);
      }
    };

    // The advanced Network Listener with a 3-second delay
    const handleOnlineEvent = () => {
      toast('Internet detected! Waiting 3 seconds to stabilize...', { icon: '⏳', duration: 3000 });
      setTimeout(() => {
        syncOfflineNotes();
      }, 3000);
    };

    window.addEventListener('online', handleOnlineEvent);
    
    // Also run it on initial load (with a small delay to be safe)
    if (navigator.onLine) {
      setTimeout(syncOfflineNotes, 1000);
    }

    return () => {
      window.removeEventListener('online', handleOnlineEvent);
    };
  }, []);

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
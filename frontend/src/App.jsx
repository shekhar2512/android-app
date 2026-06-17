import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import localforage from 'localforage';
import api from './api';
import OfflineBanner from './components/OfflineBanner';

import Homepage from './pages/Homepage';
import CreatePage from './pages/createpage';
import NoteDetailsPage from './pages/NoteDetailsPage';

const App = () => {

  useEffect(() => {
    // 1. ASK FOR PERMISSION TO SEND NOTIFICATIONS
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

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

            // 2. TRIGGER THE NATIVE PHONE NOTIFICATION AND VIBRATION!
            if ("Notification" in window && Notification.permission === "granted") {
              if ("serviceWorker" in navigator) {
                // This is the bulletproof PWA way to trigger Android/iOS notifications
                navigator.serviceWorker.ready.then(registration => {
                  registration.showNotification("Thinkboard Synced! 🚀", {
                    body: `Successfully backed up ${successCount} offline notes to your database.`,
                    vibrate: [200, 100, 200, 100, 200], // Makes the phone buzz twice!
                  });
                });
              }
            }

                        // INSTEAD OF RELOADING THE PAGE, WE SEND A SILENT SIGNAL
            setTimeout(() => window.dispatchEvent(new Event('forceFetchNotes')), 1500);
          } else {
            toast.error("Failed to sync notes. Keeping them in the queue.", { id: 'sync' });
          }
        }
      } catch (error) {
        console.error("Error during background sync:", error);
      }
    };

    const handleOnlineEvent = () => {
      toast('Internet detected! Waiting 3 seconds to stabilize...', { icon: '⏳', duration: 8000 });
      setTimeout(() => {
        syncOfflineNotes();
      }, 8000);
    };

    window.addEventListener('online', handleOnlineEvent);
    
    if (navigator.onLine) {
      setTimeout(syncOfflineNotes, 1000);
    }

    return () => {
      window.removeEventListener('online', handleOnlineEvent);
    };
  }, []);

  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      <OfflineBanner />
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
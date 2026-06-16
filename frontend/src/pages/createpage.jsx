import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import toast from "react-hot-toast";
import { ArrowLeft, Save, Camera, X } from "lucide-react";
import Navbar from "../components/Navbar";
import localforage from "localforage"; // NEW: Import localforage!

const CreatePage = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [image, setImage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      // Create a temporary image object to read the massive photo
      const img = new Image();
      img.onload = () => {
        // We will shrink it so the max width is 800px
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        // Draw the massive photo onto a tiny hidden canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Convert the canvas back into a tiny 50KB JPEG image! 
        // 0.6 is the quality scale (60% quality is perfect for mobile)
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.6);
        
        setImage(compressedBase64);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim() || !createdBy.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const noteData = { title, content, createdBy, image };

    // --- NEW: OFFLINE SAVE LOGIC ---
    if (!navigator.onLine) {
      try {
        setIsSubmitting(true);
        // Grab any existing offline notes from the hidden database
        const existingOfflineNotes = await localforage.getItem('offline_notes') || [];
        
                // Add this new note to the queue (NO FAKE ID!)
        existingOfflineNotes.push(noteData);
        
        // Save it back to the hidden database
        await localforage.setItem('offline_notes', existingOfflineNotes);
        
        toast.success("You are offline! Note saved locally and will sync when internet returns.", {
          icon: '📶',
          duration: 4000,
        });
        
        navigate("/");
      } catch (err) {
        console.error("Failed to save offline:", err);
        toast.error("Failed to save offline.");
      } finally {
        setIsSubmitting(false);
      }
      return; // Stop here so it doesn't try to use the API!
    }
    // ---------------------------------

    try {
      setIsSubmitting(true);
      await api.post(`/notes`, noteData);
      toast.success("Note created successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error creating note:", error);
      toast.error("Failed to create note");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-100 pb-12">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-base-content/60 hover:text-primary transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Thinkboard</span>
          </Link>
        </div>

        <div className="card bg-base-200 border border-base-content/10 shadow-lg">
          <div className="card-body p-6 md:p-8">
            <h2 className="card-title text-2xl font-bold text-base-content mb-6">Create New Note</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold text-base-content/75">Title</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter note title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input input-bordered w-full focus:outline-none focus:border-primary text-base-content"
                  maxLength={100}
                  required
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold text-base-content/75">Content</span>
                </label>
                <textarea
                  placeholder="Write your note contents here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="textarea textarea-bordered h-64 focus:outline-none focus:border-primary leading-relaxed text-base-content"
                  required
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-semibold text-base-content/75">Created By</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your name..."
                  value={createdBy}
                  onChange={(e) => setCreatedBy(e.target.value)}
                  className="input input-bordered w-full focus:outline-none focus:border-primary text-base-content"
                  required
                />
              </div>

              {/* Camera Input Section */}
              <div className="form-control w-full border-t border-base-content/10 pt-4 mt-2">
                <label className="label">
                  <span className="label-text font-semibold text-base-content/75">Attach a Photo (Optional)</span>
                </label>
                
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="file-input file-input-bordered w-full text-base-content"
                />

                {image && (
                  <div className="mt-4 relative rounded-lg overflow-hidden border border-base-content/20 shadow-sm">
                    <img src={image} alt="Camera Preview" className="w-full max-h-64 object-cover" />
                    <button
                      type="button"
                      onClick={() => setImage("")}
                      className="btn btn-sm btn-error absolute top-2 right-2 gap-1 shadow-md"
                    >
                      <X className="size-4" /> Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="card-actions justify-end pt-4 gap-3">
                <Link to="/" className="btn btn-ghost">
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary px-6 shadow-md hover:shadow-lg transition-all gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />
                      <span>Save Note</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreatePage;
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api";
import toast from "react-hot-toast";
import { ArrowLeft, Save, Camera, X } from "lucide-react";
import Navbar from "../components/Navbar";

const NoteDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [createdBy, setCreatedBy] = useState("");
  const [image, setImage] = useState(""); // NEW: Image state
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch the note details on mount
  useEffect(() => {
    const fetchNote = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/notes/${id}`);
        setTitle(response.data.title);
        setContent(response.data.content);
        setCreatedBy(response.data.createdBy);
        setImage(response.data.image || ""); // NEW: Grab the image from the database!
      } catch (error) {
        console.error("Error fetching note:", error);
        toast.error("Failed to load note details");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [id, navigate]);

  // NEW: Function to process the camera photo
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image is too large! Please take a smaller photo.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Update note handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim() || !createdBy.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setIsSubmitting(true);
      // NEW: Ensure 'image' is being sent in the PUT request
      await api.put(`/notes/${id}`, { title, content, createdBy, image });
      toast.success("Note updated successfully!");
      navigate("/");
    } catch (error) {
      console.error("Error updating note:", error);
      toast.error("Failed to update note");
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

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-base-content/60 font-medium animate-pulse">Loading note details...</p>
          </div>
        ) : (
          <div className="card bg-base-200 border border-base-content/10 shadow-lg overflow-hidden">
            
            {/* NEW: Display the existing image beautifully at the top if it exists! */}
            {image && (
              <figure className="w-full h-64 border-b border-base-content/10 bg-base-300">
                <img 
                  src={image} 
                  alt={title} 
                  className="w-full h-full object-cover" 
                />
              </figure>
            )}

            <div className="card-body p-6 md:p-8">
              <h2 className="card-title text-2xl font-bold text-base-content mb-6">Edit Note</h2>

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
                    maxLength={50}
                    required
                  />
                </div>

                {/* NEW: Camera Input Section for Editing */}
                <div className="form-control w-full border-t border-base-content/10 pt-4 mt-2">
                  <label className="label">
                    <span className="label-text font-semibold text-base-content/75">Change Photo</span>
                  </label>
                  
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    className="file-input file-input-bordered w-full text-base-content"
                  />

                  {image && (
                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setImage("")}
                        className="btn btn-sm btn-error gap-1 shadow-md"
                      >
                        <X className="size-4" /> Remove Photo
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
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="size-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default NoteDetailsPage;
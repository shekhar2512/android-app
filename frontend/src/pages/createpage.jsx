import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";
import toast from "react-hot-toast";
import { ArrowLeft, Save, Camera, X, Mic } from "lucide-react";
import Navbar from "../components/Navbar";
import localforage from "localforage";

const CreatePage = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  // NEW: State to track the live guesses
  const [interimText, setInterimText] = useState("");
  
  const [isListening, setIsListening] = useState(false);
  const [createdBy, setCreatedBy] = useState("");
  const [image, setImage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 800;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.6);
        setImage(compressedBase64);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  // 🎙️ NATIVE SPEECH-TO-TEXT ENGINE
  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      window.speechRecognitionInstance?.stop();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Your browser does not support Voice Typing!");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true; 
    recognition.interimResults = true;
    window.speechRecognitionInstance = recognition;

    recognition.onstart = () => {
      setIsListening(true);
      toast.success("Microphone active! Start speaking...");
    };

    // UPGRADED: Real-time translation parsing
    recognition.onresult = (event) => {
      let finalTranscript = '';
      let liveGuess = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          liveGuess += event.results[i][0].transcript;
        }
      }
      
      // Update the live guesses instantly
      setInterimText(liveGuess);

      // Save the finalized sentences permanently
      if (finalTranscript) {
        setContent((prev) => prev + finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech error", event.error);
      setIsListening(false);
      setInterimText("");
      if (event.error === 'not-allowed') toast.error("Please allow Microphone access!");
    };

    recognition.onend = () => {
      setIsListening(false); 
      setInterimText(""); // Clear any leftover live guesses when stopping
    };

    recognition.start();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim() || !createdBy.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const noteData = { title, content, createdBy, image };

    if (!navigator.onLine) {
      try {
        setIsSubmitting(true);
        const existingOfflineNotes = await localforage.getItem('offline_notes') || [];
        existingOfflineNotes.push(noteData);
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
      return; 
    }

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

              <div className="form-control w-full mb-4">
                <label className="label">
                  <span className="label-text font-semibold text-base-content/75">Content</span>
                </label>
                
                <div className="relative w-full">
                  <textarea
                    placeholder="Write your note contents here..."
                    // UPGRADED: Combines permanent text + live guesses!
                    value={content + interimText}
                    onChange={(e) => setContent(e.target.value)}
                    className="textarea textarea-bordered w-full h-64 pr-14 focus:outline-none focus:border-primary leading-relaxed text-base-content bg-base-200/50 focus:bg-base-100 shadow-inner"
                    required
                  />

                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`absolute bottom-4 right-4 p-2.5 rounded-full transition-all duration-300 ${
                      isListening 
                        ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40" 
                        : "bg-base-300 text-base-content/60 hover:bg-primary/20 hover:text-primary backdrop-blur-sm"
                    }`}
                    title="Voice Type"
                  >
                    <Mic className="size-5" />
                  </button>
                </div>
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

              {/* BEAUTIFUL CAMERA BUTTON SECTION */}
              <div className="form-control w-full mt-2">
                <label className="label">
                  <span className="label-text font-semibold text-base-content/75">Attach a Photo (Optional)</span>
                </label>
                
                {/* 1. We completely HIDE the ugly default browser input */}
                <input
                  type="file"
                  id="cameraInput" 
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden" 
                />

                {/* 2. Label styled EXACTLY like the input fields for UI consistency */}
                <label 
                  htmlFor="cameraInput" 
                  className="flex items-center justify-center gap-2 w-full input input-bordered hover:border-primary hover:text-primary cursor-pointer transition-all text-base-content/70"
                >
                  <Camera className="size-5" />
                  <span className="font-medium">Take a Photo</span>
                </label>

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
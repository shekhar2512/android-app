import { Link } from "react-router-dom";
import { Sun, Moon } from "lucide-react"; // Import the icons!
import { useState, useEffect } from "react";

const Navbar = () => {
  // 1. Get the saved theme from the phone's memory, or default to dark mode
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "halloween");

  // 2. Whenever the theme changes, update the entire HTML document and save it to memory
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // 3. The Toggle Function
  const toggleTheme = () => {
    setTheme(theme === "halloween" ? "retro" : "halloween");
  };

  return (
    <div className="navbar bg-base-200 border-b border-base-content/10 sticky top-0 z-40">
      <div className="navbar-start">
        <Link to="/" className="btn btn-ghost text-xl font-bold text-primary tracking-wide">
          Thinkboard
        </Link>
      </div>

      <div className="navbar-end">
        {/* NEW THEME TOGGLE BUTTON */}
        <button 
          onClick={toggleTheme} 
          className="btn btn-ghost btn-circle mr-2 hover:bg-base-300 transition-all duration-300"
          title="Toggle Dark/Light Mode"
        >
          {theme === "halloween" ? (
            <Sun className="size-5 text-yellow-400" />
          ) : (
            <Moon className="size-5 text-indigo-600" />
          )}
        </button>

        <Link to="/create" className="btn btn-primary btn-sm shadow-md">
          + New Note
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
import { Link } from "react-router-dom";

export default function WelcomePage() {
  console.log("Welcome page rendered");

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-blue-900 to-blue-800 p-6 text-white flex flex-col">
      
      {/* Heading centered */}
      <header className="text-center py-16">
        <h1 className="text-6xl font-extrabold mb-4 drop-shadow-lg">
          Firmware Management Portal
        </h1>
        <p className="text-gray-300 text-xl max-w-xl mx-auto">
          Welcome to your firmware management dashboard. Manage, upload, and monitor all your firmware updates securely.
        </p>
      </header>

      {/* Main content */}
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="bg-gray-900/70 p-8 rounded-3xl shadow-2xl max-w-md text-center">
          <h2 className="text-3xl font-bold mb-6 text-indigo-400">
            Get Started
          </h2>
          <p className="text-gray-300 mb-8">
            Click the button below to proceed to firmware management.
          </p>

          <div className="flex justify-center">
            <Link
              to="/start"
              className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-lg rounded-2xl shadow-lg hover:scale-105 hover:from-indigo-600 hover:to-purple-700 transition-transform duration-300"
            >
              Next
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-gray-500 text-sm mt-auto py-6">
        &copy; 2026 Firmware Portal. All rights reserved.
      </footer>
    </div>
  );
}

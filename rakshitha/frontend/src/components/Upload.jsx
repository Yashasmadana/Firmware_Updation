import { useRef, useState } from "react";

export default function UploadPage() {
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [flashStatus, setFlashStatus] = useState("");
  const [portName] = useState("COM11"); // Change if needed

  /* Open file manager */
  const openFileManager = () => {
    fileInputRef.current.click();
  };

  /* Handle firmware selection */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      console.log("Selected firmware:", file.name);
    }
  };

  /* 🔥 Flash Firmware */
  const handleFlash = async () => {
    if (!selectedFile) {
      alert("Please select a firmware file");
      return;
    }

    try {
      setFlashStatus("Flashing in progress...");

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("port", portName);

      const response = await fetch("http://localhost:5000/flash", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      console.log("Backend response:", data);

      if (data.status === "success") {
        setFlashStatus("✅ Flash Successful");
      } else {
        setFlashStatus("❌ Flash Failed");
      }
    } catch (error) {
      console.error("Flash error:", error);
      setFlashStatus("❌ Backend connection error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-slate-800 text-white p-6">

      {/* Header */}
      <header className="mb-10">
        <h1 className="text-4xl font-bold text-sky-400">
          Firmware Management Portal
        </h1>
        <p className="text-gray-400 mt-2">
          Upload and flash embedded device firmware
        </p>
      </header>

      {/* Upload Firmware */}
      <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6">Upload Firmware</h2>

        <div
          onClick={openFileManager}
          className="cursor-pointer border-2 border-dashed border-slate-600 rounded-xl p-10 text-center hover:border-sky-500 transition"
        >
          <div className="text-5xl mb-4">⬆️</div>
          <p className="text-sky-400 font-semibold">
            Click to upload firmware file
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Supports .bin, .hex, .elf
          </p>

          {selectedFile && (
            <p className="text-green-400 mt-4 font-medium">
              Selected file: {selectedFile.name}
            </p>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".bin,.hex,.elf"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          onClick={handleFlash}
          disabled={!selectedFile}
          className={`w-full mt-8 py-4 text-lg font-bold rounded-xl transition
            ${
              selectedFile
                ? "bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
                : "bg-gray-700 cursor-not-allowed"
            }
          `}
        >
          Flash Firmware
        </button>

        {flashStatus && (
          <p className="mt-6 text-center font-semibold">{flashStatus}</p>
        )}
      </div>
    </div>
  );
}

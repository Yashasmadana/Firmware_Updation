import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function UploadPage() {
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] = useState(null);
  const [flashStatus, setFlashStatus] = useState("");
  const [firmwareDetails, setFirmwareDetails] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const API = "http://127.0.0.1:5000";

  const openFileManager = () => {
    if (!isUploading) {
      fileInputRef.current.click();
    }
  };

  // --------------------------
  // HANDLE FILE UPLOAD
  // --------------------------
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFlashStatus("");
    setFirmwareDetails(null);

    // 🔥 Create a stable copy of file (Fixes ERR_UPLOAD_FILE_CHANGED)
    const stableFile = new File([file], file.name, {
      type: file.type,
    });

    setSelectedFile(stableFile);

    const formData = new FormData();
    formData.append("file", stableFile);

    try {
      setIsUploading(true);

      const response = await fetch(`${API}/firmware-info`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Firmware info failed");
      }

      const data = await response.json();

      if (data.status === "success") {
        setFirmwareDetails(data.details);
      } else {
        alert(data.message || "Failed to read firmware");
      }
    } catch (err) {
      console.error("Firmware Info Error:", err);
      alert("Error connecting to backend");
    } finally {
      setIsUploading(false);
    }
  };

  // --------------------------
  // FLASH FIRMWARE
  // --------------------------
  const handleFlash = async () => {
    if (!selectedFile) {
      alert("Select a firmware file");
      return;
    }

    setFlashStatus("Flashing in progress...");
    setIsUploading(true);

    const formData = new FormData();
    formData.append("firmware", selectedFile);

    try {
      const response = await fetch(`${API}/flash`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      const data = await response.json();

      if (data.status === "success") {
        localStorage.setItem(
          "flashSummary",
          JSON.stringify(data.flash_summary)
        );
        navigate("/flash-summary");
      } else {
        setFlashStatus("❌ Flash Failed");
      }
    } catch (err) {
      console.error("FLASH ERROR:", err);
      setFlashStatus("❌ Flash Failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-4xl font-bold text-sky-400 mb-10">
        Firmware Management Portal
      </h1>

      <div className="bg-slate-900 p-8 rounded-xl border border-slate-700">
        <h2 className="text-2xl font-bold mb-6">Upload Firmware</h2>

        <div
          onClick={openFileManager}
          className="cursor-pointer border-2 border-dashed border-slate-600 rounded-xl p-10 text-center hover:border-sky-500"
        >
          <div className="text-5xl mb-4">⬆️</div>
          <p className="text-sky-400 font-semibold">
            Click to upload firmware file
          </p>

          {selectedFile && (
            <p className="text-green-400 mt-4">
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

        {firmwareDetails && (
          <div className="mt-6 bg-slate-800 p-4 rounded border border-slate-600">
            <h3 className="text-lg text-sky-400 font-semibold">
              Detected Firmware Details
            </h3>
            <p>Version: {firmwareDetails.version}</p>
            <p>Board: {firmwareDetails.board}</p>
            <p>Build Date: {firmwareDetails.build_date}</p>
          </div>
        )}

        <button
          onClick={handleFlash}
          disabled={!firmwareDetails || isUploading}
          className="w-full mt-8 py-4 text-lg font-bold rounded bg-sky-600 hover:bg-sky-700 disabled:bg-gray-600"
        >
          {isUploading ? "Processing..." : "Flash Firmware"}
        </button>

        {flashStatus && (
          <p className="mt-6 text-center font-semibold">
            {flashStatus}
          </p>
        )}
      </div>
    </div>
  );
}
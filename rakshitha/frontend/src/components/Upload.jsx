import { useRef, useState } from "react";

export default function UploadPage() {
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

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

  /* Connect MCU via Web Serial */
  const connectDevice = async () => {
  try {
    if (!("serial" in navigator)) {
      alert("Web Serial not supported. Use Chrome or Edge.");
      return;
    }

    const port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });

    const info = port.getInfo();

    let mcuVersion = "Unknown";

    // 🔍 Try reading version (non-blocking)
    if (port.readable) {
      const reader = port.readable.getReader();
      const decoder = new TextDecoder();

      const timeout = new Promise((resolve) =>
        setTimeout(() => resolve(null), 1000)
      );

      const readData = reader.read();

      const result = await Promise.race([readData, timeout]);

      if (result && result.value) {
        const text = decoder.decode(result.value);
        const match = text.match(/version[:\s]+([^\s]+)/i);
        if (match) {
          mcuVersion = match[1];
        }
      }

      reader.releaseLock();
    }

    setDeviceConnected(true);
    setDeviceInfo({
      name: "USB Serial Device",
      vendorId: info.usbVendorId || "Unknown",
      productId: info.usbProductId || "Unknown",
      version: mcuVersion,
    });

    setShowPopup(true);
  } catch (err) {
    if (err?.message?.includes("The user cancelled")) return;
    if (deviceConnected) return;

    console.error(err);
    alert("Failed to connect device");
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
          Upload, configure, and manage embedded device firmware
        </p>
      </header>

      {/* Device Status */}
      <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-6 flex items-center justify-between mb-10">
        <div className="flex items-center gap-3">
          <span className="text-sky-400 text-xl">📡</span>
          <div>
            <p className="font-semibold">Device Status</p>
            <p className="text-sm">
              {deviceConnected ? (
                <span className="text-green-400">Device Connected</span>
              ) : (
                <span className="text-gray-400">No device connected</span>
              )}
            </p>
          </div>
        </div>

        <button
          onClick={connectDevice}
          disabled={deviceConnected}
          className={`px-6 py-2 rounded-lg font-semibold transition
            ${
              deviceConnected
                ? "bg-gray-700 cursor-not-allowed"
                : "bg-sky-500 hover:bg-sky-600"
            }
          `}
        >
          {deviceConnected ? "Device Connected" : "Connect Device"}
        </button>
      </div>

      {/* Upload Firmware */}
      <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-6">Upload Firmware</h2>

        {/* Upload Area */}
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

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".bin,.hex,.elf"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Flash Button (Demo Only) */}
        <button
          disabled={!selectedFile || !deviceConnected}
          className={`w-full mt-8 py-4 text-lg font-bold rounded-xl transition
            ${
              selectedFile && deviceConnected
                ? "bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700"
                : "bg-gray-700 cursor-not-allowed"
            }
          `}
        >
          Flash Firmware
        </button>
      </div>

      {/* Device Info Popup */}
      {showPopup && deviceInfo && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-80 text-center">
            <h3 className="text-xl font-bold text-sky-400 mb-4">
              Device Connected
            </h3>
            <p className="text-gray-300">{deviceInfo.name}</p>
            <p className="text-gray-400 text-sm">
              Vendor ID: {deviceInfo.vendorId}
            </p>
            <p className="text-gray-400 text-sm">
              Product ID: {deviceInfo.productId}
            </p>
            <p className="text-gray-400 text-sm">
              Version: {deviceInfo.version}
            </p>

            <button
              onClick={() => setShowPopup(false)}
              className="mt-6 px-6 py-2 bg-sky-500 hover:bg-sky-600 rounded-lg font-semibold"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

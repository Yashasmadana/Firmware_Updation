import os
import subprocess
import hashlib
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import serial.tools.list_ports

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

UPLOAD_FOLDER = r"C:\temp\uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Avrdude paths
AVRDUDE_PATH = r"C:\Users\Gopal\AppData\Local\Arduino15\packages\arduino\tools\avrdude\8.0.0-arduino1\bin\avrdude.exe"
CONF_PATH = r"C:\Users\Gopal\AppData\Local\Arduino15\packages\arduino\tools\avrdude\8.0.0-arduino1\etc\avrdude.conf"


# --------------------------
# HASH GENERATION
# --------------------------
def compute_firmware_hash(fp):
    sha = hashlib.sha256()
    with open(fp, "rb") as f:
        sha.update(f.read())
    return sha.hexdigest()[:12]


# --------------------------
# DETECT BOARD FROM HEX
# --------------------------
def detect_board(fp):
    try:
        content = open(fp, "r").read().upper()
        if "1E95" in content:
            return "ATmega328P (Arduino UNO/Nano)"
        if "1E98" in content:
            return "ATmega2560 (Arduino Mega)"
        return "AVR (Unknown HEX MCU)"
    except:
        return "Unknown"
    

# --------------------------
# DETECT ARDUINO USB PORT
# --------------------------
def detect_arduino_board():
    for p in serial.tools.list_ports.comports():
        d = p.description.lower()
        if "arduino" in d or "usb serial" in d or "ch340" in d:
            return "atmega328p", p.device
    return None, None


# --------------------------
# BACKEND TEST ROUTE
# --------------------------
@app.route("/")
def home():
    return "Backend Running"


# --------------------------
# FIRMWARE INFO
# --------------------------
@app.route("/firmware-info", methods=["POST"])
def firmware_info():

    if "file" not in request.files:
        return jsonify({"status": "error", "message": "No file uploaded"}), 400

    file = request.files["file"]
    fp = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(fp)

    info = {
        "version": compute_firmware_hash(fp),
        "board": detect_board(fp),
        "build_date": datetime.now().strftime("%Y-%m-%d")
    }

    return jsonify({"status": "success", "details": info})


# --------------------------
# FLASH FIRMWARE
# --------------------------
@app.route("/flash", methods=["POST"])
def flash():
    if "firmware" not in request.files:
        return jsonify({"status": "error", "message": "Firmware not provided"}), 400

    firmware = request.files["firmware"]

    # Make filename unique (VERY IMPORTANT)
    filename = f"{datetime.now().timestamp()}_{firmware.filename}"
    fp = os.path.join(UPLOAD_FOLDER, filename)
    firmware.save(fp)

    board, port = detect_arduino_board()
    if not port:
        return jsonify({"status": "error", "message": "Arduino not detected"}), 400

    cmd = [
        AVRDUDE_PATH, "-C", CONF_PATH, "-v",
        "-p", board, "-c", "arduino",
        "-P", port, "-b", "115200",
        "-D", "-U", f"flash:w:{fp}:i"
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        return jsonify({
            "status": "error",
            "message": "Flash failed",
            "details": result.stderr
        }), 500

    # 🔥 FIXED SUMMARY FORMAT
    summary = {
        "version": compute_firmware_hash(fp),
        "device": port,
        "date": datetime.now().strftime("%Y-%m-%d"),
        "time": datetime.now().strftime("%H:%M:%S"),
        "result": "Successful"
    }

    return jsonify({
        "status": "success",
        "flash_summary": summary
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
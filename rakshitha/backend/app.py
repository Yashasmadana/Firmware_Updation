import os
import subprocess
import hashlib
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import serial.tools.list_ports
import sqlite3

# ==========================
# DATABASE SETUP
# ==========================

DATABASE = "flash_history.db"

def init_db():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS flash_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            version TEXT,
            device TEXT,
            board TEXT,
            port TEXT,
            date TEXT,
            time TEXT,
            result TEXT
        )
    """)

    conn.commit()
    conn.close()

init_db()

# ==========================
# FLASK SETUP
# ==========================

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = r"C:\temp\uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

AVRDUDE_PATH = r"C:\Users\Gopal\AppData\Local\Arduino15\packages\arduino\tools\avrdude\8.0.0-arduino1\bin\avrdude.exe"
CONF_PATH = r"C:\Users\Gopal\AppData\Local\Arduino15\packages\arduino\tools\avrdude\8.0.0-arduino1\etc\avrdude.conf"

# ==========================
# HASH GENERATION (VERSION)
# ==========================

def compute_firmware_hash(fp):
    sha = hashlib.sha256()
    with open(fp, "rb") as f:
        sha.update(f.read())
    return sha.hexdigest()[:12]

# ==========================
# DETECT BOARD FROM HEX FILE
# ==========================

def detect_board_from_hex(fp):
    try:
        content = open(fp, "r").read().upper()
        if "1E95" in content:
            return "atmega328p"
        if "1E98" in content:
            return "atmega2560"
        return "avr-unknown"
    except:
        return "unknown"

# ==========================
# DETECT CONNECTED DEVICE
# ==========================

def detect_arduino_board():
    for p in serial.tools.list_ports.comports():
        desc = p.description.lower()

        if "arduino uno" in desc:
            return "atmega328p", p.device, "Arduino Uno"

        if "arduino nano" in desc:
            return "atmega328p", p.device, "Arduino Nano"

        if "arduino mega" in desc:
            return "atmega2560", p.device, "Arduino Mega"

        if "ch340" in desc:
            return "atmega328p", p.device, "CH340 USB Device"

        if "usb serial" in desc:
            return "atmega328p", p.device, p.description

    return None, None, None

# ==========================
# HOME ROUTE
# ==========================

@app.route("/")
def home():
    return "Backend Running"

# ==========================
# FIRMWARE INFO (AUTO VERSION DETECTION)
# ==========================

@app.route("/firmware-info", methods=["POST"])
def firmware_info():

    if "file" not in request.files:
        return jsonify({"status": "error", "message": "No file uploaded"}), 400

    file = request.files["file"]
    fp = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(fp)

    info = {
        "version": compute_firmware_hash(fp),
        "board": detect_board_from_hex(fp),
        "date": datetime.now().strftime("%Y-%m-%d"),
        "time": datetime.now().strftime("%H:%M:%S")
    }

    return jsonify({"status": "success", "details": info})

# ==========================
# FLASH FIRMWARE
# ==========================

@app.route("/flash", methods=["POST"])
def flash():

    if "firmware" not in request.files:
        return jsonify({"status": "error", "message": "Firmware not provided"}), 400

    firmware = request.files["firmware"]

    filename = f"{datetime.now().timestamp()}_{firmware.filename}"
    fp = os.path.join(UPLOAD_FOLDER, filename)
    firmware.save(fp)

    # Detect connected board
    board, port, device_name = detect_arduino_board()

    if not port:
        return jsonify({"status": "error", "message": "Arduino not detected"}), 400

    # Flash command
    cmd = [
        AVRDUDE_PATH, "-C", CONF_PATH, "-v",
        "-p", board,
        "-c", "arduino",
        "-P", port,
        "-b", "115200",
        "-D",
        "-U", f"flash:w:{fp}:i"
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        return jsonify({
            "status": "error",
            "message": "Flash failed",
            "details": result.stderr
        }), 500

    # ==========================
    # FLASH SUMMARY DISPLAY DATA
    # ==========================

    summary = {
        "version": compute_firmware_hash(fp),
        "device": device_name,
        "board": board,
        "port": port,
        "date": datetime.now().strftime("%Y-%m-%d"),
        "time": datetime.now().strftime("%H:%M:%S"),
        "result": "Successful"
    }

    # ==========================
    # SAVE TO DATABASE
    # ==========================

    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO flash_logs 
        (version, device, board, port, date, time, result)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        summary["version"],
        summary["device"],
        summary["board"],
        summary["port"],
        summary["date"],
        summary["time"],
        summary["result"]
    ))

    conn.commit()
    conn.close()

    return jsonify({
        "status": "success",
        "flash_summary": summary
    })

# ==========================
# MAIN
# ==========================

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
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

# PlatformIO project folder
PIO_PROJECT = os.path.join(os.getcwd(), "platformio_project")

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

        return "unknown"

    except:
        return "unknown"

# ==========================
# UNIVERSAL DEVICE DETECTION
# ==========================

def detect_board():

    ports = serial.tools.list_ports.comports()

    for p in ports:
        hwid = p.hwid.lower()

        # Arduino Uno
        if "2341:0043" in hwid:
            return ("uno", p.device, "Arduino Uno", "atmelavr", "arduino")

        # Arduino Mega
        if "2341:0010" in hwid:
            return ("megaatmega2560", p.device, "Arduino Mega", "atmelavr", "arduino")

        # ESP32 (CP210x)
        if "10c4:ea60" in hwid:
            return ("esp32dev", p.device, "ESP32", "espressif32", "arduino")

        # STM32 ST-Link
        if "0483:374b" in hwid:
            return ("nucleo_f401re", p.device, "STM32 Nucleo", "ststm32", "mbed")

    return None, None, None, None, None
# ==========================
# HOME ROUTE
# ==========================

@app.route("/")
def home():
    return "Backend Running"

# ==========================
# FIRMWARE INFO
# ==========================

@app.route("/firmware-info", methods=["POST"])
def firmware_info():

    if "file" not in request.files:
        return jsonify({
            "status": "error",
            "message": "No file uploaded"
        }), 400

    file = request.files["file"]
    fp = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(fp)

    info = {
        "version": compute_firmware_hash(fp),
        "board": detect_board_from_hex(fp),
        "date": datetime.now().strftime("%Y-%m-%d"),
        "time": datetime.now().strftime("%H:%M:%S")
    }

    return jsonify({
        "status": "success",
        "details": info
    })

# ==========================
# FLASH USING PLATFORMIO
# ==========================

def flash_with_platformio(board, port, platform, framework, firmware):

    os.makedirs(PIO_PROJECT, exist_ok=True)

    ini_path = os.path.join(PIO_PROJECT, "platformio.ini")

    # ==========================
    # MODIFY HERE: add upload_flags
    # ==========================
    with open(ini_path, "w") as f:
        f.write(f"""
[env:upload]
platform = {platform}
board = {board}
framework = {framework}
upload_port = {port}

upload_flags =
    -Uflash:w:{firmware}:i
""")

    # create dummy source (still required by PlatformIO)
    src_dir = os.path.join(PIO_PROJECT, "src")
    os.makedirs(src_dir, exist_ok=True)

    dummy_file = os.path.join(src_dir, "main.cpp")

    with open(dummy_file, "w") as f:
        f.write("""
#include <Arduino.h>

void setup() {}

void loop() {}
""")

    cmd = [
        "pio",
        "run",
        "-e", "upload",
        "--target", "upload",
        "--project-dir", PIO_PROJECT
    ]

    return subprocess.run(cmd, capture_output=True, text=True)
# ==========================
# FLASH FIRMWARE
# ==========================

@app.route("/flash", methods=["POST"])
def flash():

    if "firmware" not in request.files:
        return jsonify({
            "status": "error",
            "message": "Firmware not provided"
        }), 400

    firmware = request.files["firmware"]

    filename = f"{datetime.now().timestamp()}_{firmware.filename}"
    fp = os.path.join(UPLOAD_FOLDER, filename)
    firmware.save(fp)

    board, port, device_name, platform, framework = detect_board()

    if not port:
        return jsonify({
            "status": "error",
            "message": "Device not detected"
        }), 400

    result = flash_with_platformio(board, port, platform, framework, fp)

    if result.returncode != 0:
        return jsonify({
            "status": "error",
            "message": "Flash failed",
            "details": result.stderr
        }), 500

    summary = {
        "version": compute_firmware_hash(fp),
        "device": device_name,
        "board": board,
        "port": port,
        "date": datetime.now().strftime("%Y-%m-%d"),
        "time": datetime.now().strftime("%H:%M:%S"),
        "result": "Successful"
    }

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
    app.run(host="0.0.0.0", port=5000, debug=False)
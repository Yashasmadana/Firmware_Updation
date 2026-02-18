import os
import subprocess
from flask import Flask, request, jsonify
from flask_cors import CORS

# ==============================
# CONFIGURATION
# ==============================


AVRDUDE_PATH = r"C:\Users\rithi\AppData\Local\Arduino15\packages\arduino\tools\avrdude\8.0.0-arduino1\bin\avrdude.exe"
CONF_PATH = r"C:\Users\rithi\AppData\Local\Arduino15\packages\arduino\tools\avrdude\8.0.0-arduino1\etc\avrdude.conf"

DEFAULT_MCU = "atmega328p"   # Arduino UNO
PROGRAMMER_TYPE = "arduino"
DEFAULT_BAUDRATE = "115200"

UPLOAD_FOLDER = "uploads"

# ==============================
# FLASK SETUP
# ==============================
print("Checking if avrdude exists:")
print(os.path.exists(AVRDUDE_PATH))
print("Checking if config exists:")
print(os.path.exists(CONF_PATH))


app = Flask(__name__)
CORS(app)

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# ==============================
# ROUTES
# ==============================

@app.route("/")
def home():
    return "Firmware Flashing Backend Running"


@app.route("/flash", methods=["POST"])
def flash_firmware():
    try:
        if "file" not in request.files:
            return jsonify({"status": "error", "message": "No file uploaded"})

        file = request.files["file"]
        port = request.form.get("port")

        if not port:
            return jsonify({"status": "error", "message": "No COM port provided"})

        filename = file.filename
        filepath = os.path.abspath(os.path.join(UPLOAD_FOLDER, filename))
        file.save(filepath)

        print("\n===== FLASHING STARTED =====")
        print("File:", filepath)
        print("Port:", port)

        command = [
            AVRDUDE_PATH,
            "-C", CONF_PATH,
            "-v",
            "-p", DEFAULT_MCU,
            "-c", PROGRAMMER_TYPE,
            "-P", port,
            "-b", DEFAULT_BAUDRATE,
            "-D",
            "-U", f"flash:w:{filepath}:i"
        ]

        print("\nRunning command:")
        print(command)

        result = subprocess.run(
            command,
            capture_output=True,
            text=True
        )

        print("\n===== AVRDUDE OUTPUT =====")
        print(result.stdout)
        print(result.stderr)

        if result.returncode == 0:
            print("FLASH SUCCESS\n")
            return jsonify({"status": "success"})
        else:
            print("FLASH FAILED\n")
            return jsonify({"status": "failed", "error": result.stderr})

    except Exception as e:
        print("EXCEPTION:", str(e))
        return jsonify({"status": "error", "message": str(e)})


# ==============================
# MAIN
# ==============================

if __name__ == "__main__":
    app.run(debug=True)

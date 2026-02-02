

# 🔌 STM32 Web-Based Firmware Update System (UART)

## 📌 Project Overview

This project implements a **web-based firmware update system** for STM32 microcontrollers using **UART communication**.

The system allows a user to upload firmware from a **browser**, which is then safely transmitted via a **PC backend service** to an STM32 device running a **custom bootloader**.

> 🎯 Goal: Achieve a **tool-less, debugger-free firmware update flow** similar to OTA systems used in industry.

---

## 🏗️ High-Level Architecture

```
Web Browser (Frontend)
        ↓ HTTP / WebSocket
PC Backend Server
        ↓ UART (USB-Serial)
STM32 Bootloader
        ↓
STM32 Flash Memory
```

⚠️ **Important**:
The browser **never directly accesses hardware**.
All UART communication is handled by the backend service.

---

## 🧩 System Components

### 1️⃣ Frontend (Web UI)

**Purpose:** User interaction & visualization only.

**Responsibilities**

* Upload firmware (`.bin`)
* Show flashing progress
* Display logs & status
* Trigger update/reset commands

**Tech Stack**

* HTML, CSS, JavaScript
* Frameworks:

  * ✅ React.js (recommended)
  * Vue.js (optional)
  * Angular  (optional)

**Not Allowed**

* ❌ UART access
* ❌ Flashing logic
* ❌ Timing assumptions

---

### 2️⃣ Backend (PC-Side Service)

**Purpose:** Acts as the **bridge + intelligence layer**.

**Core Responsibilities**

* Open & manage UART connection
* Implement firmware update protocol
* Split firmware into packets
* Handle ACK / NACK, retries, timeouts
* Log all operations

**Framework Options**

* **Python (Recommended)**

  * Flask / FastAPI
  * pySerial
* Node.js

  * Express.js
  * serialport

---

### 3️⃣ Enhanced Backend (Data Science Scope)

**Purpose:** Convert flashing into a **data-driven system**.

**Responsibilities**

* Log firmware update metrics
* Analyze reliability & failures
* Detect anomalies
* Predict update failures

**Data Logged**

* Firmware version
* Flash duration
* Retry count
* CRC failures
* Success / failure status

**Tech Stack**

* pandas, numpy
* matplotlib / plotly
* scikit-learn
* SQLite / CSV / JSON

---

### 4️⃣ Firmware (STM32 Bootloader)

**Purpose:** Ensure **safe, reliable firmware updates**.

**Responsibilities**

* UART command parsing
* Flash erase/write
* CRC / checksum validation
* Error handling
* Jump to application safely

**Critical Rules**

* Bootloader resides in protected flash
* Never overwrite bootloader
* Always verify written data
* Never jump on invalid firmware



---

## 🔁 Firmware Update Flow

1. Backend sends `START`
2. STM32 replies `READY`
3. Firmware sent in fixed-size packets
4. STM32 replies `ACK / NACK`
5. Backend retries if needed
6. Backend sends `END`
7. STM32 verifies & jumps to application

---



---

## 🧪 Testing Strategy

* Small firmware flashing
* Corrupted packet injection
* UART timeout testing
* Power reset during flashing
* Multiple firmware version tests

---



## 👨‍💻 Maintainer

**Firmware & System Architecture:**
Yashas

you in **tech-lead territory** 👌

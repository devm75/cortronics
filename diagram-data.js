/* Cortronics — functional block and board-placement data for every project.
 * These are engineering sketches derived from the blueprints: block-level
 * schematics and 2D placement diagrams, not fabrication-ready PCB files.
 */
(function () {
  "use strict";

  const b = (id, label, sub, kind, col, row) => ({ id, label, sub, kind, col, row });
  const w = (from, to, net, type) => ({ from, to, net, type: type || "signal" });

  window.DIAGRAMS = {
    "v1-bench-psu": {
      stages: [
        b("in", "12V DC INPUT", "2.1mm barrel jack", "power", 0, 0),
        b("fuse", "PROTECTION", "Fuse + 1N4007", "protection", 1, 0),
        b("reg", "LM317 REGULATOR", "240Ω + 2kΩ pot", "analog", 2, 0),
        b("out", "1.25–12V OUT", "Banana terminals", "io", 3, 0),
        b("load", "TEST LOAD", "Power resistor", "load", 3, 1),
        b("scope", "OSCILLOSCOPE", "AC-coupled ripple", "io", 1, 1),
      ],
      wires: [w("in", "fuse", "12V", "power"), w("fuse", "reg", "VIN", "power"), w("reg", "out", "VOUT", "power"), w("out", "load", "ILOAD", "power"), w("out", "scope", "RIPPLE", "measure"), w("reg", "scope", "ADJ", "measure")],
      zones: ["Input bulk capacitance", "Adjust network placed close to LM317", "Copper heatsink area for pass transistor"],
      note: "Keep the adjust-divider wiper short and route the high-current path away from the sense node.",
    },

    "v1-bench-fgen": {
      stages: [
        b("pwr", "5V RAIL", "Decoupled supply", "power", 0, 0),
        b("schmitt", "LM358 SCHMITT", "Square oscillator", "analog", 1, 0),
        b("integ", "RC INTEGRATOR", "Triangle wave", "analog", 2, 0),
        b("shape", "DIODE SHAPER", "Sine approximation", "passive", 3, 0),
        b("pots", "FREQ / AMP", "Potentiometers", "passive", 0, 1),
        b("scope", "DUAL-TRACE SCOPE", "X-Y mode check", "io", 2, 1),
      ],
      wires: [w("pwr", "schmitt", "5V", "power"), w("pots", "schmitt", "RC", "measure"), w("schmitt", "integ", "SQUARE", "signal"), w("integ", "shape", "TRIANGLE", "signal"), w("shape", "scope", "SINE", "measure"), w("schmitt", "scope", "CH1", "measure")],
      zones: ["Short integrator capacitor leads", "Keep diode network symmetric", "Separate analog and scope grounds at one point"],
      note: "The shaping network is deliberately approximate — use the scope's X-Y mode to inspect symmetry.",
    },

    "v1-bench-classab": {
      stages: [
        b("in", "LINE INPUT", "1 kHz test tone", "io", 0, 0),
        b("pre", "LM358 PREAMP", "Voltage gain stage", "analog", 1, 0),
        b("bias", "1N4148 ×2", "VBE bias diodes", "passive", 1, 1),
        b("out", "BD139 / BD140", "Push-pull emitter followers", "power", 2, 0),
        b("spk", "4–8Ω SPEAKER", "Output load", "load", 3, 0),
        b("scope", "SCOPE CH2", "Crossover region", "io", 3, 1),
      ],
      wires: [w("in", "pre", "AUDIO", "signal"), w("bias", "out", "BIAS", "measure"), w("pre", "out", "DRIVE", "signal"), w("out", "spk", "AMPLIFIED", "power"), w("spk", "scope", "VOUT", "measure"), w("pre", "scope", "CH1", "measure")],
      zones: ["Thermal coupling of bias diodes to output devices", "Heatsink keepout", "Star ground at speaker return"],
      note: "Bias diodes must track output transistor temperature to avoid thermal runaway.",
    },

    "v1-power-profiler": {
      stages: [
        b("dut", "DUT POWER RAIL", "3.3V / 5V load", "power", 0, 0),
        b("rc", "RC TEST CIRCUIT", "Step-load network", "passive", 1, 0),
        b("ina", "INA219", "I2C current / voltage", "sensor", 2, 0),
        b("esp", "ESP32-S3 N16R8", "FreeRTOS Core 0/1", "mcu", 3, 0),
        b("ram", "PSRAM RING BUF", "Deterministic frames", "passive", 2, 1),
        b("ui", "WEBSOCKET DASH", "Live web scope", "io", 3, 1),
      ],
      wires: [w("dut", "rc", "VRAIL", "power"), w("rc", "ina", "ISENSE", "measure"), w("ina", "esp", "I2C", "signal"), w("esp", "ram", "DMA", "signal"), w("esp", "ui", "WS BINARY", "signal")],
      zones: ["Keep I2C runs short", "Dedicated 3.3V analog island for INA219", "Debug GPIO broken out to scope"],
      note: "Toggle a debug GPIO inside the sampling ISR to prove jitter-free intervals on the scope.",
    },

    "v1-esnow-mesh": {
      stages: [
        b("bat", "18650 + LDO", "Deep-sleep sender", "power", 0, 0),
        b("sense", "BME280 + SOIL", "I2C / analog sensors", "sensor", 1, 0),
        b("tx", "CLASSIC ESP32", "ESP-NOW burst <5ms", "mcu", 2, 0),
        b("gw", "ESP32-S3 GATEWAY", "Always-on receiver", "mcu", 3, 0),
        b("tft", "2.8\" TOUCH TFT", "LVGL hub UI", "io", 3, 1),
        b("mqtt", "MQTT BROKER", "Telemetry bridge", "comm", 2, 1),
      ],
      wires: [w("bat", "tx", "3V3", "power"), w("sense", "tx", "I2C", "signal"), w("tx", "gw", "ESP-NOW", "rf"), w("gw", "tft", "SPI", "signal"), w("gw", "mqtt", "WIFI", "comm")],
      zones: ["1Ω shunt in series with sender supply", "Antenna keepout at board edge", "Separate battery and TFT rails"],
      note: "Profile sleep vs TX current across the 1Ω shunt; the burst is far shorter than it looks.",
    },

    "v1-voice-fft": {
      stages: [
        b("mic", "INMP441", "I2S MEMS mic", "sensor", 0, 0),
        b("esp", "ESP32-S3", "I2S DMA + PSRAM", "mcu", 1, 0),
        b("fft", "FFT + ESP-SR", "Bins + wake word", "mcu", 2, 0),
        b("led", "WS2812B", "Spectrum strip", "load", 3, 0),
        b("relay", "2-CH OPTO RELAY", "Locally switched load", "load", 3, 1),
        b("amp", "MAX98357A + SPK", "I2S playback", "load", 2, 1),
      ],
      wires: [w("mic", "esp", "I2S", "signal"), w("esp", "fft", "PCM", "signal"), w("fft", "led", "LED DATA", "signal"), w("fft", "relay", "GPIO", "signal"), w("fft", "amp", "I2S OUT", "signal")],
      zones: ["I2S BCLK / WS / SD broken out to scope", "Relay opto-isolation gap", "5V LED rail separate from logic"],
      note: "Wake-word detection runs on-device — no cloud round-trip and no audio leaving the board.",
    },

    "v1-pid-gimbal": {
      stages: [
        b("imu", "MPU6050", "6-axis IMU", "sensor", 0, 0),
        b("esp", "ESP32-S3 PID", "200 Hz control loop", "mcu", 1, 0),
        b("fuse", "KALMAN FILTER", "Sensor fusion", "mcu", 2, 0),
        b("pan", "SG90 PAN", "LEDC PWM", "load", 3, 0),
        b("tilt", "SG90 TILT", "LEDC PWM", "load", 3, 1),
        b("pwr", "5V SERVO RAIL", "Dedicated supply", "power", 0, 1),
      ],
      wires: [w("imu", "esp", "I2C", "signal"), w("esp", "fuse", "ACC + GYRO", "signal"), w("fuse", "pan", "PWM 50Hz", "signal"), w("fuse", "tilt", "PWM 50Hz", "signal"), w("pwr", "pan", "5V", "power"), w("pwr", "tilt", "5V", "power")],
      zones: ["4.7kΩ I2C pull-ups", "Servo rail isolated from MCU rail", "I2C rise-time test point"],
      note: "Servo current must not share the MCU's 3.3V regulator — use a dedicated 5V rail.",
    },

    "v1-env-logger": {
      stages: [
        b("gps", "NEO-6M GPS", "UART NMEA", "comm", 0, 0),
        b("bme", "BME280", "Temp / humidity / P", "sensor", 0, 1),
        b("esp", "ESP32-S3", "Parse + CRC", "mcu", 1, 0),
        b("sd", "MICROSD SPI", "FAT32 CSV store", "io", 2, 0),
        b("sync", "WIFI SYNC", "Store-and-forward", "comm", 3, 0),
        b("buf", "CRC + RING BUFFER", "Unsent row queue", "passive", 2, 1),
      ],
      wires: [w("gps", "esp", "UART", "signal"), w("bme", "esp", "I2C", "signal"), w("esp", "sd", "SPI", "signal"), w("esp", "buf", "ROWS", "signal"), w("buf", "sync", "BACKOFF", "comm")],
      zones: ["Short SPI SCLK / MOSI traces", "SD card power decoupling", "GPS antenna clear of copper"],
      note: "Verify clean 3.3V logic transitions on SPI during SD block writes.",
    },

    "v2-car-tracker": {
      stages: [
        b("car", "CAR 12–14.4V", "Ignition-switched input", "power", 0, 0),
        b("prot", "FUSE + TVS", "1N5408 + 27V TVS", "protection", 1, 0),
        b("buck", "LM2596 5V", "1000µF bulk cap", "power", 2, 0),
        b("ups", "18650 + TP4056", "Ignition-off backup", "power", 1, 1),
        b("esp", "ESP32-S3", "NMEA + MQTT", "mcu", 2, 1),
        b("gnss", "SIM7670C", "4G LTE + GNSS", "comm", 3, 0),
        b("sd", "MICROSD", "5s-fix blackbox", "io", 3, 1),
      ],
      wires: [w("car", "prot", "VBAT", "power"), w("prot", "buck", "12V", "power"), w("ups", "buck", "UPS", "power"), w("buck", "esp", "5V", "power"), w("esp", "gnss", "UART", "signal"), w("esp", "sd", "SPI", "signal"), w("gnss", "sd", "FIX LOG", "signal")],
      zones: ["Automotive load-dump suppression", "GSM antenna keepout", "Fuse and TVS closest to the input"],
      note: "The 4G module needs its own bulk capacitance — transmit current spikes are large.",
    },

    "v2-cctv": {
      stages: [
        b("supply", "5V LOW-RIPPLE", "Dedicated camera rail", "power", 0, 0),
        b("dec", "470µF + 100nF", "On-pin decoupling", "passive", 1, 0),
        b("cam", "ESP32-CAM", "OV2640 sensor", "mcu", 2, 0),
        b("wifi", "WIFI STREAM", "MJPEG / RTSP", "comm", 3, 0),
        b("sd", "MICROSD", "Local snapshots", "io", 2, 1),
        b("ha", "HOME ASSISTANT", "Live view + alerts", "io", 3, 1),
      ],
      wires: [w("supply", "dec", "5V", "power"), w("dec", "cam", "5V CLEAN", "power"), w("cam", "wifi", "TCP", "comm"), w("cam", "sd", "SPI", "signal"), w("wifi", "ha", "ESPHOME", "comm")],
      zones: ["470µF directly at the camera 5V/GND pins", "Antenna over board edge", "Separate camera and logic grounds at one point"],
      note: "Brownouts are a rail-impedance problem, not a firmware bug — decouple at the load.",
    },

    "v2-smart-switchboard": {
      stages: [
        b("mains", "220V AC IN", "Line + neutral", "mains", 0, 0),
        b("fuse", "2A FUSE + MOV", "AC line protection", "protection", 1, 0),
        b("hlk", "HLK-PM01", "Isolated 220V→5V", "power", 2, 0),
        b("rocker", "WALL ROCKER", "Physical switch", "io", 0, 1),
        b("opto", "PC817 OPTO", "Isolated sense", "protection", 1, 1),
        b("esp", "ESP32", "App state + logic", "mcu", 2, 1),
        b("relay", "RELAY + SNUBBER", "100Ω + 0.1µF X2", "load", 3, 0),
        b("fan", "CEILING FAN", "Inductive load", "load", 3, 1),
      ],
      wires: [w("mains", "fuse", "L/N", "mains"), w("fuse", "hlk", "AC", "mains"), w("hlk", "esp", "5V", "power"), w("rocker", "opto", "SWITCH", "mains"), w("opto", "esp", "GPIO", "signal"), w("esp", "relay", "DRIVE", "signal"), w("relay", "fan", "SWITCHED L", "mains")],
      zones: ["≥6mm creepage AC to 3.3V", "Fuse + MOV before all else", "Flame-retardant enclosure", "RC snubber across relay contacts"],
      note: "No copper connection between the wall switch sense and the ESP32 — opto-isolation is mandatory.",
    },

    "v2-rover": {
      stages: [
        b("bat", "2S 18650 + BMS", "7.4–8.4V pack", "power", 0, 0),
        b("drv", "TB6612FNG", "Dual motor driver", "power", 1, 0),
        b("mot", "4× BO MOTORS", "Skid-steer banks", "load", 2, 0),
        b("buck", "LM2596 5V", "Isolated camera rail", "power", 1, 1),
        b("cam", "ESP32-CAM", "Live video node", "mcu", 2, 1),
        b("joy", "MJPEG + WS JOYSTICK", "Operator control", "io", 3, 1),
        b("led", "IRLZ44N HEADLIGHTS", "PWM-dimmed LEDs", "load", 3, 0),
      ],
      wires: [w("bat", "drv", "VBAT", "power"), w("drv", "mot", "MOTOR", "power"), w("bat", "buck", "VBAT", "power"), w("buck", "cam", "5V CLEAN", "power"), w("cam", "joy", "VIDEO", "comm"), w("bat", "led", "VLED", "power")],
      zones: ["0.1µF across every motor terminal", "Star ground after the buck", "Antenna clear of motor wiring"],
      note: "Motor stall current must never appear on the camera's 5V rail — keep the rails separate.",
    },

    "v2-bicycle-generator": {
      stages: [
        b("gen", "24V PMDC GEN", "Chain-coupled motor", "power", 0, 0),
        b("cap", "4700µF / 50V", "Pedal-ripple buffer", "passive", 1, 0),
        b("diode", "MBR4045 + 10A FUSE", "Reverse-block + protect", "protection", 2, 0),
        b("cc", "XL4016 CC/CV", "14.2V / 2–3A", "power", 3, 0),
        b("bat", "12V BATTERY", "Lead-acid / LiFePO4", "load", 3, 1),
        b("gauge", "LM3914 + 10 LED", "Analog SoC bar", "io", 2, 1),
      ],
      wires: [w("gen", "cap", "VEMF", "power"), w("cap", "diode", "RECT", "power"), w("diode", "cc", "VIN", "power"), w("cc", "bat", "CHARGE", "power"), w("bat", "gauge", "VSENSE", "measure")],
      zones: ["Schottky closest to the battery", "Large electrolytic near generator", "Gauge divider across battery terminals"],
      note: "Set CC to roughly C/10. No MCU, no firmware — the whole charging chain is analog.",
    },

    "v2-almirah-light": {
      stages: [
        b("supply", "5V / 12V", "LED supply", "power", 0, 0),
        b("reed", "NC REED SWITCH", "Door position", "io", 0, 1),
        b("pull", "1MΩ PULL-UP", "Gate bias", "passive", 1, 1),
        b("mos", "IRLZ44N", "Logic-level N-MOSFET", "power", 2, 0),
        b("led", "COB LED STRIP", "Interior lighting", "load", 3, 0),
      ],
      wires: [w("supply", "mos", "+V", "power"), w("reed", "mos", "GATE-SOURCE", "signal"), w("pull", "mos", "VGS", "signal"), w("mos", "led", "SWITCHED GND", "power")],
      zones: ["Reed switch between gate and source", "0µA standby when door is closed", "No MCU, no regulator quiescent draw"],
      note: "Door closed holds VGS at 0V; opening lets the 1MΩ pull-up saturate the MOSFET instantly.",
    },

    "v3-bldc-foc": {
      stages: [
        b("dc", "DC BUS + CAPS", "Low-ESR polymer", "power", 0, 0),
        b("gate", "DRV8301 GATE", "Bootstrap + dead-time", "power", 1, 0),
        b("inv", "6× MOSFET 3Φ", "Half-bridge inverter", "power", 2, 0),
        b("motor", "BLDC / PMSM", "3-phase motor", "load", 3, 0),
        b("shunt", "1–5mΩ SHUNTS", "INA240 sensing", "sensor", 1, 1),
        b("enc", "MT6701 ENCODER", "14-bit magnetic", "sensor", 2, 1),
        b("mcu", "ESP32-S3 FOC", "Clarke/Park + PI", "mcu", 3, 1),
      ],
      wires: [w("dc", "gate", "VBUS", "power"), w("gate", "inv", "GATE", "power"), w("inv", "motor", "U/V/W", "power"), w("inv", "shunt", "ISHUNT", "measure"), w("shunt", "mcu", "ADC", "signal"), w("enc", "mcu", "SPI", "signal"), w("mcu", "gate", "PWM", "signal")],
      zones: ["Kelvin routing from shunt pads", "PGND / AGND joined at one star point", "Gate-drive loop area minimised", "DC-link bulk caps across the bridge"],
      note: "Verify 300–500ns dead-time before spinning the motor. Zero shoot-through is measured, not assumed.",
    },

    "v3-power-analyzer": {
      stages: [
        b("mains", "3Φ MAINS", "Voltage divider chain", "mains", 0, 0),
        b("ct", "3× SPLIT-CORE CT", "0.1% burden resistors", "sensor", 0, 1),
        b("iso", "AMC1301 ×3", "5kVrms isolation", "protection", 1, 0),
        b("afe", "AA FILTER + REF", "1.65V mid-rail", "passive", 2, 0),
        b("adc", "SIMULTANEOUS ADC", "Timer + DMA 12.8kSPS", "sensor", 3, 0),
        b("dsp", "FFT / TRUE RMS", "THD to 31st harmonic", "mcu", 2, 1),
        b("bus", "RS-485 + MQTT", "Modbus RTU / TLS", "comm", 3, 1),
      ],
      wires: [w("mains", "iso", "V SENSE", "mains"), w("ct", "iso", "I SENSE", "measure"), w("iso", "afe", "ISOLATED OUT", "signal"), w("afe", "adc", "AFE", "signal"), w("adc", "dsp", "DMA", "signal"), w("dsp", "bus", "TELEMETRY", "comm")],
      zones: ["Reinforced isolation barrier", "Isolated DC-DC bias (SN6501)", "Analog ground island", "Creepage across the barrier"],
      note: "Verify phase alignment on a resistive load before trusting the power-factor readout.",
    },

    "v3-slam-ugv": {
      stages: [
        b("bat", "4S LIPO 14.8V", "Main power", "power", 0, 0),
        b("pdb", "PDB + E-FUSE", "TPS54560 / TPS25942", "power", 1, 0),
        b("mot", "4× GEARED MOTOR", "Wheel drive", "load", 2, 0),
        b("enc", "ENC + BNO085", "Odometry + 9-DoF IMU", "sensor", 1, 1),
        b("rt", "ESP32-S3", "micro-ROS 100Hz PID", "mcu", 2, 1),
        b("sbc", "RPI5 / JETSON", "ROS 2 + SLAM Toolbox", "mcu", 3, 0),
        b("lidar", "360° LIDAR", "Point cloud", "sensor", 3, 1),
      ],
      wires: [w("bat", "pdb", "VBAT", "power"), w("pdb", "mot", "VMOTOR", "power"), w("pdb", "rt", "5V 5A", "power"), w("enc", "rt", "PCNT / I2C", "signal"), w("rt", "sbc", "UART / CAN", "comm"), w("lidar", "sbc", "USB", "signal")],
      zones: ["Hardware E-stop relay interlock", "Reverse-polarity MOSFET protection", "Motor EMI away from logic rails", "Star point under the PDB"],
      note: "Check encoder pulse integrity at full PWM duty — motor switching noise must not reach the logic rails.",
    },

    "v3-lorawan-mesh": {
      stages: [
        b("solar", "SOLAR + CN3791", "MPPT charger", "power", 0, 0),
        b("cell", "LiFePO4 3.2V", "Field battery", "power", 0, 1),
        b("mcu", "ESP32-C6 / STM32WL", "Node controller", "mcu", 1, 0),
        b("sw", "TPS22918", "Sensor load switch", "power", 1, 1),
        b("lora", "SX1262 + MATCH", "50Ω Pi network", "comm", 2, 0),
        b("ant", "SMA ANTENNA", "Sub-GHz", "io", 3, 0),
        b("gw", "CONCENTRATOR", "Multi-channel gateway", "comm", 2, 1),
      ],
      wires: [w("solar", "cell", "CHARGE", "power"), w("cell", "mcu", "VCC", "power"), w("mcu", "sw", "LOAD EN", "signal"), w("mcu", "lora", "SPI", "signal"), w("lora", "ant", "RF 50Ω", "rf"), w("lora", "gw", "LoRaWAN", "rf")],
      zones: ["<15µA deep-sleep floor", "RF keepout and solid ground under antenna", "Load switch cuts all sensor VCC", "Solar input reverse protection"],
      note: "Measure wake inrush across a 10Ω shunt to validate energy per transmitted packet.",
    },

    "v3-usb-scope": {
      stages: [
        b("bnc", "BNC INPUT ×2", "±50V tolerant", "io", 0, 0),
        b("atten", "1×/10×/100×", "Relay attenuator", "passive", 1, 0),
        b("afe", "OPA354 AFE", "JFET buffer + trimmer", "analog", 2, 0),
        b("adc", "20–40 MSPS ADC", "Parallel output", "sensor", 3, 0),
        b("trig", "TLV3501", "Hardware edge trigger", "analog", 2, 1),
        b("esp", "ESP32-S3 DMA", "I2S capture to PSRAM", "mcu", 3, 1),
        b("usb", "WEBUSB / WEBGL", "60fps browser scope", "io", 3, 2),
      ],
      wires: [w("bnc", "atten", "VIN", "measure"), w("atten", "afe", "ATTEN", "measure"), w("afe", "adc", "ANALOG", "signal"), w("trig", "adc", "TRIGGER", "signal"), w("adc", "esp", "DATA BUS", "signal"), w("esp", "usb", "BINARY", "comm")],
      zones: ["Compensated 1MΩ || 15pF input", "Guard ring around high-Z node", "Short ADC clock trace", "Separate analog and digital returns"],
      note: "Feed a fast 1MHz square edge and tune the trimmer until overshoot disappears.",
    },
  };
})();

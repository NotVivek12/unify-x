# UNIFY-X

### Edge AI for Real-Time Spoilage Detection in Cold-Chain Logistics

> **Transport intelligence, not just monitoring.**

UNIFY-X is a distributed **IoT + Edge AI logistics monitoring system** designed to detect environmental conditions that can lead to food spoilage during transportation.

Instead of simply displaying sensor values, UNIFY-X combines **multi-sensor data, transport context, temporal patterns, and machine-learning inference** to determine whether a shipment is:

**GOOD · BAD · UNCERTAIN**

The system is built around a **Raspberry Pi Edge Master**, which acts as the central intelligence and decision-making layer. ESP32-based sensor nodes collect physical-world data and transmit structured measurements to the Raspberry Pi, where validation, sensor fusion, feature extraction, contextual analysis, and ML inference happen locally.

The end user interacts with the system through web/mobile interfaces rather than directly interpreting raw sensor measurements.

---

## Table of Contents

* [Overview](#overview)
* [The Problem](#the-problem)
* [Our Approach](#our-approach)
* [Key Idea](#key-idea)
* [System Architecture](#system-architecture)
* [Hardware Architecture](#hardware-architecture)
* [Sensor Nodes](#sensor-nodes)
* [Raspberry Pi Edge Master](#raspberry-pi-edge-master)
* [Edge AI Pipeline](#edge-ai-pipeline)
* [Decision Engine](#decision-engine)
* [Data Flow](#data-flow)
* [Backend API](#backend-api)
* [Mobile Node Companion](#mobile-node-companion)
* [Web Dashboard](#web-dashboard)
* [Continuous Learning](#continuous-learning)
* [Explainable AI](#explainable-ai)
* [Project Structure](#project-structure)
* [Technology Stack](#technology-stack)
* [Current Implementation](#current-implementation)
* [MVP Scope](#mvp-scope)
* [Future Roadmap](#future-roadmap)
* [Getting Started](#getting-started)
* [API Example](#api-example)
* [Design Philosophy](#design-philosophy)
* [Why Edge AI](#why-edge-ai)
* [Statistical Motivation](#statistical-motivation)
* [Limitations](#limitations)
* [Contributing](#contributing)
* [License](#license)

---

# Overview

Food transported through a cold chain is exposed to continuously changing environmental conditions.

A shipment may experience:

* Temperature excursions
* Excessive humidity
* Gas/VOC changes
* Poor ventilation
* Long transport durations
* Repeated handling
* Shock and vibration
* Sensor failures
* Cold-chain interruptions

Traditional monitoring systems generally expose these values as dashboards.

UNIFY-X takes a different approach:

```text
Sensors
   ↓
Data
   ↓
Context
   ↓
Features
   ↓
Machine Learning
   ↓
Decision
```

The goal is not simply to answer:

> "What is the temperature?"

but:

> **"What does the transportation history mean for the condition of this shipment?"**

---

# The Problem

A sensor reading by itself does not necessarily indicate whether a product is still safe.

For example:

```text
Temperature = 8°C
```

is not enough information.

The system also needs to understand:

* How long was the shipment exposed?
* Was the temperature rising or falling?
* What temperature is appropriate for this product?
* How many excursions occurred?
* What were the humidity and gas trends?
* Did multiple sensors observe the same anomaly?
* Where in the transportation journey did it happen?
* Is the current condition recovering or deteriorating?

A number tells us **what happened**.

UNIFY-X attempts to determine **what it means**.

---

# Our Approach

UNIFY-X separates the system into two major layers.

### Field Layer

ESP32-based sensor nodes continuously acquire physical-world data.

### Edge Intelligence Layer

A Raspberry Pi receives the sensor data and performs:

* Data validation
* Sensor fusion
* Temporal analysis
* Feature extraction
* Transport-context integration
* Machine-learning inference
* Decision generation
* Local storage
* API serving

The result is a shipment-level decision:

```text
GOOD
BAD
UNCERTAIN
```

with an associated confidence score.

---

# Key Idea

## A number ≠ a decision

Traditional monitoring:

```text
Temperature: 8.2°C
Humidity: 82%
Gas: 1430
```

UNIFY-X:

```text
                    ┌──────────────┐
                    │ SENSOR DATA  │
                    └──────┬───────┘
                           ↓
                  ┌─────────────────┐
                  │ TEMPORAL PATTERN│
                  └──────┬──────────┘
                         ↓
                  ┌─────────────────┐
                  │ TRANSPORT       │
                  │ CONTEXT         │
                  └──────┬──────────┘
                         ↓
                  ┌─────────────────┐
                  │ EDGE ML ENGINE  │
                  └──────┬──────────┘
                         ↓
               ┌─────────────────────┐
               │ GOOD / BAD /        │
               │ UNCERTAIN           │
               └─────────────────────┘
```

The system is therefore **shipment-centric rather than sensor-centric**.

---

# System Architecture

```text
                         FIELD
                  ┌──────────────────┐
                  │ ESP32 Sensor Node│
                  │                  │
                  │ Temperature      │
                  │ Humidity         │
                  │ Gas / VOC        │
                  │ Light            │
                  │ GPS / IMU        │
                  └────────┬─────────┘
                           │
                           │ Wi-Fi
                           │ HTTP / JSON
                           ▼
              ┌────────────────────────────┐
              │     RASPBERRY PI MASTER    │
              │                            │
              │  Data Ingestion             │
              │       ↓                    │
              │  Validation                │
              │       ↓                    │
              │  Sensor Fusion             │
              │       ↓                    │
              │  Time-Window Buffer        │
              │       ↓                    │
              │  Feature Extraction        │
              │       ↓                    │
              │  Transport Context         │
              │       ↓                    │
              │  Edge ML Engine            │
              │       ↓                    │
              │  Decision Engine            │
              │                            │
              │  GOOD / BAD / UNCERTAIN   │
              │                            │
              │  SQLite + REST + WebSocket│
              └────────────┬───────────────┘
                           │
              ┌────────────┼─────────────┐
              │            │             │
              ▼            ▼             ▼
         Web Dashboard   Mobile App    TFT
              │
              ▼
        Human Feedback
              │
              ▼
       Labeled Dataset
              │
              ▼
        Model Training
              │
              ▼
        Updated Model
              │
              └──────────────► Edge ML
```

The Raspberry Pi is the **central Edge Master and single decision authority**.

There is no requirement for cloud-based ML inference.

---

# Hardware Architecture

UNIFY-X uses distributed ESP32 sensor nodes connected to a central Raspberry Pi.

```text
                    ┌─────────────────────┐
                    │    ESP32 NODE       │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
 Temperature              Humidity                Pressure
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               │
                               ▼
                         Gas / VOC
                               │
                               ▼
                            Light
                               │
                               ▼
                       GPS / Vibration
                               │
                               ▼
                          Accelerometer
                               │
                               ▼
                    Product-specific sensors
                               │
                               ▼
                         Wi-Fi / JSON
                               │
                               ▼
                     Raspberry Pi Master
```

---

# Sensor Nodes

UNIFY-X supports multiple types of sensor nodes depending on the transported product.

## 1. Fish / Seafood Precision Node

The precision node is designed for seafood transportation and includes specialized environmental and gas sensing.

### ESP32

Acts as the local node controller.

### BME680

Measures:

* Temperature
* Humidity
* Pressure
* Gas resistance
* VOC-related information

### BME688

Measures:

* Temperature
* Humidity
* Pressure
* Gas resistance
* VOC-related information
* Heater temperature
* Heater timing
* Operating profile

### ENS160

Provides air-quality information including:

* TVOC
* eCO2
* Air Quality Index

### MiCS-6814

Provides gas measurements including:

* CO
* NH3
* NO2

### ADS1115

Provides high-resolution analog-to-digital conversion for analog sensors.

Used with:

* MiCS-6814 analog channels
* LDR

### LDR

Measures:

* Light intensity

### OLED

Provides local node information such as:

* Node status
* Sensor status
* Connectivity
* Basic measurements

---

# 2. General-Purpose Sensor Node

The General-Purpose Node provides a modular platform for different transported products.

The sensor layer can include:

* Temperature
* Humidity
* Pressure
* Gas / VOC
* Light
* GPS
* Vibration / Shock
* Accelerometer
* Product-specific sensors

Supported interfaces include:

```text
I²C
SPI
UART
GPIO
ADC
```

The node performs:

```text
Sensor Acquisition
       ↓
Basic Validation
       ↓
Calibration
       ↓
Unit Conversion
       ↓
Local Preprocessing
       ↓
JSON Packaging
       ↓
Wi-Fi
       ↓
Raspberry Pi
```

This makes the node architecture modular.

Different sensor combinations can be deployed depending on the product being transported without redesigning the entire system.

---

# Raspberry Pi Edge Master

The Raspberry Pi is the central computing device in UNIFY-X.

It is responsible for:

* Receiving data from ESP32 nodes
* Validating incoming measurements
* Synchronizing sensor data
* Performing sensor fusion
* Maintaining time-window buffers
* Extracting features
* Integrating transport context
* Running ML inference
* Generating final classifications
* Storing historical data
* Serving APIs
* Broadcasting real-time updates

Most importantly:

> **The Raspberry Pi is the single source of truth for the final product classification.**

Sensor nodes and applications do not independently determine whether a shipment is spoiled.

They display or transmit the decision generated by the Edge Master.

---

# Edge AI Pipeline

The complete inference pipeline is:

```text
ESP32 JSON
    ↓
Data Ingestion
    ↓
Data Validation
    ↓
Sensor Fusion
    ↓
Time-Window Buffer
    ↓
Feature Extraction
    ↓
Transport Context Integration
    ↓
Edge ML Engine
    ↓
Decision Engine
```

---

## 1. Data Ingestion

The Raspberry Pi receives structured JSON payloads from multiple ESP32 nodes.

Each payload can contain:

* Node ID
* Timestamp
* Sensor measurements
* Sensor metadata
* Node health information

---

## 2. Data Validation

Incoming measurements are checked for:

* Invalid values
* Missing values
* Out-of-range readings
* Sensor anomalies
* Node health
* Timestamp consistency

This prevents obviously invalid data from directly entering the ML pipeline.

---

## 3. Sensor Fusion

UNIFY-X combines multiple sensor signals instead of relying on a single sensor.

For example:

```text
Temperature
     +
Humidity
     +
Gas / VOC
     +
Air Quality
     +
Light
     +
Transport Duration
     ↓
Combined Environmental State
```

This allows the system to identify patterns that may not be visible from one measurement alone.

---

# Time-Window Analysis

A critical design principle is that **trends matter, not only instantaneous values**.

Instead of:

```text
Temperature = 7.8°C
```

UNIFY-X can analyze:

```text
Temperature over the last N minutes
```

and derive:

* Mean
* Minimum
* Maximum
* Trend
* Slope
* Duration above threshold
* Number of excursions

This allows the system to distinguish between:

```text
Short temporary excursion
```

and:

```text
Prolonged temperature exposure
```

---

# Feature Extraction

The feature extraction layer can generate:

### Temperature

* Mean
* Minimum
* Maximum
* Trend / slope
* Excursion duration
* Excursion count

### Humidity

* Mean
* Minimum
* Maximum
* Trend
* Variability

### Gas / VOC

* Current level
* Mean
* Maximum
* Trend
* Rate of change

### Air Quality

* TVOC
* eCO2
* AQI-related features
* Temporal changes

### Light

* Current intensity
* Mean
* Change over time
* Exposure patterns

### Excursion Features

* Temperature warning violations
* Time above limit
* Maximum excursion
* Number of excursions
* Total excursion duration

---

# Transport Context

Sensor readings are interpreted alongside shipment information.

Transport context can include:

```text
Product Type
Temperature Warning Threshold
Temperature Limit
Shipment Duration
Time Above Temperature Limit
Temperature Excursion Count
Origin
Destination
Transport Events
```

This is important because the same sensor reading may have different implications for different products.

---

# Edge ML Engine

The Raspberry Pi performs machine-learning inference locally.

The architecture supports an ensemble-style approach using multiple models:

```text
             Feature Vector
                  │
       ┌──────────┼───────────┐
       │          │           │
       ▼          ▼           ▼
 Decision Tree  Random     Extra Trees
                Forest
       │          │           │
       └──────────┼───────────┘
                  ▼
           Model Consensus
                  │
                  ▼
           Decision Engine
```

Potential model outputs:

```text
GOOD
BAD
UNCERTAIN
```

The model consensus layer helps handle cases where individual models disagree.

---

# Decision Engine

The final decision engine produces:

```text
GOOD
BAD
UNCERTAIN
```

along with:

```text
Confidence Score
```

### GOOD

The observed environmental and transport conditions are within the expected range.

### BAD

The system identifies strong indicators of product degradation or unsafe transport conditions.

### UNCERTAIN

The available evidence is insufficient or model predictions disagree significantly.

This prevents the system from forcing every shipment into a binary decision.

---

# Explainable AI

UNIFY-X is designed to provide a reason behind its classification.

For example:

```text
WHY THIS DECISION?

✓ Temperature remained within expected range
✓ Humidity remained stable
✓ Gas indicators remained normal
✓ No significant abnormal trend detected
✓ Models reached strong consensus

Final Decision

GOOD
92% Confidence
```

For a problematic shipment:

```text
BAD

Shipment #UX-1024

Spoilage indicators detected.

Temperature excursion:
32 minutes

Gas trend:
Increasing

Recommended action:

[ Inspect Shipment ]
```

The objective is to turn an ML prediction into an actionable logistics decision rather than presenting an unexplained classification.

---

# Data Flow

The complete system flow is:

```text
Physical Environment
        ↓
ESP32 Sensor Nodes
        ↓
Sensor Acquisition
        ↓
Local Preprocessing
        ↓
JSON Payload
        ↓
Wi-Fi
        ↓
HTTP / REST
        ↓
Raspberry Pi
        ↓
Data Validation
        ↓
Sensor Fusion
        ↓
Time-Window Analysis
        ↓
Feature Extraction
        ↓
Transport Context
        ↓
Local ML Inference
        ↓
Decision Engine
        ↓
GOOD / BAD / UNCERTAIN
        ↓
SQLite
        ↓
REST API / WebSocket
        ↓
User Interfaces
```

---

# Backend API

The Raspberry Pi exposes an API layer for applications.

### System

```http
GET /api/system/status
```

Returns system-level status.

---

### Shipments

```http
GET /api/shipments
```

Returns active and historical shipments.

```http
GET /api/shipments/{id}
```

Returns shipment details.

```http
GET /api/shipments/{id}/live
```

Returns current shipment conditions.

```http
GET /api/shipments/{id}/history
```

Returns historical sensor and transport data.

```http
GET /api/shipments/{id}/analysis
```

Returns ML analysis and decision information.

---

### Alerts

```http
GET /api/alerts
```

Returns active and historical alerts.

---

### Shipment Control

```http
POST /api/shipments/{id}/start
```

Starts shipment monitoring.

```http
POST /api/shipments/{id}/stop
```

Stops shipment monitoring.

---

### Real-Time Communication

For live updates:

```text
WebSocket
/ws/live/{shipment_id}
```

The WebSocket channel can provide:

* Live sensor updates
* Decision updates
* Transport events
* Alerts
* System status changes

---

# JSON Contract

Applications communicate with the Raspberry Pi through a structured data contract.

Example:

```json
{
  "shipment_id": "UX-1024",

  "product": {
    "name": "Fish",
    "rfid": "FISH001"
  },

  "transport": {
    "origin": "Mangalore",
    "destination": "Bengaluru",
    "elapsed_seconds": 15720
  },

  "status": {
    "classification": "GOOD",
    "confidence": 0.92,
    "risk_score": 0.08
  },

  "sensors": {
    "temperature": 4.8,
    "humidity": 71.2,
    "mq135": 1200,
    "mq137": 830,
    "bme_gas": 18200,
    "light": 62
  },

  "transport_events": {
    "temperature_excursions": 1,
    "excursion_duration_seconds": 1020,
    "max_temperature": 8.2
  },

  "nodes": {
    "spoilage_node": "online",
    "precision_node": "online"
  },

  "timestamp": "2026-09-10T10:42:31"
}
```

The frontend is built around this contract so that backend and ML implementation details can evolve without requiring major UI changes.

---

# Mobile Node Companion

UNIFY-X also includes a **separate Android application** designed specifically for interacting with physical sensor nodes.

This is not a conversion of the main web dashboard.

It is a separate product/entity that shares the UNIFY-X backend.

```text
                 UNIFY-X BACKEND
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
       WEB DASHBOARD      ANDROID NODE APP
       Shipment-centric     Node-centric
```

The Android application is designed around:

```text
OPEN APP
   ↓
SCAN NODE
   ↓
NFC TAG DETECTED
   ↓
NODE IDENTIFIED
   ↓
FETCH NODE DATA
   ↓
NODE DETAILS
```

The NFC tag acts primarily as the **physical node identifier**.

The actual sensor data is retrieved from the backend.

The primary question is:

> **What node did I just scan, and is it okay?**

---

# Web Dashboard

The main application is designed around **shipments rather than individual sensors**.

## Home

Shows:

* Active shipment
* Product
* Origin / destination
* Current classification
* Confidence / risk
* Current sensor summary
* Transport duration
* Temperature excursion summary
* System status

---

## Shipments

Includes:

* Active shipments
* Completed shipments
* Shipment details

Shipment details include:

* Overview
* Live monitoring
* Sensor data
* Transport timeline
* ML analysis

---

## Alerts

Displays:

* Critical alerts
* Warnings
* Resolved events

Examples:

```text
BAD classification
Temperature excursion
Unusual gas trend
Sensor failure
Raspberry Pi offline
Node offline
Model uncertainty
```

The application is intentionally action-oriented rather than simply presenting raw data.

---

# Continuous Learning

UNIFY-X is designed with a human feedback loop.

```text
                 ┌─────────────────┐
                 │ EDGE ML DECISION│
                 └────────┬────────┘
                          ↓
                  HUMAN FEEDBACK
                          ↓
                 LABELED DATASET
                          ↓
                  MODEL TRAINING
                          ↓
                 MODEL EVALUATION
                          ↓
                  UPDATED MODEL
                          ↓
                 RASPBERRY PI EDGE
                          ↓
                    ML INFERENCE
```

Human feedback can include:

* Confirming a prediction
* Correcting a prediction
* Actual product condition
* Inspection results
* Notes about the shipment

This creates labeled data that can be used for future model improvement.

---

# Local Storage

The Raspberry Pi maintains local storage for:

### Sensor History

Historical measurements from ESP32 nodes.

### Analysis Results

ML outputs and decision history.

### Alerts

Critical events, warnings, and resolved incidents.

### Transport History

Shipment-level information and environmental events.

The system is therefore capable of maintaining useful operational history without requiring cloud storage for core operation.

---

# Technology Stack

## Hardware

* ESP32
* Raspberry Pi
* BME680
* BME688
* ENS160
* MiCS-6814
* ADS1115
* LDR
* OLED display
* Optional GPS
* Optional accelerometer / IMU
* Product-specific sensors

---

## Embedded

* ESP32 firmware
* Sensor drivers
* I²C
* SPI
* UART
* GPIO
* ADC
* Wi-Fi
* JSON serialization

---

## Edge Computing

* Raspberry Pi
* Python-based processing
* Local database
* REST API
* WebSocket communication
* Feature extraction
* Machine-learning inference

---

## Machine Learning

The architecture supports:

* Decision Tree
* Random Forest
* Extra Trees
* Model consensus
* Feature-based classification
* Human-feedback-driven retraining

---

## Applications

### Web

* React
* TypeScript
* Vite
* Tailwind CSS
* Recharts
* Lucide

### Android

* Expo / React Native
* Native Android NFC capability
* REST API integration

---

# Current Implementation

The project is being developed incrementally across multiple layers.

### Hardware Layer

```text
ESP32
 ├── Precision Sensor Node
 └── General-Purpose Sensor Node
```

### Edge Layer

```text
Raspberry Pi
 ├── Data ingestion
 ├── Validation
 ├── Sensor fusion
 ├── Feature extraction
 ├── ML inference
 ├── Decision engine
 ├── Database
 └── API
```

### Application Layer

```text
Web Dashboard
       +
Android Node Companion
```

The architecture intentionally keeps these components loosely coupled through structured APIs and JSON contracts.

---

# MVP Scope

The first usable version focuses on the core operational workflow.

### Included

* ESP32 sensor acquisition
* Raspberry Pi data ingestion
* Sensor validation
* Sensor fusion
* Time-window analysis
* Feature extraction
* ML inference
* GOOD / BAD / UNCERTAIN classification
* Confidence score
* Local database
* REST API
* WebSocket support
* Shipment dashboard
* Live monitoring
* Shipment history
* Transport timeline
* Temperature excursion tracking
* Alerts
* Raspberry Pi / node status
* Android NFC node identification

### Deferred / Future

* GPS route visualization
* Advanced route analytics
* Full fleet management
* PDF reports
* Multi-vehicle management
* Cloud synchronization
* User accounts
* Advanced analytics

---

# Future Roadmap

## Phase 1 — Core Monitoring

```text
ESP32
  ↓
Raspberry Pi
  ↓
REST API
  ↓
Dashboard
```

---

## Phase 2 — Edge Intelligence

```text
Sensor Fusion
      ↓
Feature Extraction
      ↓
ML Models
      ↓
Decision Engine
```

---

## Phase 3 — Node Ecosystem

```text
Precision Node
      +
General-Purpose Node
      +
NFC Identification
```

---

## Phase 4 — Explainability

Introduce richer:

* Model consensus
* Decision explanations
* Risk factors
* Transport-event explanations
* Human feedback

---

## Phase 5 — Continuous Learning

```text
Real-world shipments
        ↓
Human feedback
        ↓
Labeled data
        ↓
Retraining
        ↓
Model evaluation
        ↓
Updated edge model
```

---

# Getting Started

## Prerequisites

You will need:

* Python 3.x
* Node.js
* npm
* ESP32 development environment
* Raspberry Pi
* Android development environment for the Node Companion
* Wi-Fi network

---

## Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/unify-x.git
cd unify-x
```

---

## Raspberry Pi

Navigate to the backend:

```bash
cd raspberry-pi
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it.

### Windows

```bash
venv\Scripts\activate
```

### Linux / Raspberry Pi

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the backend:

```bash
python main.py
```

The exact startup command may vary depending on the current backend entry point.

---

# Web Dashboard

Navigate to:

```bash
cd web
```

Install dependencies:

```bash
npm install
```

Create your environment file:

```bash
cp .env.example .env
```

Configure the Raspberry Pi API:

```env
VITE_API_BASE_URL=http://<RASPBERRY_PI_IP>:<PORT>
```

Start development mode:

```bash
npm run dev
```

---

# Android Node Companion

Navigate to:

```bash
cd mobile
```

Install dependencies:

```bash
npm install
```

Start Expo:

```bash
npx expo start
```

For native Android functionality such as NFC:

```bash
npx expo run:android
```

The Android application requires a physical Android device with NFC support for production NFC testing.

---

# API Example

A basic request:

```bash
curl http://<RASPBERRY_PI_IP>:<PORT>/api/system/status
```

Example response:

```json
{
  "raspberry_pi": "online",
  "api": "operational",
  "ml_engine": "ready",
  "nodes": {
    "precision_node": "online",
    "general_node": "online"
  }
}
```

---

# Design Philosophy

UNIFY-X intentionally avoids looking like a generic IoT dashboard.

The design principle is:

> **Minimalism over extras.**

The interface should prioritize:

1. Understanding
2. Decision-making
3. Action
4. Feedback

Every visual element should have a purpose.

Avoid:

* Excessive gradients
* Glassmorphism
* Glowing borders
* Decorative blobs
* Meaningless charts
* Excessive rounded cards
* Random illustrations
* Neon effects
* Unnecessary animations
* Sensor-number overload

The product should feel like:

**industrial logistics software + modern deep-tech product**

rather than:

**a collection of IoT widgets.**

---

# User Experience Principle

The application should answer:

```text
What am I transporting?
        ↓
Where is it?
        ↓
How is it doing?
        ↓
Is it GOOD / BAD / UNCERTAIN?
        ↓
Why?
        ↓
What should I do?
```

For example:

```text
BAD

Shipment #UX-1024

Spoilage indicators detected.

Temperature excursion:
32 min

Gas trend:
Increasing

Recommended action:

[ Inspect Shipment ]
```

The goal is to convert sensor data into an operational decision.

---

# Why Edge AI?

UNIFY-X deliberately places the main analytics and inference workload on the Raspberry Pi.

```text
                CLOUD-DEPENDENT SYSTEM

Sensors → Internet → Cloud ML → Decision
                    ↑
              Network Dependency


                    UNIFY-X

Sensors → Wi-Fi → Raspberry Pi → Decision
                       │
                       ├── Fusion
                       ├── Features
                       ├── ML
                       └── Storage
```

This architecture provides several advantages:

### Low Latency

Sensor information does not need to travel to a remote ML service before a decision can be generated.

### Local Operation

Core analysis can continue without dependence on cloud inference.

### Reduced Connectivity Dependency

The system can maintain local data and decision capabilities even when external connectivity is unavailable.

### Data Locality

Sensor and shipment data can remain on the edge device.

### Deployment Flexibility

The system can be deployed in environments where reliable cloud connectivity is not guaranteed.

---

# Statistical Motivation

The UNIFY-X problem is motivated by the scale of post-harvest losses in fisheries.

The project's statistical analysis reports an estimated **9.16% overall post-harvest fish loss in India**, equivalent to approximately **1.5 million tonnes annually**. It further synthesizes estimates suggesting that **40–60% of measured post-harvest losses are associated with cold-chain and logistics failures**, corresponding to approximately **0.6–0.9 million tonnes per year**.

The analysis also identifies the landing/first-mile stage as a major loss point, with a reported **43.5% share of regional post-harvest loss** in the cited Bay of Bengal studies.

These figures are **secondary-source estimates and derived ranges**, not results from a single controlled UNIFY-X field trial. The report explicitly notes differences in methodologies, study scopes, sample frames, and years.

This motivates the need for continuous monitoring and early detection of cold-chain failures.

---

# Limitations

UNIFY-X is a research and engineering prototype.

The following limitations should be considered:

* Sensor readings depend on sensor calibration and environmental conditions.
* Gas sensors may require calibration and environmental compensation.
* ML performance depends on the quality and diversity of training data.
* Spoilage classification should not be interpreted as a universal food-safety certification.
* Product-specific thresholds may differ by species, product, packaging, route, and storage conditions.
* Secondary-source loss statistics are estimates and should not be treated as direct measurements from UNIFY-X.
* Real-world deployment requires additional validation across different products and transportation environments.

The **UNCERTAIN** state exists partly to avoid forcing a confident classification when evidence is insufficient.

---

# Repository Structure

A typical project structure is:

```text
unify-x/
│
├── README.md
│
├── raspberry-pi/
│   ├── api/
│   ├── sensors/
│   ├── processing/
│   ├── features/
│   ├── ml/
│   ├── database/
│   └── main.py
│
├── firmware/
│   ├── precision-node/
│   └── general-node/
│
├── web/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── mobile/
│   ├── app/
│   ├── components/
│   ├── services/
│   └── package.json
│
├── ml/
│   ├── datasets/
│   ├── training/
│   ├── evaluation/
│   └── models/
│
├── docs/
│   ├── architecture/
│   ├── api/
│   └── research/
│
└── hardware/
    ├── schematics/
    ├── pcb/
    └── node-design/
```

The exact structure may evolve as development continues.

---

# Core System States

UNIFY-X uses a small set of meaningful system states:

```text
CONNECTED
OFFLINE
SCANNING
PROCESSING
GOOD
BAD
UNCERTAIN
SENSOR ERROR
MODEL NOT READY
```

These states are intentionally explicit so that both hardware and software can communicate system health clearly.

---

# Decision Authority

One of the most important architectural rules is:

```text
                 Raspberry Pi
                      │
                Decision Engine
                      │
          ┌───────────┼───────────┐
          ↓           ↓           ↓
        GOOD         BAD      UNCERTAIN
          │           │           │
          └───────────┼───────────┘
                      ↓
               Stored + Broadcast
                      │
             ┌────────┴─────────┐
             ↓                  ↓
        Node Display        Applications
```

There is **one decision authority: the Raspberry Pi**.

The ESP32 nodes collect and preprocess data.

The applications display the result.

This prevents different components of the system from producing conflicting classifications.

---

# Project Vision

UNIFY-X aims to move cold-chain monitoring from:

```text
WHAT HAPPENED?
```

to:

```text
WHAT DOES IT MEAN?
```

Traditional systems provide sensor readings.

UNIFY-X combines:

```text
MULTI-SENSOR DATA
        +
TIME
        +
TRANSPORT CONTEXT
        +
EDGE AI
        +
EXPLAINABILITY
        +
HUMAN FEEDBACK
```

to produce:

```text
GOOD
BAD
UNCERTAIN
```

and, more importantly:

```text
WHAT HAPPENED
        ↓
WHY IT MATTERS
        ↓
WHAT SHOULD BE DONE
```

---

# Contributing

Contributions are welcome.

If you would like to contribute:

1. Fork the repository.
2. Create a feature branch.

```bash
git checkout -b feature/your-feature
```

3. Make your changes.
4. Test the changes.
5. Commit your work.

```bash
git commit -m "Add your feature"
```

6. Push the branch.

```bash
git push origin feature/your-feature
```

7. Open a Pull Request.

For major architectural changes, please discuss the change before implementation.

---

# License

This project is currently intended for research, experimentation, and hackathon development.


---

# UNIFY-X

### **Transport intelligence, not just monitoring.**

```text
ESP32
  ↓
SENSE
  ↓
Raspberry Pi
  ↓
FUSE
  ↓
ANALYZE
  ↓
LEARN
  ↓
DECIDE
  ↓
GOOD / BAD / UNCERTAIN
```

**Built to understand what happens to a product while it is in transit.**

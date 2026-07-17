# evcc for Homey

Connect your [evcc](https://evcc.io) solar charging setup to Homey.

evcc is a free, open-source EV charging controller that optimizes charging
using solar surplus, dynamic electricity tariffs, and smart automation. It
runs on your own hardware (Raspberry Pi, NAS, Docker, etc.) on your local
network and speaks to your wallbox, meters, and vehicle.

This app connects Homey to your local evcc instance so you can monitor and
control charging as part of your Homey flows and dashboards.

## Features

- **Charging point device**: charge mode (Off / Solar only / Min+Solar / Fast),
  target charge limit, charging power, session energy, vehicle battery level,
  vehicle range, connected/charging status
- **Site device**: solar production, grid power, and home consumption
- **Home battery device**: battery power and level, plus evcc battery control
  settings when a home battery is configured
- Flow cards to set charge mode, target SoC, and min/max charging current
- Flow conditions for charge mode, charging state, and connection state
- Local polling, no cloud dependency — works entirely on your LAN

## Requirements

- A running [evcc instance](https://github.com/evcc-io/evcc) reachable on your
  local network
- The evcc instance's base URL (and password, if configured)

## Setup

Add a device, choose "Charging point", "evcc site", or "Home battery", and enter your evcc
instance's URL (e.g. `http://192.168.1.50:7070`) plus the optional password.

## Links

- evcc project (what this app connects to): https://evcc.io
- This integration's source: https://github.com/rdmn7/com.evcc.io
- Report an issue with this integration: https://github.com/rdmn7/com.evcc.io/issues

This app is a community integration and is not officially affiliated with
the evcc project.

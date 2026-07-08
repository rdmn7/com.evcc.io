evcc for Homey
===============

Control your evcc solar charging instance directly from Homey.

evcc (https://evcc.io) is a free, open-source EV charging controller that
optimizes charging using solar surplus, dynamic electricity tariffs, and
smart automation. It runs on your own hardware (Raspberry Pi, NAS, Docker,
etc.) on your local network and speaks to your wallbox, meters, and vehicle.

This app connects Homey to your local evcc instance so you can monitor and
control charging as part of your Homey flows and dashboards.

Features
--------
- Charging point device: charge mode (Off / Solar only / Min+Solar / Fast),
  target charge limit, charging power, session energy, vehicle battery
  level, vehicle range, connected/charging status
- Site device: solar production, grid power, home battery power and level,
  home consumption
- Flow cards to set charge mode, target SoC, and min/max charging current
- Flow conditions for charge mode, charging state, and connection state
- Local polling, no cloud dependency — works entirely on your LAN

Requirements
------------
- A running evcc instance (https://github.com/evcc-io/evcc) reachable on
  your local network
- The evcc instance's base URL (and password, if configured)

Setup
-----
Add a device, choose "Charging point" or "evcc site", and enter your evcc
instance's URL (e.g. http://192.168.1.50:7070) plus the optional password.

Links
-----
- evcc project: https://evcc.io
- evcc source: https://github.com/evcc-io/evcc
- Issues: https://github.com/evcc-io/evcc/issues
- Discussions: https://github.com/evcc-io/evcc/discussions

This app is a community integration and is not officially affiliated with
the evcc project.

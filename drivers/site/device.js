'use strict';

const Homey = require('homey');
const EvccApi = require('../../lib/EvccApi');
const { normalizeState } = require('../../lib/normalize');

class SiteDevice extends Homey.Device {

  async onInit() {
    const settings = this.getSettings();
    this._api = new EvccApi({ host: settings.host, password: settings.password });
    await this._poll();
    this._startPolling(settings.pollInterval || 10);
  }

  _startPolling(seconds) {
    this._clearPolling();
    this._pollInterval = this.homey.setInterval(() => {
      this._poll().catch((err) => this.error('Poll failed', err.message));
    }, Math.max(5, Number(seconds) || 10) * 1000);
  }

  _clearPolling() {
    if (this._pollInterval) {
      this.homey.clearInterval(this._pollInterval);
      this._pollInterval = null;
    }
  }

  async _safeSet(capability, value) {
    if (value === null || value === undefined) return;
    if (this.getCapabilityValue(capability) === value) return;
    await this.setCapabilityValue(capability, value).catch((err) => this.error(`setCapabilityValue(${capability})`, err.message));
  }

  async _poll() {
    try {
      const rawState = await this._api.getState();
      const { site } = normalizeState(rawState);

      await this._safeSet('measure_power.pv', site.pvPower ?? 0);
      await this._safeSet('measure_power.grid', site.gridPower ?? 0);
      await this._safeSet('measure_power.battery', site.batteryPower ?? 0);
      await this._safeSet('measure_battery.home', site.batterySoc);
      await this._safeSet('measure_power.home', site.homePower ?? 0);

      if (!this.getAvailable()) await this.setAvailable();
    } catch (err) {
      this.error('evcc poll error:', err.message);
      await this.setUnavailable(err.message).catch(() => {});
    }
  }

  async onSettings({ newSettings, changedKeys }) {
    if (changedKeys.includes('host')) this._api.setHost(newSettings.host);
    if (changedKeys.includes('password')) this._api.setPassword(newSettings.password);
    if (changedKeys.includes('pollInterval')) this._startPolling(newSettings.pollInterval);
    await this._poll();
  }

  async onDeleted() {
    this._clearPolling();
  }

}

module.exports = SiteDevice;

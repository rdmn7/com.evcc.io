'use strict';

const Homey = require('homey');
const EvccApi = require('../../lib/EvccApi');
const { normalizeState } = require('../../lib/normalize');

class BatteryDevice extends Homey.Device {

  async onInit() {
    const settings = this.getSettings();
    this._api = new EvccApi({ host: settings.host, password: settings.password });
    this._prevSite = {};
    this._registerCapabilityListeners();
    await this._poll();
    this._startPolling(settings.pollInterval || 10);
  }

  _registerCapabilityListeners() {
    this.registerCapabilityListener('evcc_battery_discharge_control', async (value) => {
      await this.setBatteryDischargeControl(value);
    });

    this.registerCapabilityListener('evcc_battery_mode', async (value) => {
      await this.setBatteryMode(value);
    });

    this.registerCapabilityListener('evcc_battery_buffer_soc', async (value) => {
      await this.setBatteryBufferSoc(Math.round(value * 100));
    });

    this.registerCapabilityListener('evcc_battery_buffer_start_soc', async (value) => {
      await this.setBatteryBufferStartSoc(Math.round(value * 100));
    });

    this.registerCapabilityListener('evcc_battery_priority_soc', async (value) => {
      await this.setBatteryPrioritySoc(Math.round(value * 100));
    });

    this.registerCapabilityListener('evcc_grid_residual_power', async (value) => {
      await this.setGridResidualPower(value);
    });

    this.registerCapabilityListener('evcc_battery_grid_charge_limit', async (value) => {
      await this.setBatteryGridChargeLimit(value);
    });

    this.registerCapabilityListener('evcc_battery_control_reset', async () => {
      await this.resetBatteryControl();
    });
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

  async _syncCapability(capability, shouldHave) {
    const has = this.hasCapability(capability);
    if (shouldHave && !has) {
      await this.addCapability(capability).catch((err) => this.error(`addCapability(${capability})`, err.message));
    } else if (!shouldHave && has) {
      await this.removeCapability(capability).catch((err) => this.error(`removeCapability(${capability})`, err.message));
    }
  }

  async _safeSet(capability, value) {
    if (value === null || value === undefined) return;
    if (!this.hasCapability(capability)) return;
    if (this.getCapabilityValue(capability) === value) return;
    await this.setCapabilityValue(capability, value).catch((err) => this.error(`setCapabilityValue(${capability})`, err.message));
  }

  async _poll() {
    try {
      const settings = this.getSettings();
      const enabled = settings.enabled !== false;
      const rawState = await this._api.getState();
      const { site } = normalizeState(rawState);
      const showBattery = enabled && site.batteryConfigured;

      await this._syncCapability('measure_power', showBattery);
      await this._syncCapability('measure_battery', showBattery);
      await this._syncCapability('evcc_battery_discharge_control', showBattery);
      await this._syncCapability('evcc_battery_mode', showBattery);
      await this._syncCapability('evcc_battery_buffer_soc', showBattery);
      await this._syncCapability('evcc_battery_buffer_start_soc', showBattery);
      await this._syncCapability('evcc_battery_priority_soc', showBattery);
      await this._syncCapability('evcc_grid_residual_power', showBattery);
      await this._syncCapability('evcc_battery_grid_charge_limit', showBattery);
      await this._syncCapability('evcc_battery_control_reset', showBattery);

      if (!enabled) {
        await this.setUnavailable('Home battery disabled in device settings').catch(() => {});
        return;
      }

      if (!site.batteryConfigured) {
        await this.setUnavailable('No home battery is configured in evcc').catch(() => {});
        return;
      }

      await this._safeSet('measure_power', site.batteryPower ?? 0);
      await this._safeSet('measure_battery', site.batterySoc);
      await this._safeSet('evcc_battery_discharge_control', site.batteryDischargeControl);
      await this._safeSet('evcc_battery_mode', site.batteryMode || 'unknown');
      await this._safeSet('evcc_battery_buffer_soc', typeof site.batteryBufferSoc === 'number' ? site.batteryBufferSoc / 100 : null);
      await this._safeSet('evcc_battery_buffer_start_soc', typeof site.batteryBufferStartSoc === 'number' ? site.batteryBufferStartSoc / 100 : null);
      await this._safeSet('evcc_battery_priority_soc', typeof site.batteryPrioritySoc === 'number' ? site.batteryPrioritySoc / 100 : null);
      await this._safeSet('evcc_grid_residual_power', site.gridResidualPower);
      await this._safeSet('evcc_battery_grid_charge_limit', site.batteryGridChargeLimit);

      this._triggerFlowChanges(site);

      if (!this.getAvailable()) await this.setAvailable();
      this._prevSite = site;
    } catch (err) {
      this.error('evcc battery poll error:', err.message);
      await this.setUnavailable(err.message).catch(() => {});
    }
  }

  _triggerFlowChanges(site) {
    const prev = this._prevSite || {};
    const flow = this.homey.flow;

    if (prev.batteryMode !== undefined && prev.batteryMode !== site.batteryMode) {
      const mode = site.batteryMode || 'unknown';
      flow.getDeviceTriggerCard('battery_mode_changed')
        .trigger(this, { mode }, { mode })
        .catch((err) => this.error(err));
    }

    if (prev.batteryDischargeControl !== undefined && prev.batteryDischargeControl !== site.batteryDischargeControl) {
      const enabled = Boolean(site.batteryDischargeControl);
      flow.getDeviceTriggerCard('battery_discharge_control_changed')
        .trigger(this, { enabled }, { enabled })
        .catch((err) => this.error(err));
    }

    const prevPower = typeof prev.batteryPower === 'number' ? prev.batteryPower : 0;
    const currentPower = typeof site.batteryPower === 'number' ? site.batteryPower : 0;

    if (prevPower >= 0 && currentPower < 0) {
      flow.getDeviceTriggerCard('battery_started_charging').trigger(this).catch((err) => this.error(err));
    }

    if (prevPower <= 0 && currentPower > 0) {
      flow.getDeviceTriggerCard('battery_started_discharging').trigger(this).catch((err) => this.error(err));
    }
  }

  async setBatteryDischargeControl(enabled) {
    await this._api.setBatteryDischargeControl(Boolean(enabled));
    await this._safeSet('evcc_battery_discharge_control', Boolean(enabled));
  }

  async setBatteryMode(mode) {
    await this._api.setBatteryMode(mode);
    await this._safeSet('evcc_battery_mode', mode);
  }

  async setBatteryBufferSoc(soc) {
    const value = Math.round(soc);
    await this._api.setBatteryBufferSoc(value);
    await this._safeSet('evcc_battery_buffer_soc', value / 100);
  }

  async setBatteryBufferStartSoc(soc) {
    const value = Math.round(soc);
    await this._api.setBatteryBufferStartSoc(value);
    await this._safeSet('evcc_battery_buffer_start_soc', value / 100);
  }

  async setBatteryPrioritySoc(soc) {
    const value = Math.round(soc);
    await this._api.setBatteryPrioritySoc(value);
    await this._safeSet('evcc_battery_priority_soc', value / 100);
  }

  async setGridResidualPower(power) {
    const value = Math.round(power);
    await this._api.setGridResidualPower(value);
    await this._safeSet('evcc_grid_residual_power', value);
  }

  async setBatteryGridChargeLimit(cost) {
    await this._api.setBatteryGridChargeLimit(cost);
    await this._safeSet('evcc_battery_grid_charge_limit', cost);
  }

  async resetBatteryControl() {
    await this._api.resetBatteryMode();
    await this._poll();
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

module.exports = BatteryDevice;

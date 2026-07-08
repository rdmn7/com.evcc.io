'use strict';

const Homey = require('homey');

const CHARGE_MODES = ['off', 'pv', 'minpv', 'now'];

class EvccApp extends Homey.App {

  async onInit() {
    this._registerFlowCards();
    this.log('evcc app initialized');
  }

  _registerFlowCards() {
    const flow = this.homey.flow;

    flow.getActionCard('set_charge_mode')
      .registerRunListener(async (args) => args.device.setChargeMode(args.mode));

    flow.getActionCard('set_target_soc')
      .registerRunListener(async (args) => args.device.setTargetSoc(args.soc));

    flow.getActionCard('set_min_current')
      .registerRunListener(async (args) => args.device.setMinCurrent(args.amps));

    flow.getActionCard('set_max_current')
      .registerRunListener(async (args) => args.device.setMaxCurrent(args.amps));

    flow.getConditionCard('charge_mode_is')
      .registerRunListener(async (args) => args.device.getCapabilityValue('evcc_charge_mode') === args.mode);

    flow.getConditionCard('is_charging')
      .registerRunListener(async (args) => Boolean(args.device.getCapabilityValue('evcc_charging')));

    flow.getConditionCard('is_connected')
      .registerRunListener(async (args) => Boolean(args.device.getCapabilityValue('evcc_connected')));
  }

}

module.exports = EvccApp;
module.exports.CHARGE_MODES = CHARGE_MODES;

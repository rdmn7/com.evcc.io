'use strict';

function findLoadpointDevice(homey, id) {
  const devices = homey.drivers.getDriver('loadpoint').getDevices();
  const device = devices.find((d) => d.getData().id === id);
  if (!device) {
    const err = new Error('Unknown or not-yet-ready loadpoint device');
    err.statusCode = 404;
    throw err;
  }
  return device;
}

module.exports = {

  async getLoadpointState({ homey, params }) {
    const device = findLoadpointDevice(homey, params.id);
    return device.getWidgetSummary();
  },

  async setLoadpointMode({ homey, params, body }) {
    const device = findLoadpointDevice(homey, params.id);
    await device.setChargeMode(body.mode);
    return device.getWidgetSummary();
  },

  async setLoadpointTargetSoc({ homey, params, body }) {
    const device = findLoadpointDevice(homey, params.id);
    await device.setTargetSoc(Number(body.soc));
    return device.getWidgetSummary();
  },

};

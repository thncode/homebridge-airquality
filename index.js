var Accessory, Service, Characteristic, UUIDGen, FakeGatoHistoryService;
const packageFile = require("./package.json");
var hostname = os.hostname();

module.exports = function(homebridge) {
    if(!isConfig(homebridge.user.configPath(), "accessories", "AirQuality")) {
        return;
    }
    
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;
    FakeGatoHistoryService = require("fakegato-history")(homebridge);

    homebridge.registerAccessory('homebridge-airquality', 'AirQuality', AirQuality);
}

AirQuality.prototype.setUpServices = function () {

   	this.infoService = new Service.AccessoryInformation();
	this.infoService
		.setCharacteristic(Characteristic.Manufacturer, "Thomas Nemec")
		.setCharacteristic(Characteristic.SerialNumber, hostname + "-" + this.name)
		.setCharacteristic(Characteristic.FirmwareRevision, packageFile.version);
	
	this.fakeGatoHistoryService = new FakeGatoHistoryService("weather", this, { storage: 'fs' });
}

AirQuality.prototype.getServices = function () {

	return [this.infoService, this.fakeGatoHistoryService, this.raspberrypiService];
};

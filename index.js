var Accessory, Service, Characteristic, UUIDGen, FakeGatoHistoryService;
const packageFile = require("./package.json");
var os = require("os");
var hostname = os.hostname();

module.exports = function(homebridge) {
	
    if (!isConfig(homebridge.user.configPath(), "accessories", "AirQuality")) {
        return;
    }
    
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;
    FakeGatoHistoryService = require("fakegato-history")(homebridge);

    homebridge.registerAccessory('homebridge-airthings-airquality', 'AirQuality', AirQuality);
}

function isConfig(configFile, type, name) {
    var config = JSON.parse(fs.readFileSync(configFile));
    if("accessories" === type) {
        var accessories = config.accessories;
        for(var i in accessories) {
            if(accessories[i]['accessory'] === name) {
                return true;
            }
        }
    } else if ("platforms" === type) {
        var platforms = config.platforms;
        for (var i in platforms) {
            if(platforms[i]['platform'] === name) {
                return true;
            }
        }
    } else {
    }
    
    return false;
};

function AirQuality(log, config) {
	
    if (null == config) {
        return;
    }

    this.log = log;
    this.name = config["name"];
    this.setUpServices();
};

AirQuality.prototype.setUpServices = function () {

	var that = this;
	var temp;
	
   	this.infoService = new Service.AccessoryInformation();
	this.infoService
		.setCharacteristic(Characteristic.Manufacturer, "Thomas Nemec")
		.setCharacteristic(Characteristic.SerialNumber, hostname + "-" + this.name)
		.setCharacteristic(Characteristic.FirmwareRevision, packageFile.version);
	
	this.fakeGatoHistoryService = new FakeGatoHistoryService("weather", this, { storage: 'fs' });

	this.airqualityService = new Service.TemperatureSensor(that.name);
	var currentTemperatureCharacteristic = this.airqualityService.getCharacteristic(Characteristic.CurrentTemperature);
	
	function getCurrentTemperature() {
		var temperatureVal = 29.5;
		temp = temperatureVal;
		return temperatureVal;
	}
	
	currentTemperatureCharacteristic.updateValue(getCurrentTemperature());
	if(that.updateInterval) {
		setInterval(() => {
			currentTemperatureCharacteristic.updateValue(getCurrentTemperature());
			
			that.log("Temperatur: " + temp);
			this.fakeGatoHistoryService.addEntry({time: new Date().getTime() / 1000, temp: temp});
			
		}, that.updateInterval);
	}
	
	currentTemperatureCharacteristic.on('get', (callback) => {
		callback(null, getCurrentTemperature());
	});}

AirQuality.prototype.getServices = function () {

	return [this.infoService, this.fakeGatoHistoryService, this.airqualityService];
};

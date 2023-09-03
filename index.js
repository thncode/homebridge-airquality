var Accessory, Service, Characteristic, UUIDGen, FakeGatoHistoryService;
const packageFile = require("./package.json");
var os = require("os");
const fs = require('fs');
var hostname = os.hostname();

const readFile = "/var/lib/homebridge/node_modules/homebridge-airthings-airquality/2920158516.txt";

var temperature = 0;
var humidity = 0;
var voc = 0;
var hour = 24, minute = 60, second = 60;

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
    if ("accessories" === type) {
        var accessories = config.accessories;
        for (var i in accessories) {
            if (accessories[i]['accessory'] === name) return true;
        }
    } else if ("platforms" === type) {
        var platforms = config.platforms;
        for (var i in platforms) {
            if (platforms[i]['platform'] === name) return true;
        }
    }
    
    return false;
};

function AirQuality(log, config) {
	
    if (null == config) return;

    this.log = log;
    this.name = config["name"];

    if (config["waveminiserial"]) {
        this.waveminiserial = config["waveminiserial"];
    } else {
        this.waveminiserial = null;
    }

    this.log("Wave Mini Serial: " + this.waveminiserial);
	
    this.setUpServices();
    
    this.readData();
    
    fs.watch(readFile, (event, filename) => {
   		if (event === 'change') this.readData();
    });
};

AirQuality.prototype.readData = function () {

	fs.stat(readFile, (err, stats) => {
	    
		if (err) {
		    this.log("Kann Daten nicht lesen");
		    }
		    
	  	if (stats.mtime.getHours() != this.hour || stats.mtime.getMinutes() != this.minute || stats.mtime.getSeconds() != this.second) {
		    
		    var data = fs.readFileSync(readFile, "utf-8");

		    this.temperature = parseFloat(data.substring(0, 5));
		    if (!isNaN(temperature)) {

			this.humidity = parseFloat(data.substring(6, 11));
			this.voc = parseFloat(data.substring(12));

			this.fakeGatoHistoryService.addEntry({time: Math.round(new Date().getTime() / 1000), temp: this.temperature, humidity: this.humidity, voc: this.voc});
						
			this.hour   = stats.mtime.getHours();
			this.minute = stats.mtime.getMinutes();
			this.second = stats.mtime.getSeconds();

			this.log("Temperatur:", this.temperature, " Humidity:", this.humidity, " VOC:", this.voc);
		    }
		}
	})
}

AirQuality.prototype.getCurrentTemperature = function (callback) {
    return callback(null, this.temperature)
}

AirQuality.prototype.getCurrentRelativeHumidity = function (callback) {
    return callback(null, this.humidity)
}

AirQuality.prototype.getVOCDensity = function (callback) {
    return callback(null, this.voc)
}

AirQuality.prototype.setUpServices = function () {
	
   	this.infoService = new Service.AccessoryInformation();
	this.infoService
		.setCharacteristic(Characteristic.Manufacturer, "Thomas Nemec")
		.setCharacteristic(Characteristic.SerialNumber, hostname + "-" + this.name)
		.setCharacteristic(Characteristic.FirmwareRevision, packageFile.version);
	
	this.fakeGatoHistoryService = new FakeGatoHistoryService("room2", this, { storage: 'fs' });

	this.airqualityService = new Service.TemperatureSensor(this.name);
	this.airqualityService.getCharacteristic(Characteristic.CurrentTemperature)
	    .on('get', this.getCurrentTemperature.bind(this));
	this.airqualityService.getCharacteristic(Characteristic.CurrentRelativeHumidity)
	    .on('get', this.getCurrentRelativeHumidity.bind(this));	
	this.airqualityService.getCharacteristic(Characteristic.VOCDensity)
	    .on('get', this.getVOCDensity.bind(this));	
}

AirQuality.prototype.getServices = function () {

	return [this.infoService, this.fakeGatoHistoryService, this.airqualityService];
};

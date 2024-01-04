sap.ui.define([
	"sap/ui/core/UIComponent",
	"simplot/portalsanalistaqas/utils/models",
	"simplot/portalsanalistaqas/model/start",
	"sap/ui/Device"
], function (UIComponent, models, start, Device) {
	"use strict";
	return UIComponent.extend("simplot.portalsanalistaqas.Component", {

		"metadata": {
			"manifest": "json"
		},

		"init": function () {
			UIComponent.prototype.init.apply(this, arguments);

			// create the views based on the url/hash
			this.getRouter().initialize();

			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			// set the FLP model
			this.setModel(models.createFLPModel(), "FLP");

			// call the base component's init function and create the App view

			var appId = this.getManifestEntry("/sap.app/id");
            var appPath = appId.replaceAll(".", "/");
            $.appModulePath  = jQuery.sap.getModulePath(appPath);

		},
		"destroy": function () {
			//	this._oErrorHandler.destroy();
			// call the base component's destroy function
			UIComponent.prototype.destroy.apply(this, arguments);
		},


		"initComponentModels": function () {
			var oComponent = this;

			UIComponent.prototype.initComponentModels.apply(oComponent, arguments);
			models.setComponent(oComponent);
			models.resetAllHelpers();

			start().then(function () {

				console.log("Carga de App: " + new Date());

				jQuery.sap.require("simplot.portalsanalistaqas.utils.helper.device");
			});
		},

		"getContentDensityClass": function () {
			if (this._sContentDensityClass === undefined) {
				// check whether FLP has already set the content density class; do nothing in this case
				if (jQuery(document.body).hasClass("sapUiSizeCozy") || jQuery(document.body).hasClass("sapUiSizeCompact")) {
					this._sContentDensityClass = "";
				} else if (!Device.support.touch) { // apply "compact" mode if touch is not supported
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					// "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}
			return this._sContentDensityClass;
		}
	});
});
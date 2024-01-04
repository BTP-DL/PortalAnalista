sap.ui.define([
	"sap/ui/model/resource/ResourceModel"
], function (ResourceModel) {
	"use strict";

	return {
		resourceModel: null,

		getResourceModel: function () {
			if (!this.resourceModel) {
				this.resourceModel = new ResourceModel({
					bundleName: "simplot.portalsanalistaqas.i18n.i18n",
					supportedLocales: [
						""
					],
					fallbackLocale: ""
				});
			}
			return this.resourceModel;
		},

		getResourceBundle: function () {
			return this.getResourceModel().getResourceBundle();
		}
	};
});
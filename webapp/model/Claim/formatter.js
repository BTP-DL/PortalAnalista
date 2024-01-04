sap.ui.define(["simplot/portalsanalistaqas/utils/FileDownHelp"], function (FileDownHelp) {
	"use strict";

	return {
		convertHtmlToText: function (html) {
			return html;
			//return $(html).text();
		},

		getAutorDescription: function (sValue) {
			if (!sValue) {
				return "";
			}
			return this.getResourceBundle().getText("claim.autor." + sValue);;
		},

		formatStringDate: function (date, time) {
			if (!date || date.length !== 8 || !time || time.length !== 6) {
				return "";
			}
			const oDate = new Date(parseInt(date.substring(0, 4), 10), parseInt(date.substring(4, 6), 10) - 1, parseInt(date.substring(6, 8), 10),
				parseInt(time.substring(0, 2), 10), parseInt(time.substring(2, 4), 10), parseInt(time.substring(4, 6), 10));

			return this.formatter.formatDate(oDate, "dd/MM/yyyy HH:mm:ss");
		},

		formatDate: function (date, pattern = "dd/MM/yyyy") {
			var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: pattern
			});
			return oDateFormat.format(date);
		},

		getReasonDescription: function (sValue) {
			if (!sValue) {
				return "";
			}
			let oModel = this.CommonClaims.getModelClaims();
			return oModel.getProperty(`/Reasons/Data/${sValue}/Texto`);
		},

		getPriorityDescription: function (sValue) {
			let sDescription = "";
			switch (sValue) {
				case "1":
					sDescription = this.getResourceBundle().getText("claim.priority.low");
					break;
				case "2":
					sDescription = this.getResourceBundle().getText("claim.priority.normal");
					break;
				case "3":
					sDescription = this.getResourceBundle().getText("claim.priority.high");
					break;
			}
			return sDescription;
		},

		getPriorityState: function (sValue) {
			let state = sap.ui.core.ValueState.None;
			switch (sValue) {
				case "1":
					state = sap.ui.core.ValueState.Success;
					break;
				case "2":
					state = sap.ui.core.ValueState.Warning;
					break;
				case "3":
					state = sap.ui.core.ValueState.Error;
					break;
			}
			return state;
		},

		getStatusDescription: function (sValue) {
			let sDescription = "";
			switch (sValue) {
				case "1":
					sDescription = this.getResourceBundle().getText("claim.status.new");
					break;
				case "2":
					sDescription = this.getResourceBundle().getText("claim.status.inProcess");
					break;
				case "3":
					sDescription = this.getResourceBundle().getText("claim.status.closed");
					break;
			}
			return sDescription;
		},

		getStatusState: function (sValue) {
			let state = sap.ui.core.ValueState.None;
			switch (sValue) {
				case "1":
					state = sap.ui.core.ValueState.Success;
					break;
				case "2":
					state = sap.ui.core.ValueState.Warning;
					break;
				case "3":
					state = sap.ui.core.ValueState.Information;
					break;
			}
			return state;
		},

		removeLeadingZeros: function (sValue) {
			return (parseInt(sValue, 10)).toString();
		},

		getMimeType: function (fileName) {
			const mimetypes = {
				"img": "sap-icon://attachment-photo",
				"png": "sap-icon://attachment-photo",
				"bm": "sap-icon://attachment-photo",
				"bmp": "sap-icon://attachment-photo",
				"boz": "application/x-bzip2",
				"bsh": "application/x-bsh",
				"bz": "application/x-bzip",
				"bz2": "application/x-bzip2",
				"c": "sap-icon://document",
				"c++": "sap-icon://document",
				"cat": "application/vnd.ms-pki.seccat",
				"cc": "sap-icon://document",
				"conf": "sap-icon://document",
				"css": "text/css",
				"doc": "sap-icon://doc-attachment",
				"dot": "sap-icon://doc-attachment",
				"gif": "sap-icon://attachment-photo",
				"gz": "application/x-compressed",
				"gzip": "application/x-gzip",
				"htm": "sap-icon://attachment-html",
				"html": "sap-icon://attachment-html",
				"htmls": "sap-icon://attachment-html",
				"jpe": "sap-icon://attachment-photo",
				"jpeg": "sap-icon://attachment-photo",
				"jpg": "sap-icon://attachment-photo",
				"jps": "sap-icon://attachment-photo",
				"js": "text/javascript",
				"json": "text/json",
				"pic": "sap-icon://attachment-photo",
				"pict": "sap-icon://attachment-photo",
				"pps": "sap-icon://ppt-attachment",
				"ppt": "sap-icon://ppt-attachment",
				"ppz": "sap-icon://ppt-attachment",
				"tex": "sap-icon://attachment-text-file",
				"text": "sap-icon://attachment-text-file",
				"tgz": "application/x-compressed",
				"tif": "sap-icon://attachment-photo",
				"tiff": "sap-icon://attachment-photo",
				"word": "sap-icon://doc-attachment",
				"wp": "sap-icon://doc-attachment",
				"wp5": "sap-icon://doc-attachment",
				"wp6": "sap-icon://doc-attachment",
				"wpd": "sap-icon://doc-attachment",
				"xbm": "sap-icon://attachment-photo",
				"xls": "sap-icon://excel-attachment",
				"xlt": "sap-icon://excel-attachment",
				"xlv": "sap-icon://excel-attachment",
				"xlw": "sap-icon://excel-attachment",
				"xml": "text/xml",
				"z": "application/x-compress",
				"zip": "application/zip"
			}, extension = fileName.split(".").pop();
			if (!mimetypes.hasOwnProperty(extension)) {
				return null;
			}
			return mimetypes[extension];
		},

		getThumbnailUrl: function (fileName) {
			const mimetypes = {
				"img": "sap-icon://attachment-photo",
				"png": "sap-icon://attachment-photo",
				"bm": "sap-icon://attachment-photo",
				"bmp": "sap-icon://attachment-photo",
				"bz": "sap-icon://attachment-zip-file",
				"bz2": "sap-icon://attachment-zip-file",
				"c": "sap-icon://document",
				"c++": "sap-icon://document",
				"cc": "sap-icon://document",
				"conf": "sap-icon://document",
				"css": "sap-icon://document",
				"doc": "sap-icon://doc-attachment",
				"dot": "sap-icon://doc-attachment",
				"gif": "sap-icon://attachment-photo",
				"gz": "sap-icon://attachment-zip-file",
				"gzip": "sap-icon://attachment-zip-file",
				"htm": "sap-icon://attachment-html",
				"html": "sap-icon://attachment-html",
				"htmls": "sap-icon://attachment-html",
				"jpe": "sap-icon://attachment-photo",
				"jpeg": "sap-icon://attachment-photo",
				"jpg": "sap-icon://attachment-photo",
				"jps": "sap-icon://attachment-photo",
				"js": "sap-icon://document",
				"json": "sap-icon://document",
				"pdf": "sap-icon://pdf-attachment",
				"pic": "sap-icon://attachment-photo",
				"pict": "sap-icon://attachment-photo",
				"pps": "sap-icon://ppt-attachment",
				"ppt": "sap-icon://ppt-attachment",
				"ppz": "sap-icon://ppt-attachment",
				"tex": "sap-icon://attachment-text-file",
				"text": "sap-icon://attachment-text-file",
				"tgz": "sap-icon://attachment-zip-file",
				"tif": "sap-icon://attachment-photo",
				"tiff": "sap-icon://attachment-photo",
				"word": "sap-icon://doc-attachment",
				"wp": "sap-icon://doc-attachment",
				"wp5": "sap-icon://doc-attachment",
				"wp6": "sap-icon://doc-attachment",
				"wpd": "sap-icon://doc-attachment",
				"xbm": "sap-icon://attachment-photo",
				"xls": "sap-icon://excel-attachment",
				"xlt": "sap-icon://excel-attachment",
				"xlv": "sap-icon://excel-attachment",
				"xlw": "sap-icon://excel-attachment",
				"xml": "sap-icon://document",
				"z": "sap-icon://attachment-zip-file",
				"zip": "sap-icon://attachment-zip-file"
			}, extension = fileName.split(".").pop();
			if (!mimetypes.hasOwnProperty(extension)) {
				return null;
			}
			return mimetypes[extension];
		},

		buildUrlFile: function (claimNumber, fileName) {
			if (!claimNumber || !fileName) {
				return "";
			}

			return this.getModel().sServiceUrl + "/" + this.getModel().createKey("AdjuntoSet", {
				Nrorec: claimNumber,
				Archivo: fileName
			}) + "/Contenido/$value";
		}
	};

});
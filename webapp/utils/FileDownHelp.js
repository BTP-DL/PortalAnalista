sap.ui.define([], function() {
	"use strict";
	return {

		download: function(base64code, contentType, docName) {
			try {
				this.saveData(this.btoBlob(atob(base64code), contentType), docName);
			} catch (ex) {
				console.log("Error al subir imagen");
			}
		},

		btoBlob: function(binary, contentType, sliceSize) {
			contentType = contentType || '';
			sliceSize = sliceSize || 512;
			var byteCharacters = binary;
			var byteArrays = [];
			var blob;
			for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
				var slice = byteCharacters.slice(offset, offset + sliceSize);
				var byteNumbers = new Array(slice.length);
				for (var i = 0; i < slice.length; i++) {
					byteNumbers[i] = slice.charCodeAt(i);
				}
				var byteArray = new Uint8Array(byteNumbers);
				byteArrays.push(byteArray);
			}
			try {
				blob = new Blob(byteArrays, {
					type: contentType
				});
			} catch (e) {
				window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
				blob = new BlobBuilder();
				blob.append(byteArrays);
				blob = blob.getBlob();
			}
			return blob;
		},

		saveData: function(blob, fileName) {
			if (navigator.msSaveBlob) {
				return navigator.msSaveBlob(blob, fileName);
			} else if (navigator.userAgent.indexOf("Chrome") != -1) {
				var a = document.createElement("a");
				document.body.appendChild(a);
				a.style = "display: none";
				url = window.URL.createObjectURL(blob);
				a.href = url;
				a.setAttribute("download", fileName);
				a.download = fileName;
				a.click();
				window.URL.revokeObjectURL(url);
			} else {
				var url = window.URL.createObjectURL(blob);
				window.location.href = url;
			}
		}
	}
});
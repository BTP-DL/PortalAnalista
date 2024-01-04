sap.ui.define([
    //helpers
], function () {
    "use strict";
    return {
        _reader: null,
        initialize: function () {
            if (FileReader.prototype.readAsBinaryString === undefined) {
                FileReader.prototype.readAsBinaryString = function (fileData) {
                    var binary = "";
                    var pt = this;
                    var reader = new FileReader();
                    reader.onload = function (e) {
                        var bytes = new Uint8Array(reader.result);
                        var length = bytes.byteLength;
                        for (var i = 0; i < length; i++) {
                            binary += String.fromCharCode(bytes[i]);
                        }
                        //pt.result  - readonly so assign content to another property
                        pt.content = binary;
                        pt.onload(); // thanks to @Denis comment
                    };
                    reader.readAsArrayBuffer(fileData);
                };
            }
        },

        //callback will have a binarystring as parameter, ie callback(binaryString)
        readBinaryString: function (File, fileLoadedCallback) {
            //inicializa reader
            this._reader = new FileReader();
            this._reader.onload = jQuery.proxy(this._onFileReaderLoad, this, fileLoadedCallback);
            //comienza upload
            this._reader.readAsBinaryString(File);
        },

        //callback will have a binarystring as parameter, ie callback(binaryString)
        readBinaryStringPromise: function (File) {
            //inicializa reader
            return new Promise((resolve, reject) => {
                let reader = new FileReader();
                reader.onload = function () {
                    resolve((reader.result) ? btoa(reader.result) : btoa(reader.content));
                };
                reader.onerror = reject;
                //comienza upload
                reader.readAsBinaryString(File);
            });
        },

        blobToBinaryStringIE11: function (blob) {
            var blobURL = URL.createObjectURL(blob);
            var xhr = new XMLHttpRequest();
            xhr.open("get", blobURL);
            xhr.overrideMimeType("text/plain; charset=x-user-defined");
            xhr.onload = function () {
                var binary = xhr.response;
                // do stuff
            };
            xhr.send();
        },

        _onFileReaderLoad: function (callback) {
            //busco contenido xstring del archivo
            var binaryString;
            if (this._reader.result) {
                binaryString = btoa(this._reader.result);
            } else {
                binaryString = btoa(this._reader.content);
            }
            //llamo a Callback
            callback(binaryString);
        }
    };
});
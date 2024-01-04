sap.ui.define([
    "simplot/portalsanalistaqas/utils/models",
    "simplot/portalsanalistaqas/utils/gateway",
    "simplot/portalsanalistaqas/utils/controller/CommonNoticia",
    "simplot/portalsanalistaqas/utils/controller/CommonClaims",
    "simplot/portalsanalistaqas/utils/controller/CommonFacturasView",
    "sap/ui/export/Spreadsheet"
    //helpers
], function (models, gateway, CommonNoticia, CommonClaims, CommonFacturasView, Spreadsheet) {
    "use strict";
    var sService = "NOTICIAS";
    var sServiceGeneral = "GENERAL";
    var sModelMainPizarron = "Model_Pizarron";
    var sModelMain = "Model_MainEmp";
    return {
        getI18nText: function (sId) {
            return models.get("i18n").getProperty(sId);
        },

        onDownloadFile: function (base64code, contentType, docName) {
			try {
				this.saveDataFile(this.btoBlob(atob(base64code), contentType), docName);
			} catch (ex) {
				console.log("Error al subir imagen");
			}
		},
		btoBlob: function (binary, contentType, sliceSize) {
			contentType = contentType || '';
			sliceSize = sliceSize || 2048;
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
		saveDataFile: function (blob, fileName) {
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
		},

        navToViewFacturas: function (oTargets) {
			CommonFacturasView.onLoadModelFacturas();
			oTargets.display("facturasview");
		},

        navToPizarron: function (oTargets) {
            CommonNoticia.onLoadModelPizarron()
            oTargets.display("pizarron");
        },

        navToSolicitud: function (oTargets) {
            //CommonNoticia.onLoadModelPizarron()
            oTargets.display("solicitud");
        },

        navToClaims: function (oTargets) {
            return CommonClaims.navToClaims(oTargets);
        },

        onLoadModelUserSAP: function (sUser) {
            var oContext = this;
            oContext.onShowBusy();
            oContext.onChangeTextBusy(oContext.getI18nText("RecuperandoDatos"));
            models.load("Model_UserSAP", {
                "DataUser": {}
            });
            if (sUser === undefined) {
                //sUser = 'matias.favale@hotmail.com.ar';
                //sUser = 'gdandretta@simplot.com.ar';
                sUser = 'agonzalez@dlconsultores.com.ar';
            }
            var sEntity = "/UsuarioSAPSet('" + sUser.toUpperCase() + "')";
            gateway.read(sServiceGeneral, sEntity, {/*"filters": [nFilter]*/ })
                .then(function (oRecive) {
                    models.get("Model_UserSAP").setProperty("/DataUser", oRecive);
                    models.get("Model_UserSAP").refresh();
                    if(oRecive.EvTipo === "E"){
						sap.m.MessageBox.error(oRecive.EvMensaje);
						models.get(sModelMain).setProperty("/UserEnabled", false);
						models.get(sModelMain).refresh();
					}else{
						models.get(sModelMain).setProperty("/UserEnabled", true);
						models.get(sModelMain).refresh();
                        //Habilita Apps
                        var aDataAccessApps = oContext.onCheckUser();
                        const oAccessClaims = aDataAccessApps.filter(nfilter => nfilter.App === "Reclamos")[0];
                        if (oAccessClaims.canUseApp) {
                            CommonClaims.getClaims();
                        }
                    }
                    oContext.onCloseBusy();
                })
                .catch(function (oError) {
                    oContext.onCloseBusy();
                    console.log(oError);
                });
        },

        onLoadModelPizarron: function () {
            var aData = []
            if (models.exists(sModelMainPizarron)) {
            } else {
                models.load(sModelMainPizarron, {
                    "rowsPizarron": [],
                    "rowsPizarronCount": 0,
                    "rowsPizarronBack": [],
                    "rowsProveedoresVisto": [],
                    "rowsProveedoresVistoCount": 0,
                    "valueSearch": "",
                    "dateValueOne": undefined,
                    "dateValueTwo": undefined
                });
            }
            models.get(sModelMainPizarron).refresh();
            this.onGetNoticias();
        },

        onGetNoticias: function () {
            var oContext = this;
            var sEntity = "/ListaNoticiaSet";
            gateway.read(sService, sEntity, {/*"filters": [nFilter]*/ })
                .then(function (oRecive) {
                    var aData = oRecive.results;
                    for (var i in aData) {
                        aData[i].FechaInicio = oContext.formatDate(aData[i].FechaIni, "Main");
                        aData[i].FechaFinal = oContext.formatDate(aData[i].FechaFin, "Main");
                        aData[i].FechaFormatted = oContext.formatDate(aData[i].Fecha, "Main");
                        aData[i].HoraFormatted = oContext.formatDate(aData[i].Hora, "GetHour");
                        aData[i].FechaHora = aData[i].Fecha + "" + aData[i].Hora;
                        aData[i].ID = Number(aData[i].Codnot).toString();
                    }
                    aData = aData.sort(oContext.sortGlobal);
                    models.get(sModelMainPizarron).setProperty("/rowsPizarron", aData);
                    models.get(sModelMainPizarron).setProperty("/rowsPizarronBack", aData);
                    models.get(sModelMainPizarron).setProperty("/rowsPizarronCount", aData.length);
                    models.get(sModelMainPizarron).refresh();
                    console.log(oRecive);
                })
                .catch(function (oError) {
                    console.log(oError);
                });
        },

        onGetObtenerVisto: function (sCode) {
            var oContext = this;
            var sEntity = "/ObtenerVistosSet";
            var nFilter = new sap.ui.model.Filter("IvCodnot", "EQ", sCode);
            gateway.read(sService, sEntity, { "filters": [nFilter] })
                .then(function (oRecive) {
                    var aData = oRecive.results;
                    for (var i in aData) {
                        aData[i].Fecha = oContext.formatDate(aData[i].Fecha, "Main");
                        aData[i].Hora = oContext.formatDate(aData[i].Hora, "GetHour");
                    }
                    models.get(sModelMainPizarron).setProperty("/rowsProveedoresVisto", aData);
                    models.get(sModelMainPizarron).setProperty("/rowsProveedoresVistoCount", aData.length);
                    models.get(sModelMainPizarron).refresh();
                    console.log(oRecive);
                })
                .catch(function (oError) {
                    console.log(oError);
                });
        },

        onGetCuerpoNoticia: function (sCode) {
            var oContext = this;
            var sEntity = "/ObtenerCuerpoSet('" + sCode + "')";
            gateway.read(sService, sEntity, {/*"filters": [nFilter]*/ })
                .then(function (oRecive) {
                    //var aData = oRecive.results;
                    models.get(sModelMainPizarron).setProperty("/ViewNoticia", oRecive);
                    models.get(sModelMainPizarron).refresh();
                    oContext.onCloseBusy();
                    console.log(oRecive);
                })
                .catch(function (oError) {
                    console.log(oError);
                });
        },

        onViewNoticia: function (sCode) {
            var oController = models.get(sModelMain).getProperty("/ControllerMain");
            var oContext = this;
            var oTableNoticia,
                oDeferred = new jQuery.Deferred();
            var objData = { EvCuerpo: "" };
            models.get(sModelMainPizarron).setProperty("/ViewNoticia", objData);
            models.get(sModelMainPizarron).refresh();
            if (!oController._ControllerViewNoticia) {
                oController._ControllerViewNoticia = {
                    "deferred": null,
                    "onPressCancelNoticia": function (oEvent) {
                        oTableNoticia.close();
                    },
                    "onPressConfirmNoticia": function (oEvent) {
                        oTableNoticia.close();
                    }
                };
            }
            oController._ControllerViewNoticia.deferred = oDeferred;

            if (!oController._dialogViewNoticia) {
                oController._dialogViewNoticia = sap.ui.xmlfragment("simplot.portalsanalistaqas.view.fragment.ViewNoticia", oController._ControllerViewNoticia);
            }
            oTableNoticia = oController._dialogViewNoticia;
            oTableNoticia.setModel(models.get(sModelMainPizarron));
            oController.getView().addDependent(oTableNoticia);
            oTableNoticia.open();
            this.onShowBusy();
            this.onChangeTextBusy(oContext.getI18nText("RecuperandoDatos"));
            setTimeout(function () {
                oContext.onGetCuerpoNoticia(sCode);
                oContext.onGetObtenerVisto(sCode);
            }, 2000);
        },

        onAddNoticia: function () {
            var oController = models.get(sModelMain).getProperty("/ControllerMain");
            var oContext = this;
            var oTableNoticia,
                oDeferred = new jQuery.Deferred();
            var oUser = models.get("Model_UserSAP").getProperty("/DataUser");
            var oCargaNoticia = {
                Codnot: "0000000000", TipoBp: "P", Titulo: "", GrupoNac: false, GrupoExt: false,
                Usuario: oUser.UsuarioSap,
                FechaFormatted: this.formatDate(new Date(), "GetDate"), Hora: this.formatDate(new Date(), "GetTimer"),
                FechaIniFormatted: this.formatDate(new Date(), "GetDate"),
                FechaFinFormatted: this.formatDate(new Date(), "GetDate"),
                IvCuerpo: ""
            };
            models.get(sModelMainPizarron).setProperty("/CargaNoticia", oCargaNoticia);
            models.get(sModelMainPizarron).refresh();
            if (!oController._ControllerNoticia) {
                oController._ControllerNoticia = {
                    "deferred": null,
                    "onPressCancelNoticia": function (oEvent) {
                        oTableNoticia.close();
                    },
                    "onValidateNoticia": function (oProperty) {
                        var objValid = { BoolValid: true, Mensaje: "" };
                        if (oProperty.FechaIni === "" || oProperty.FechaFin === "") {
                            objValid.BoolValid = false;
                            objValid.Mensaje = "Los campo fecha son obligatorios.";
                        }
                        if (oProperty.FechaIni > oProperty.FechaFin) {
                            objValid.BoolValid = false;
                            objValid.Mensaje = "La fecha Hasta debe ser mayor a la fecha Desde.";
                        }
                        if (oProperty.GrupoNac === false && oProperty.GrupoExt === false) {
                            objValid.BoolValid = false;
                            objValid.Mensaje = "Debe seleccion al menos un grupo.";
                        }
                        return objValid;
                    },
                    "onPressConfirmNoticia": function (oEvent) {
                        var oProperty = models.get(sModelMainPizarron).getProperty("/CargaNoticia");
                        oProperty.FechaIni = oContext.formatDate(oProperty.FechaIniFormatted, "Update");
                        oProperty.FechaFin = oContext.formatDate(oProperty.FechaFinFormatted, "Update");
                        oProperty.Fecha = oContext.formatDate(oProperty.FechaFormatted, "Update");

                        var oValid = this.onValidateNoticia(oProperty);
                        if (oValid.BoolValid) {
                            delete oProperty.FechaIniFormatted;
                            delete oProperty.FechaFinFormatted;
                            delete oProperty.FechaFormatted;
                            var sEntity = "/CrearNoticiaSet";
                            gateway.create(sService, sEntity, oProperty)
                                .then(function (oRecive) {
                                    oContext.onGetNoticias();
                                    console.log(oRecive);
                                    oTableNoticia.close();
                                })
                                .catch(function (oError) {
                                    console.log(oError);
                                });
                        } else {
                            sap.m.MessageBox.error(oValid.Mensaje);
                        }

                    }
                };
            }
            oController._ControllerNoticia.deferred = oDeferred;

            if (!oController._dialogNoticia) {
                oController._dialogNoticia = sap.ui.xmlfragment("simplot.portalsanalistaqas.view.fragment.AddNoticia", oController._ControllerNoticia);
            }
            oTableNoticia = oController._dialogNoticia;
            oTableNoticia.setModel(models.get(sModelMainPizarron));
            oController.getView().addDependent(oTableNoticia);
            oTableNoticia.open();
        },

        onDeleteNoticia: function (sCode) {
            var oContext = this;
            var sText = oContext.getI18nText("AskDeleteNew");
            sap.m.MessageBox.show(sText, {
                "icon": sap.m.MessageBox.Icon.WARNING,
                "title": oContext.getI18nText("Info"),
                "actions": [
                    sap.m.MessageBox.Action.YES,
                    sap.m.MessageBox.Action.NO
                ],
                "onClose": function (vAction) {
                    if (vAction === sap.m.MessageBox.Action.YES) {
                        oContext.onConfirmDelete(sCode);
                    } else { }
                }
            });
        },
        onConfirmDelete: function (sCode) {
            var oContext = this;
            this.onShowBusy();
            this.onChangeTextBusy(oContext.getI18nText("EliminandoDatos"));

            var sEntity = "/BorrarNoticiaSet('" + sCode + "')";
            gateway.read(sService, sEntity, {/*"filters": [nFilter]*/ })
                .then(function (oRecive) {
                    if (oRecive.EvTipo === "E") {
                        sap.m.MessageBox.error(oRecive.EvMensaje);
                    } else {
                        sap.m.MessageBox.success(oRecive.EvMensaje);
                        oContext.onGetNoticias();
                    }

                    oContext.onCloseBusy();
                })
                .catch(function (oError) {
                    console.log(oError);
                });
        },

        sortGlobal: function (x, y) {
            if (x["FechaHora"] > y["FechaHora"]) {
                return -1;
            }
            if (x["FechaHora"] < y["FechaHora"]) {
                return 1;
            }
            return 0;
        },

        onCheckUser: function () {
            var oUser = models.get("Model_UserSAP").getProperty("/DataUser");
            var aDataApps = models.get(sModelMain).getProperty("/Apps");
            for (var i in aDataApps) {
                if (aDataApps[i].App === "Pizarron") {
                    if (oUser.UsuarioSap === "" || oUser.ApNoticias === false) {
                        aDataApps[i].canUseApp = false;
                    } else {
                        aDataApps[i].canUseApp = true;
                    }
                } else if (aDataApps[i].App === "Reclamos") {
                    if (oUser.UsuarioSap === "" || oUser.ApReclamos === false) {
                        aDataApps[i].canUseApp = false;
                    } else {
                        aDataApps[i].canUseApp = true;
                    }
                } else if(aDataApps[i].App === "Solicitudes"){
                    if (oUser.UsuarioSap === "" || oUser.ApCuentas === false) {
                        aDataApps[i].canUseApp = false;
                    } else {
                        aDataApps[i].canUseApp = true;
                    }
                } else if(aDataApps[i].App === "Facturas"){
                    if (oUser.UsuarioSap === "" || oUser.ApFacturas === false) {
                        aDataApps[i].canUseApp = false;
                    } else {
                        aDataApps[i].canUseApp = true;
                    }
                }
            }
            models.get(sModelMain).setProperty("/Apps", aDataApps);
            models.get(sModelMain).refresh();
            return aDataApps;
        },

        onSearchGlobal: function (objectData) {
            var aList = objectData.Model.getProperty(objectData.ListaDataBack);
            var aNewList = [];
            if (objectData.Query === "") {
                objectData.Model.setProperty(objectData.ListaData, aList);
                objectData.Model.setProperty(objectData.ListaDataCount, aList.length);
                objectData.Model.refresh();
            } else {
                if (isNaN(objectData.Query)) {
                    aNewList = aList.filter(nfilter => nfilter[objectData.Prop1].toUpperCase().match(objectData.Query.toUpperCase()));
                } else {
                    aNewList = aList.filter(nfilter => nfilter[objectData.Prop2].match(Number(objectData.Query)));
                }
                objectData.Model.setProperty(objectData.ListaData, aNewList);
                objectData.Model.setProperty(objectData.ListaDataCount, aNewList.length);
                objectData.Model.refresh();
            }
        },

        onShowBusy: function () {
            var oContext = this;
            var oController = models.get(sModelMain).getProperty("/ControllerMain");
            models.load("Model_Busy", {
                "Title": oContext.getI18nText("MsgBusyTitle"),
                "Text": oContext.getI18nText("CargaDatos")  //
            });
            if (!oController._dialog) {
                oController._dialog = sap.ui.xmlfragment("simplot.portalsanalistaqas.view.fragment.BusyStatus", oController);
                oController.getView().addDependent(oController._dialog);
            }
            jQuery.sap.syncStyleClass("sapUiSizeCompact", oController.getView(), oController._dialog);
            oController._dialog.setModel(models.get("Model_Busy"));
            oController._dialog.open();
        },
        onChangeTextBusy: function (sText) {
            var oController = models.get(sModelMain).getProperty("/ControllerMain");
            oController._dialog.getModel().setProperty("/Title", this.getI18nText("MsgBusyTitle")); //MsgBusyTitle
            oController._dialog.getModel().setProperty("/Text", sText);
            oController._dialog.getModel().refresh();
        },
        onCloseBusy: function () {
            var oController = models.get(sModelMain).getProperty("/ControllerMain");
            oController._dialog.close();
        },
        getMsgError: function (oError, oContext) {
            if (oContext._dialog !== undefined) {
                oContext.onCloseBusy();
            }
            var sText = oError.toString();// "Reintente nuevamente";
            if (oError.statusCode !== undefined) {
                if ((oError.statusCode.toString() === "400") || (oError.statusCode.toString() === "404")) {
                    if (oError.responseText !== undefined) {
                        sText = JSON.parse(oError.responseText).error.message.value;
                    } else {
                        sText = JSON.parse(oError.body).error.message.value;
                    }

                } else if (oError.statusCode.toString() === "504") {
                    sText = oContext.getI18nText("ErrTimeOut") //ErrTimeOut
                }
            }
            return sText;
        },

        formatterNum: function (nNumber, sMoneda) {
            var sLang = sap.ui.getCore().getConfiguration().getLanguage();
            var oLocale = new sap.ui.core.Locale(sLang);
            var oFormatOptions = {
                minIntegerDigits: 1,
                maxIntegerDigits: 13,
                minFractionDigits: 2,
                maxFractionDigits: 2
            };
            if ((nNumber !== undefined) && (nNumber !== null)) {
                nNumber = nNumber.toString().replace(",", ".");
            }

            var oFloatFormat = sap.ui.core.format.NumberFormat.getFloatInstance(oFormatOptions, oLocale);
            if (sMoneda !== undefined) {
                return oFloatFormat.format(nNumber) + " " + sMoneda;
            } else {
                return oFloatFormat.format(nNumber);
            }
        },

        formatDate: function (sDate, sType) {
            if (sDate !== undefined) {
                if (sDate !== "") {
                    var sNewDate;
                    if (sType === "Main") {
                        sNewDate = sDate.slice(6, 8) + "/" + sDate.slice(4, 6) + "/" + sDate.slice(0, 4);
                    }else if (sType === "FormatYYYY/MM/DD") {
						sNewDate = sDate.slice(0, 4) + "/" + sDate.slice(4, 6) + "/" + sDate.slice(6, 8);
					} else if (sType === "Update") {
                        sNewDate = sDate.split("/")[2] + sDate.split("/")[1] + sDate.split("/")[0];
                    } else if (sType === "show") {
                        sNewDate = sDate.split("/")[0] + "/" + sDate.split("/")[1] + "/" + sDate.split("/")[2];
                    } else if (sType === "hhmmss") {
                        //sNewDate = sDate.slice(0,2) + ":" + sDate.slice(2,4) + ":" + sDate.slice(4,6);
                        sNewDate = new Date(new Date(new Date(new Date().setHours(sDate.slice(0, 2))).setMinutes(sDate.slice(2, 4))).setSeconds(sDate.slice(4, 6)))

                    } else if (sType === "GetHour") {
                        sNewDate = sDate.slice(0, 2) + ":" + sDate.slice(2, 4) + ":" + sDate.slice(4, 6);

                    } else if (sType === "GetDay") {
                        sNewDate = this.getDay(sDate);
                    } else if (sType === "GetDate") {
                        var sMonth = this.getMes(sDate.getMonth());
                        sNewDate = this.validChar(sDate.getDate()) + "/" + this.validChar(sMonth) + "/" + sDate.getFullYear();
                    } else if (sType === "GetDayChange") {
                        sDate = new Date(sDate.split("/")[2] + "/" + sDate.split("/")[1] + "/" + sDate.split("/")[0]);
                        sNewDate = this.getDay(sDate.getDay());
                    } else if (sType === "GetTimer") {
                        sNewDate = this.validChar(sDate.getHours().toString()) + this.validChar(sDate.getMinutes().toString()) +
                            this.validChar(sDate.getSeconds().toString());
                    } else if (sType === "FormatAAAAmmDD") {
                        sNewDate = sDate.split("/")[2] + "/" + sDate.split("/")[1] + "/" + sDate.split("/")[0]
                    }
                    return sNewDate;
                }
            } else {
                sDate = "";
                return sNewDate;
            }
        },

        validChar: function (sTime) {
            if (sTime.toString().length === 1) {
                sTime = "0" + sTime;
            }
            return sTime
        },

        getMes: function (sMes) {
            var sMonth = sMes + 1;
            return sMonth;
        },

        getDay: function (sDay) {
            var sDate = "";
            if (sDay === 0) {
                sDate = "Domingo";
            } else if (sDay === 1) {
                sDate = "Lunes";
            } else if (sDay === 2) {
                sDate = "Martes";
            } else if (sDay === 3) {
                sDate = "Miercoles";
            } else if (sDay === 4) {
                sDate = "Jueves";
            } else if (sDay === 5) {
                sDate = "Viernes";
            } else if (sDay === 6) {
                sDate = "Sabado";
            }
            return sDate;
        },

        getCombosFacturas: function(){
            var aTipoFactura = [{key: "FC", value: "Factura"}, 
                {key: "NC", value: "Nota de Credito"}, {key: "ND", value: "Nota de Debito"},
                {key: "EX", value: "Documento del exterior"}
            ];
            var aCircuito = [{key: "1", value: "Compras"}, 
                {key: "2", value: "Gastos de Importacion"},
                {key: "3", value: "Póliza"}
            ];
            var aModo = [{key: "E", value: "CAE"}, {key: "I", value: "CAI"}, {key: "A", value: "CAEA"}];
            var aMoneda = [
                {key: "ARS", value: "Peso Argentino" }, {key: "USD", value: "Dólar" },
                {key: "EUR", value: "Euro" }, {key: "CLP", value: "Peso Chileno" },
                {key: "BRL", value: "Real" }];
                     
            var aKeysIIBB = [
                {key:"PercGanancias", value: "Percepción Ganancias", opciones:"Ganancias"},
                {key:"PercIVA", value: "Percepción IVA", opciones:"Percepcion IVA"},
                {key:"PercIbAduana", value: "Percepciones IIBB Aduana", opciones:"Aduana"},
                {key: "PercIbCABA", value: "Percepción IIBB CABA", opciones:"CABA||Capital||Capital Federal"},
                {key:"PercIbBsAs", value: "Percepción IIBB Bs As", opciones:"Buenos Aires||BS. AS.||Bs.As.||Bs As||II.BB.Buenos Aires||"},
                {key:"PercIbCatamarca", value: "Percepción IIBB Catama", opciones:"Catamarca||II.BB.Catamarca"},
                {key:"PercIbChaco", value: "Percepción IIBB Chaco", opciones:"Chaco"},
                {key:"PercIbChubut", value: "Percepción IIBB Chubut", opciones:"Chubut"},
                {key:"PercIbCordoba", value: "Percepción IIBB Cordoba", opciones:"Córdoba||Cba||Cordoba"},
                {key:"PercIbCorrientes", value: "Percepción IIBB Corrientes", opciones:"Corrientes"},
                {key:"PercIbEntreRios", value: "Percepción IIBB Entre Rios", opciones:"Entre Ríos||Entre Rios"},
                {key:"PercIbFormosa", value: "Percepción IIBB Formosa", opciones:"Formosa"},
                {key:"PercIbJujuy", value: "Percepción IIBB Jujuy", opciones:"Jujuy"},
                {key:"PercIbLaPampa", value: "Percepción IIBB La Pampa", opciones:"La Pampa"},
                {key:"PercIbLaRioja", value: "Percepción IIBB La Rioja", opciones:"La Rioja"},
                {key:"PercIbMendoza", value: "Percepción IIBB Mendoza", opciones:"Mendoza"},
                {key:"PercIbMisiones", value: "Percepción IIBB Misiones", opciones:"Misiones"},
                {key:"PercIbNeuquen", value: "Percepción IIBB Neuquen", opciones:"Neuquén||Neuquen"},
                {key:"PercIbRioNegro", value: "Percepción IIBB Rio de Negro", opciones:"Río Negro||Rio Negro"},
                {key:"PercIbSalta", value: "Percepción IIBB Salta", opciones:"Salta||II.BB.Salta"}, 
                {key:"PercIbSanJuan", value: "Percepción IIBB San Juan", opciones:"San Juan"},
                {key:"PercIbSanLuis", value: "Percepción IIBB San Luis", opciones:"San Luis"},
                {key:"PercIbSantaCruz", value: "Percepción IIBB Santa Cruz", opciones:"Santa Cruz||Sta Cruz||Sta.Cruz||Sta. Cruz"},
                {key:"PercIbSantaFe", value: "Percepción IIBB Santa Fe", opciones:"Santa Fe||Sta. Fe||Sta.Fe||Sta Fe"},
                {key:"PercIbSgoEstero", value: "Percepción IIBB Sgo. Del Estero", opciones:"Santiago del Estero"},
                {key:"PercIbTierraFuego", value: "Percepción IIBB Tierra del Fuego", opciones:"Tierra del Fuego"},
                {key:"PercIbTucuman", value: "Percepción IIBB Tucuman", opciones:"Tucumán||Tuc||Tucuman||II.BB.Tucuman||Tuc."},
                {key:"PercImpIntTasasContrib", value: "Impuestos Internos / Tasas y contrib.", opciones:"Percepcion IVA"}
            ];       
            var aKeysIva = [
                {key: "IVA21", value:"IVA 21%", opciones:"21,000%||21.0%||21%||21,0%||21.00%||(21,0)%||21,00%||21%:"},
                {key: "IVA105", value:"IVA 10,5%", opciones:"10,5%||10.5%||10.5%:"},
                {key: "IVA27", value:"IVA 27%", opciones:"27,000%||27.0%||27%||27,0%||27.00%||(27,0)%||27,00%||27%:"},
                {key: "IVA0", value:"IVA 0% Exento ", opciones:"0,000%||0.0%||0%||0,0%||0.00%||(0,0)%||0,00%||0%:"}
            ];
            /*
            {key: "5%", opciones:"5,000%||5.0%||5%||5,0%||5.00%||(5,0)%||5,00%||5%:"},
                {key: "2,5%", opciones:"2,5%||2.5%||2.5%:"}
            */
           var aState  = [
               {key: "1", value:"Pendiente"},
               {key: "2", value:"Exportado"},
               {key: "3", value:"Rechazado"}
           ];
            var aCombos = {
                TipoFactura: aTipoFactura,
                Circuito: aCircuito,
                Modo: aModo,
                Moneda: aMoneda,
                KeysIIBB: aKeysIIBB,
                KeysIva: aKeysIva,
                State: aState
            };
            return aCombos;
        },

        validTaxCharacter:function(sCatacter){
            var objData = {Key: "", Val:""};
            if(sCatacter.toString().length === 1){
                objData.Key = "TaxKey0" + sCatacter;
                objData.Val = "TaxVal0" + sCatacter;                
            }else{
                objData.Key = "TaxKey" + sCatacter;
                objData.Val = "TaxVal" + sCatacter;  
            }
            return objData;
        },

        onDownloadExcel:function(oObjectExcel){
			var validChar = this.validChar ;
			var sName = oObjectExcel.NameExcel + new Date().getFullYear() + validChar(new Date().getDate()) + validChar(Number(new Date().getMonth() + 1)) 
				+ "_" + validChar(new Date().getHours()) + validChar(new Date().getMinutes()) + validChar(new Date().getSeconds()) + ".xlsx";
			var mSettings = {
                workbook: {
                    columns: oObjectExcel.Columnas,
                    context: {
                        application: oObjectExcel.Application,
                        version: 'x',
                        title: oObjectExcel.Name,
                        modifiedBy: '',
                        metaSheetName: '',
                        metainfo: []
                    },
                    hierarchyLevel: 'level'
                },
                dataSource: oObjectExcel.Source,
                fileName: sName
            };

            var oSpreadsheet = new Spreadsheet(mSettings);
            oSpreadsheet.build();
		},

        liveNumberDecimal: function (oSource) {
			var sValue = oSource.getValue();
            if(sValue.lastIndexOf(",") !== sValue.indexOf(",")){
                sValue = sValue.replace(",", "");
            }
			var	sNumber = this.onReturnNumberDecimal(sValue, true),
				nNumber = Number(sNumber);
            var oFocusInfo = oSource.getFocusInfo();
			//oSource.setValue(sNumber.replace(/\./, ','));
            if(sValue === ""){}else{
                oSource.setValue(this.onReturnFormatNumber(nNumber,2));
                oSource.applyFocusInfo(oFocusInfo);
                if(sNumber === ""){}else{
                    if (!sNumber || isNaN(nNumber)) {
                        var sInvalidValue = sValue;
        
                        if (!sNumber) {
                            sValue = "0";
                            sInvalidValue = "vacio";
                        }
        
                        if (sValue.match(/[\-]{1,}/)) {
                            sValue = sValue.charAt(0) + sValue.substring(1).replace(/\-/g, '');
                        }
        
                        oSource.setValue(sValue.replace(/[^0-9\,\.\-]{1,}/g, ''));
                        sap.m.MessageToast.show("Solo se permiten Valores Numericos, " + sInvalidValue + " no una entra valida.");
                    }
                }	
            }
            		
		},

        onReturnFormatNumber: function(nNumber, nMinDecimal){
            if(nMinDecimal === null || nMinDecimal === undefined){
                nMinDecimal = 2;
            }
            return nNumber.toLocaleString('es-ES', {minimumFractionDigits: nMinDecimal});
        },

        onReturnNumberDecimal: function(sNumber, isPoint){
            if(isPoint){
                sNumber= sNumber.replaceAll(".", "").replace(/[^0-9 . ,]/g, '').replace(",", ".");
            }
            return sNumber;            
        },

        onReturnFormatToSend: function(sNumber){
            sNumber = sNumber.replaceAll(".", "").replace(",", ".");
            sNumber = Number(sNumber).toFixed(2);
            return sNumber;
        },

        f_Inputs: function (inputs) {
			var that = this;
			if (inputs == undefined)
				return true;

			jQuery.each(inputs, function (i, input) {
				input.setValueState("None");
			});
			jQuery.each(inputs, function (i, input) {
				// Hacer VALIDACION para _todo INPUT que esté HABILITADO
				if (input.getEnabled() == true) {
					var sType = input.getMetadata().getName();
					switch (sType) {
					case "sap.m.ComboBox":
					case "sap.m.Select":
						if (input.getSelectedKey() == "" || input.getSelectedKey() == "DUM") {
							input.setValueState("Error");
						}
						break;
					case "sap.m.Input":
						if (input.getType() == "Email") {
							// Validamos el Email.
							if (input.getValue() == "") {
								input.setValueState("Error");
							} else {
								var mailregex = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/;
								if (!mailregex.test(input.getValue())) {
									that.f_showMessage("WARNING", oInicioController.getResourceBundle().getText("Invalid-Email"));
									input.setValueState("Error");
								} else input.setValueState("None");
							}
						} else if (input.getValue() == "")
							input.setValueState("Error");

						break;
					case "sap.m.RadioButtonGroup":
						if (input.getSelectedIndex() == -1) {
							input.setValueState("Error");
						}
						break;
					default:
						if (!input.getValue()) {
							input.setValueState("Error");
						}
						break;
					}
				}
			});
			// verificar estado de entradas
			var canContinue = true;
			jQuery.each(inputs, function (i, input) {
				if ("Error" === input.getValueState()) {
					canContinue = false;
				}
			});
			//resultados de salidas
			if (canContinue) {
				return true;
			} else {
				return false;
			}
		},

		f_FElements: function (elements) {
			var that = this;
			var result = false;
			var oInputs = [];
			var oRequired;
			// Valida el Atributo 'required': sólo aquellos controles cuyo campo de entrada es requerido
			for (var i = 0; i < elements.length; i++) {
				oRequired = elements[i].getLabelControl().getRequired();
				for (var j = 0; j < elements[i].getFields().length; j++) {
					if (elements[i].getFields()[j].getMetadata().getName() != "sap.m.Label") {
						if (elements[i].getFields()[j].getMetadata().getName() == "sap.m.FlexBox") {
							for (var k = 0; k < elements[i].getFields()[j].getItems().length; k++) {
								if (elements[i].getFields()[j].getItems()[k].getMetadata().getName() != "sap.m.Label" && elements[i].getFields()[j].getItems()[
										k].getMetadata().getName() != "sap.m.Text") {
									if (oRequired == true) oInputs.push(elements[i].getFields()[j].getItems()[k]);
								}
							}
						} else {
							if (oRequired == true) oInputs.push(elements[i].getFields()[j]);
						}

					}

				}

			}

			result = that.f_Inputs(oInputs);

			setTimeout(function () {
				that.f_setStateNoneInputs(oInputs);
			}, 6000);

			return result;
		},

		f_setStateNoneInputs: function (inputs) {
			var that = this;
			if (inputs == undefined)
				return true;

			jQuery.each(inputs, function (i, input) {
				if (input != undefined)
					input.setValueState("None");
			});
		}
    };
});
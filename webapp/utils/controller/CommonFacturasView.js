sap.ui.define([
	"simplot/portalsanalistaqas/utils/models",
	"simplot/portalsanalistaqas/utils/gateway"
	//helpers
], function (models, gateway) {
	"use strict";
	var sService = "FACTURA";
	var sServiceAuto = "AUTOGESTION";
    var sServiceGeneral = "GENERAL";
    var sModelMainFacturasView = "Model_FacturasView";
    var sModelMain = "Model_MainEmp";
    var serviceOCR;
    var sServiceOC = "ORDEN_COMPRA";
    var sServiceAFIP = "AFIP";
 
	return {

        getCommon:function(){
            var commonHelp = sap.ui.require("simplot/portalsanalistaqas/utils/Common");
            return commonHelp;
        },

        getI18nText: function(sId){
			return models.get("i18n").getProperty(sId);
		},

        onLoadExenciones: function(){
            var sEntity = "/ExencionesSet";
            gateway.read(sService, sEntity, {}).then(function (oRecive) {
                console.log("/ExencionesSet");
                console.log(oRecive);
                var aData =  oRecive.results;
                models.get(sModelMainFacturasView).setProperty("/ListaExenciones", aData);
            }).catch(function (oError) {
                console.log(oError);
            });
        },

        onLoadModelFacturas:function(){
            var oContext = this;
            var oCommonHelp = this.getCommon(); 
			oCommonHelp.onShowBusy();
			oCommonHelp.onChangeTextBusy(this.getI18nText("RecuperandoDatos"));
            
            if(models.exists(sModelMainFacturasView)){
                models.get(sModelMainFacturasView).setProperty("/rowsFacturasViewCount",0);
                models.get(sModelMainFacturasView).setProperty("/rowsFacturasView",[]);
                models.get(sModelMainFacturasView).setProperty("/DetailFactura",{"Factura":{},
                    "PDFViewerDetail": {"isVisibile": false, "SourcePDF":""}});
            }else{
                models.load(sModelMainFacturasView, {
                    "Filtros": {
                        "Lifnr":"", 
                        "Estado": oCommonHelp.getCombosFacturas().State, "selectEstado":"",
                        "dateValueOne":  undefined, "dateValueTwo":  undefined,
                        "Sociedad": [], "selectSociedad": "",
                        "Numero":"",
                        "TipoDoc": oCommonHelp.getCombosFacturas().TipoFactura, "selectTipoDoc": "",
                        "Circuito": oCommonHelp.getCombosFacturas().Circuito, "selectCircuito": "",
                        "NumOc": ""
                    },
                    "comboOrdenCompra": {"rowTemplate": [], "selectKey":"", "required": false,
                        "habilitado": true},
                    "rowsFacturasViewCount":0,
                    "rowsFacturasView":[],
                    "DetailFactura":{"Factura":{},
                        "PDFViewerDetail": {"isVisibile": false, "SourcePDF":""}},
                    "ComboSubtipo": [],
                    "ComboSociedad":[],
                    "ComboModo": oCommonHelp.getCombosFacturas().Modo,
                    "ComboMoneda": oCommonHelp.getCombosFacturas().Moneda,
                    "ComboIIBB":  oCommonHelp.getCombosFacturas().KeysIIBB,
                    "ComboIVA":  oCommonHelp.getCombosFacturas().KeysIva,
                    "ListaExenciones": []
                });
            }
            models.get(sModelMainFacturasView).refresh();
            this.onLoadExenciones();
            this.onGetTiposDoc();
            //this.onGetFacturas();
        },

        onCheckExencion: function(oBoolExencion, sSociedad, sTaxKey, dDateFactura, oIIBBItems){
            var aListaExenciones  =  models.get(sModelMainFacturasView).getProperty("/ListaExenciones");
            var oCommonHelp = this.getCommon(); 
            if(aListaExenciones.length > 0){
                var aFilterExencion = aListaExenciones.filter(nfilter=>nfilter.Sociedad === sSociedad && nfilter.TaxKey === sTaxKey);
                if(aFilterExencion.length > 0){
                    for(var k in aFilterExencion){
                        var dDateDesde = new Date(oCommonHelp.formatDate(aFilterExencion[k].Desde, "FormatYYYY/MM/DD"));
                        var dDateHasta = new Date(oCommonHelp.formatDate(aFilterExencion[k].Hasta, "FormatYYYY/MM/DD"));
                        if(dDateFactura > dDateDesde && dDateFactura < dDateHasta){
                            var sItem = models.get(sModelMainFacturasView).getData().ComboIIBB.filter(nfilter=>nfilter.key === oIIBBItems.key)[0].value;
                            oBoolExencion.BoolContinueExencion = false;
                            if(oBoolExencion.MensajeExencion === ""){
                                oBoolExencion.MensajeExencion = "Existe una exención para " + sItem + ".";
                            }else{
                                oBoolExencion.MensajeExencion = oBoolExencion.MensajeExencion + "\n Existe una exención para " + sItem + "."; 
                            }                            
                        }
                    }
                }
            }
            return oBoolExencion;
        },

        onPressSave: function(oFactura, sRejectMotivo, oDialog){
            debugger;
            var oContext = this;
            var oCommonHelp = this.getCommon(); 
            var sTextMsg = "";
            var boolConstatar = true;
            if(sRejectMotivo === ""){
                oFactura.Estado = "1";
                sTextMsg = "Desea grabar la factura?";
                boolConstatar = true;
            }else{
                oFactura.Estado = "3";
                sTextMsg = "Desea rechazar la factura?";
                boolConstatar = false;
            }
            var aCombos = oCommonHelp.getCombosFacturas();
            var aIvaItems = oFactura.IvaTable;
            var aIIBBItems = oFactura.PercepcionesTable;
            var ComboIvaItems = aCombos.KeysIva;
            var ComboIIBBItems = aCombos.KeysIIBB;
            var nTaxIdx = 1;
            var sTotal = oCommonHelp.onReturnFormatToSend(oFactura.ImpBruto);
            var sSubTotal = oCommonHelp.onReturnFormatToSend(oFactura.ImpNeto);
            var sTipoCambio = oCommonHelp.onReturnFormatToSend(oFactura.TipoCambio);

            var sTotal = oCommonHelp.onReturnFormatToSend(oFactura.ImpBruto);
            var sSubTotal = oCommonHelp.onReturnFormatToSend(oFactura.ImpNeto);
            var sTipoCambio = oCommonHelp.onReturnFormatToSend(oFactura.TipoCambio);

            var oBoolExencion = {BoolContinue: true, BoolContinueExencion: true, Mensaje: "", MensajeExencion: ""};
            if(oFactura.NumOc !== ""){            
                var oFilterOC = models.get(sModelMainFacturasView).getProperty("/comboOrdenCompra/rowTemplate").filter(nfilter=>nfilter.Ebeln === oFactura.NumOc)[0];
                if(oFilterOC.Bukrs !== oFactura.Sociedad){
                    oBoolExencion.BoolContinue = false;
                    if(oBoolExencion.Mensaje === ""){
                        oBoolExencion.Mensaje = "La Sociedad cargada no coincide con la Orden de Compra elegida.";
                    }else{
                        oBoolExencion.Mensaje = oBoolExencion.Mensaje + "\n La Sociedad cargada no coincide con la Orden de Compra elegida."; 
                    }  
                }
                if(oFilterOC.Moneda !== oFactura.Moneda){
                    oBoolExencion.BoolContinue = false;
                if(oBoolExencion.Mensaje === ""){
                    oBoolExencion.Mensaje = "La Moneda cargada no coincide con la Orden de Compra elegida.";
                }else{
                    oBoolExencion.Mensaje = oBoolExencion.Mensaje + "\n La Moneda cargada no coincide con la Orden de Compra elegida."; 
                }  
                }else{
                    if(Number(sTotal) > Number(oFilterOC.TolFact)){
                        oBoolExencion.BoolContinue = false;
                        if(oBoolExencion.Mensaje === ""){
                            oBoolExencion.Mensaje = "El importe total excede el total de la Orden de Compra elegida.";
                        }else{
                            oBoolExencion.Mensaje = oBoolExencion.Mensaje + "\n El importe total excede el total de la Orden de Compra elegida.."; 
                        }  
                    }
                }
            }
            var sFechaDoc = oCommonHelp.formatDate( oFactura.FechaDoc, "Update");
            var dDateFactura = new Date(oCommonHelp.formatDate(sFechaDoc, "FormatYYYY/MM/DD"));
            //oBoolExencion = this.onCheckExencion(oBoolExencion, oFactura.Sociedad, oProperty[oTaxKeyValue.Key], dDateFactura,aIIBBItems[i]);
            var sEntity = "/DocumentoSet(Lifnr='" + oFactura.Lifnr + "',IdDoc='" + oFactura.IdDoc + "')"; 
            var oProperty = { Estado:oFactura.Estado , NotaEmpresa: sRejectMotivo,
                Lifnr: oFactura.Lifnr, IdDoc: oFactura.IdDoc, NumOc: oFactura.NumOc, Cae: oFactura.Cae,
                FechaDoc: sFechaDoc, 
                CaeVenc: oCommonHelp.formatDate( oFactura.CaeVenc, "Update"),
                Moneda: oFactura.Moneda, TipoDoc: oFactura.TipoDoc,
                SubtipoDoc: oFactura.SubtipoDoc, ImpBruto: sTotal, 
                ImpNeto: sSubTotal,
                Circuito: oFactura.Circuito, TipoCambio: sTipoCambio,
                Modo: oFactura.Modo, Numero: oFactura.Numero, Sociedad: oFactura.Sociedad
            };
            for(var i in aIvaItems){
                var oTaxKeyValue = oCommonHelp.validTaxCharacter(nTaxIdx);
                var sImporte = oCommonHelp.onReturnFormatToSend(aIvaItems[i].value);
                //var sImporte = aIvaItems[i].value.replace(",", ".");
                //sImporte = Number(sImporte).toFixed(2);
                var objKey = aIvaItems[i].key;
                oProperty[oTaxKeyValue.Key] = objKey;
                oProperty[oTaxKeyValue.Val] = sImporte;
                nTaxIdx = nTaxIdx + 1;                
            }
            for(var i in aIIBBItems){
                var oTaxKeyValue = oCommonHelp.validTaxCharacter(nTaxIdx);
                var sImporte = oCommonHelp.onReturnFormatToSend(aIIBBItems[i].value);
                //var sImporte = aIIBBItems[i].value.replace(",", ".");
                //sImporte = Number(sImporte).toFixed(2);
                var objKey = aIIBBItems[i].key;
                oProperty[oTaxKeyValue.Key] = objKey;
                oProperty[oTaxKeyValue.Val] = sImporte;
                oBoolExencion = this.onCheckExencion(oBoolExencion, oFactura.Sociedad, oProperty[oTaxKeyValue.Key], dDateFactura,aIIBBItems[i]);
                nTaxIdx = nTaxIdx + 1;                
            }  
            for (var i = nTaxIdx; i <= 20; i++) {
                var oTaxKeyValue = oCommonHelp.validTaxCharacter(i);
                oProperty[oTaxKeyValue.Key] = "";
                oProperty[oTaxKeyValue.Val] = "0";
            }

            var oPropertyAFIP = {
                Lifnr: oFactura.Lifnr, Sociedad: oFactura.Sociedad, SubtipoDoc: oFactura.SubtipoDoc, 
                Numero: oFactura.Numero, FechaDoc: sFechaDoc, ImpTotal: sTotal, Modo: oFactura.Modo, 
                Cae: oFactura.Cae
            };
            var sEntityAFIP = "/ConstataCompSet";

            if(oBoolExencion.BoolContinue){
                var sMessageSend = sTextMsg; 
                if(oBoolExencion.BoolContinueExencion){
                    sMessageSend = sTextMsg;
                }else{
                    sMessageSend = oBoolExencion.MensajeExencion + "\n" + sMessageSend;
                }

                sap.m.MessageBox.show(sMessageSend, {
                    "icon": sap.m.MessageBox.Icon.WARNING,
                    "title": "Info",
                    "actions": [
                        sap.m.MessageBox.Action.YES,
                        sap.m.MessageBox.Action.NO
                    ],
                    "onClose": function (vAction) {                    
                        if (vAction === sap.m.MessageBox.Action.YES) {
                            if(boolConstatar){
                                gateway.create(sServiceAFIP, sEntityAFIP , oPropertyAFIP)
                                .then(function(oReciveAFIP) {
                                    if(oReciveAFIP.EvTipo === "E"){
                                        oCommonHelp.onCloseBusy();
                                        sap.m.MessageBox.error(oReciveAFIP.EvMensaje);
                                    }else{
                                        gateway.update(sService, sEntity , oProperty)
                                        .then(function(oRecive) {
                                            console.log(oRecive);
                                            //oCommonHelp.onCloseBusy();
                                            oContext.onPressFilter();
                                            oDialog.close();
                                            sap.m.MessageBox.success("El documento se actualizo con exito.");
                                        })
                                        .catch(function(oError){
                                            oCommonHelp.onCloseBusy();
                                            sap.m.MessageBox.error("No se pudo actualizar el documento.");
                                        })
                                    }
                                })
                                .catch(function(oError){
                                    oCommonHelp.onCloseBusy();
                                    sap.m.MessageBox.error("No se pudo actualizar el documento.");
                                });
                            }else{
                                gateway.update(sService, sEntity , oProperty)
                                .then(function(oRecive) {
                                    console.log(oRecive);
                                    //oCommonHelp.onCloseBusy();
                                    oContext.onPressFilter();
                                    oDialog.close();
                                    sap.m.MessageBox.success("El documento se actualizo con exito.");
                                })
                                .catch(function(oError){
                                    oCommonHelp.onCloseBusy();
                                    sap.m.MessageBox.error("No se pudo actualizar el documento.");
                                })
                            }
                            
                        } else  {
                            oCommonHelp.onCloseBusy(); 
                        }
                    }
                }); 
            }else{
                oCommonHelp.onCloseBusy();
                sap.m.MessageBox.error(oBoolExencion.Mensaje);
            }
        },

        onPressSaveExport: function(oFactura, oPropertyExport, oDialog){
            debugger;
            var oContext = this;
            var oCommonHelp = this.getCommon(); 
            var aCombos = oCommonHelp.getCombosFacturas();
            var aIvaItems = oFactura.IvaTable;
            var aIIBBItems = oFactura.PercepcionesTable;
            var ComboIvaItems = aCombos.KeysIva;
            var ComboIIBBItems = aCombos.KeysIIBB;
            var nTaxIdx = 1;
            
            var sTotal = oCommonHelp.onReturnFormatToSend(oFactura.ImpBruto);
            var sSubTotal = oCommonHelp.onReturnFormatToSend(oFactura.ImpNeto);
            var sTipoCambio = oCommonHelp.onReturnFormatToSend(oFactura.TipoCambio);

            var oBoolExencion = {BoolContinue: true, BoolContinueExencion: true, Mensaje: "", MensajeExencion: ""};
            if(oFactura.NumOc !== ""){            
                var oFilterOC = models.get(sModelMainFacturasView).getProperty("/comboOrdenCompra/rowTemplate").filter(nfilter=>nfilter.Ebeln === oFactura.NumOc)[0];
                if(oFilterOC.Bukrs !== oFactura.Sociedad){
                    oBoolExencion.BoolContinue = false;
                    if(oBoolExencion.Mensaje === ""){
                        oBoolExencion.Mensaje = "La Sociedad cargada no coincide con la Orden de Compra elegida.";
                    }else{
                        oBoolExencion.Mensaje = oBoolExencion.Mensaje + "\n La Sociedad cargada no coincide con la Orden de Compra elegida."; 
                    }  
                }
                if(oFilterOC.Moneda !== oFactura.Moneda){
                    oBoolExencion.BoolContinue = false;
                if(oBoolExencion.Mensaje === ""){
                    oBoolExencion.Mensaje = "La Moneda cargada no coincide con la Orden de Compra elegida.";
                }else{
                    oBoolExencion.Mensaje = oBoolExencion.Mensaje + "\n La Moneda cargada no coincide con la Orden de Compra elegida."; 
                }  
                }else{
                    if(Number(sTotal) > Number(oFilterOC.TolFact)){
                        oBoolExencion.BoolContinue = false;
                        if(oBoolExencion.Mensaje === ""){
                            oBoolExencion.Mensaje = "El importe total excede el total de la Orden de Compra elegida.";
                        }else{
                            oBoolExencion.Mensaje = oBoolExencion.Mensaje + "\n El importe total excede el total de la Orden de Compra elegida.."; 
                        }  
                    }
                }
            }
            var sFechaDoc = oCommonHelp.formatDate( oFactura.FechaDoc, "Update");
            var dDateFactura = new Date(oCommonHelp.formatDate(sFechaDoc, "FormatYYYY/MM/DD"));
            var sEntity = "/DocumentoSet(Lifnr='" + oFactura.Lifnr + "',IdDoc='" + oFactura.IdDoc + "')"; 
            var oProperty = { Estado:oFactura.Estado , NotaEmpresa: "",
                Lifnr: oFactura.Lifnr, IdDoc: oFactura.IdDoc, NumOc: oFactura.NumOc, Cae: oFactura.Cae,
                FechaDoc: sFechaDoc, 
                CaeVenc: oCommonHelp.formatDate( oFactura.CaeVenc, "Update"),
                Moneda: oFactura.Moneda, TipoDoc: oFactura.TipoDoc,
                SubtipoDoc: oFactura.SubtipoDoc, ImpBruto: sTotal, 
                ImpNeto: sSubTotal,
                Circuito: oFactura.Circuito, TipoCambio: sTipoCambio,
                Modo: oFactura.Modo, Numero: oFactura.Numero, Sociedad: oFactura.Sociedad
            };
            for(var i in aIvaItems){
                var oTaxKeyValue = oCommonHelp.validTaxCharacter(nTaxIdx);
                var sImporte = oCommonHelp.onReturnFormatToSend(aIvaItems[i].value);
                //var sImporte = aIvaItems[i].value.replace(",", ".");
                //sImporte = Number(sImporte).toFixed(2);
                var objKey = aIvaItems[i].key;
                /*
                if(aIvaItems[i].item === ""){
                    objKey = aIvaItems[i].key;
                }else{
                    objKey = ComboIvaItems.filter(nfilter=>nfilter.value === aIvaItems[i].item)[0].key;
                }
                */
                oProperty[oTaxKeyValue.Key] = objKey;
                oProperty[oTaxKeyValue.Val] = sImporte;
                nTaxIdx = nTaxIdx + 1;                
            }
            for(var i in aIIBBItems){
                var oTaxKeyValue = oCommonHelp.validTaxCharacter(nTaxIdx);
                var sImporte = oCommonHelp.onReturnFormatToSend(aIIBBItems[i].value);
                //var sImporte = aIIBBItems[i].value.replace(",", ".");
                //sImporte = Number(sImporte).toFixed(2);
                var objKey = aIIBBItems[i].key;
                /*
                if(aIIBBItems[i].item === ""){
                    objKey = aIIBBItems[i].key;
                }else{
                    objKey = ComboIvaItems.filter(nfilter=>nfilter.value === aIIBBItems[i].item)[0].key;
                }
                */
                oProperty[oTaxKeyValue.Key] = objKey;
                oProperty[oTaxKeyValue.Val] = sImporte;
                oBoolExencion = this.onCheckExencion(oBoolExencion, oFactura.Sociedad, oProperty[oTaxKeyValue.Key], dDateFactura,aIIBBItems[i]);
                nTaxIdx = nTaxIdx + 1;                
            }  
            for (var i = nTaxIdx; i <= 20; i++) {
                var oTaxKeyValue = oCommonHelp.validTaxCharacter(i);
                oProperty[oTaxKeyValue.Key] = "";
                oProperty[oTaxKeyValue.Val] = "0";
            }

            var oPropertyAFIP = {
                Lifnr: oFactura.Lifnr, Sociedad: oFactura.Sociedad, SubtipoDoc: oFactura.SubtipoDoc, 
                Numero: oFactura.Numero, FechaDoc: sFechaDoc, ImpTotal: sTotal, Modo: oFactura.Modo, 
                Cae: oFactura.Cae
            };
            var sEntityAFIP = "/ConstataCompSet";

            if(oBoolExencion.BoolContinue){ 
                var sMessageSend = "Desea exportar la factura?";
                if(oBoolExencion.BoolContinueExencion){
                    sMessageSend = "Desea exportar la factura?";
                }else{
                    sMessageSend = oBoolExencion.MensajeExencion + "\n" + sMessageSend;
                }
                
                sap.m.MessageBox.show(sMessageSend, {
                    "icon": sap.m.MessageBox.Icon.WARNING,
                    "title": "Info",
                    "actions": [
                        sap.m.MessageBox.Action.YES,
                        sap.m.MessageBox.Action.NO
                    ],
                    "onClose": function (vAction) {                    
                        if (vAction === sap.m.MessageBox.Action.YES) {
                            gateway.create(sServiceAFIP, sEntityAFIP , oPropertyAFIP)
                            .then(function(oReciveAFIP) {
                                if(oReciveAFIP.EvTipo === "E"){
                                    oCommonHelp.onCloseBusy();
                                    sap.m.MessageBox.error(oReciveAFIP.EvMensaje);
                                }else{
                                    gateway.update(sService, sEntity , oProperty)
                                    .then(function(oRecive) {
                                        console.log(oRecive);
                                        //oCommonHelp.onCloseBusy();
                                        var sEntityExport = "/DocumentoSAPSet";
                                        gateway.create(sService, sEntityExport , oPropertyExport)
                                        .then(function(oRecive) {
                                            console.log(oRecive);
                                            oCommonHelp.onCloseBusy();                    
                                            if(oRecive.EvTipo === "E"){
                                                sap.m.MessageBox.error(oRecive.EvMensaje);
                                            }else{
                                                sap.m.MessageBox.success("El documento se exporto con exito. Nro. " + oRecive.EvMensaje);
                                                oContext.onPressFilter();
                                                oDialog.close();
                                            }
                                        })
                                        .catch(function(oError){
                                            oCommonHelp.onCloseBusy();
                                            sap.m.MessageBox.error("No se pudo exportar el documento.");
                                        })
                                    })
                                    .catch(function(oError){
                                        oCommonHelp.onCloseBusy();
                                        sap.m.MessageBox.error("No se pudo actualizar el documento.");
                                    })
                                }
                            })
                            .catch(function(oError){
                                oCommonHelp.onCloseBusy();
                                sap.m.MessageBox.error("No se pudo exportar el documento.");
                            })                            
                        } else {
                            oCommonHelp.onCloseBusy(); 
                        }
                    }
                }); 
                
            }else{
                oCommonHelp.onCloseBusy();
                sap.m.MessageBox.error(oBoolExencion.Mensaje);
            }
            
            
        },


        onPressFilter: function(){
            var oCommonHelp = this.getCommon(); 
			oCommonHelp.onShowBusy(this);
			oCommonHelp.onChangeTextBusy(this.getI18nText("RecuperandoDatos"));
            var aCombos = oCommonHelp.getCombosFacturas();    
            var aComboSubtipo = models.get(sModelMainFacturasView).getProperty("/ComboSubtipo");
            var aComboSociedad = models.get(sModelMainFacturasView).getProperty("/ComboSociedad");
			var oModel = models.get(sModelMainFacturasView);
			var oDataModel = oModel.getProperty("/Filtros");			
			
			var aOrFilter = [];
			var oContext = this;
			var aAndFilter = [];
			if(oDataModel.Lifnr !== ""){
				aOrFilter.push(new sap.ui.model.Filter("Lifnr", "EQ", oDataModel.Lifnr));
			}
			if(oDataModel.selectEstado !== ""){
				aOrFilter.push(new sap.ui.model.Filter("Estado", "EQ", oDataModel.selectEstado));
			}
            if(oDataModel.Numero !== ""){
				aOrFilter.push(new sap.ui.model.Filter("Numero", "EQ", oDataModel.Numero));
			}
            if(oDataModel.selectSociedad !== ""){
				aOrFilter.push(new sap.ui.model.Filter("Sociedad", "EQ", oDataModel.selectSociedad));
			}
            if(oDataModel.selectTipoDoc !== ""){
				aOrFilter.push(new sap.ui.model.Filter("TipoDoc", "EQ", oDataModel.selectTipoDoc));
			}
            if(oDataModel.selectCircuito !== ""){
				aOrFilter.push(new sap.ui.model.Filter("Circuito", "EQ", oDataModel.selectCircuito));
			}
            if(oDataModel.NumOc !== ""){
				aOrFilter.push(new sap.ui.model.Filter("NumOc", "EQ", oDataModel.NumOc));
			}
            if(oDataModel.dateValueOne !== undefined && oDataModel.dateValueTwo !== undefined){
                var sDateDesde = oCommonHelp.formatDate(oCommonHelp.formatDate(oDataModel.dateValueOne, "GetDate"),  "Update");
                var sDateHasta = oCommonHelp.formatDate(oCommonHelp.formatDate(oDataModel.dateValueTwo, "GetDate"),  "Update");
                aOrFilter.push(new sap.ui.model.Filter("FechaCarga", "BT", sDateDesde, sDateHasta));
            }
			
			var sEntity = "/DocumentoSet"; 
			gateway.read(sService, sEntity, {"filters": aOrFilter})
			.then(function(oRecive){
				var aData = oRecive.results;
                for(var i in aData){
                    aData[i].visibleCommentReject = false;
                    if(aData[i].Estado === "3"){
                        aData[i].visibleCommentReject = true;
                    }
                    aData[i].visibleCommentProveedor = false;
                    if(aData[i].NotaProveedor === ""){
                        aData[i].visibleCommentProveedor = true;
                    }
                    aData[i].editDocument = true;
                    if(aData[i].Estado === "1"){
                        aData[i].editDocument = true;
                    }else{
                        aData[i].editDocument = false;
                    }
                    aData[i].ResultadoProc = "";
                    if(aData[i].TipoMensaje === "S"){
                        aData[i].ResultadoProc = "Exito";
                    }else if(aData[i].TipoMensaje === "E"){
                        aData[i].ResultadoProc = "Error";
                    }
                    aData[i].visibleLog = true;
                    if(aData[i].TextoMensaje === "" && aData[i].TipoMensaje === ""){
                        aData[i].visibleLog = false;
                    }
                    aData[i].FechaProcFormat = oCommonHelp.formatDate(aData[i].FechaProc, "Main");
                    aData[i].HoraProcFormat = oCommonHelp.formatDate(aData[i].HoraProc, "GetHour");
                    aData[i].FechaDoc = oCommonHelp.formatDate(aData[i].FechaDoc, "Main");
                    aData[i].CaeVenc = oCommonHelp.formatDate(aData[i].CaeVenc, "Main");
                    aData[i].FechaCarga = oCommonHelp.formatDate(aData[i].FechaCarga, "Main");
                    aData[i].ModoValue = oContext.onGetDescripcionCombo(aCombos.Modo, aData[i].Modo);
                    aData[i].TipoDocValue = oContext.onGetDescripcionCombo(aCombos.TipoFactura, aData[i].TipoDoc);
                    aData[i].CircuitoValue = oContext.onGetDescripcionCombo(aCombos.Circuito, aData[i].Circuito);
                    aData[i].StateValue = oContext.onGetDescripcionCombo(aCombos.State, aData[i].Estado);
                    console.log("SubtipoDoc");
                    console.log(aData[i].SubtipoDoc);
                    console.log(aComboSubtipo);
                    aData[i].SubtipoDocValue = aComboSubtipo.filter(nfilter=>nfilter.SubtipoDoc === aData[i].SubtipoDoc)[0].Texto;
                    
                    //aData[i].ImpBruto  = Number(aData[i].ImpBruto).toFixed(2).replace(".", ",");
                    //aData[i].ImpNeto  = Number(aData[i].ImpNeto).toFixed(2).replace(".", ",");
                    //aData[i].TipoCambio  = Number(aData[i].TipoCambio).toFixed(5).replace(".", ",");
                    //aData[i].ImpBruto = oCommonHelp.onReturnNumberDecimal(aData[i].ImpBruto, true);
                    aData[i].ImpBruto = oCommonHelp.onReturnFormatNumber(Number(aData[i].ImpBruto),2);
                    //aData[i].ImpNeto = oCommonHelp.onReturnNumberDecimal(aData[i].ImpNeto, true);
                    aData[i].ImpNeto = oCommonHelp.onReturnFormatNumber(Number(aData[i].ImpNeto),2);
                    //aData[i].TipoCambio = oCommonHelp.onReturnNumberDecimal(aData[i].TipoCambio, true);
                    if( aData[i].TipoCambio === "" ||  aData[i].TipoCambio === undefined){
                        aData[i].TipoCambio = oCommonHelp.onReturnFormatNumber(Number("1"),5);
                    }else{
                        aData[i].TipoCambio = oCommonHelp.onReturnFormatNumber(Number(aData[i].TipoCambio),5);
                    }
                    

                    if(aData[i].Sociedad === ""){
                        aData[i].SociedadValue = "";
                    }else{
                        aData[i].SociedadValue = aComboSociedad.filter(nfilter=>nfilter.Codigo === aData[i].Sociedad)[0].Texto;
                    }                   
                    
                    aData[i].IvaTable = [];
                    aData[i].PercepcionesTable = [];
                    var nPercepcion = 1;
                    var nIva = 1;
                    for(var k=1, x=20; k<=x; k++){
                        var oTaxKeyValue = oCommonHelp.validTaxCharacter(k);
                        if(aData[i][oTaxKeyValue.Key] === ""){}else{                            
                            if(aData[i][oTaxKeyValue.Key].indexOf("Perc") >= 0){
                                //var sImportePerc = oCommonHelp.onReturnNumberDecimal(aData[i][oTaxKeyValue.Val], true);
                                var sImportePerc = oCommonHelp.onReturnFormatNumber(Number(aData[i][oTaxKeyValue.Val]),2);
                                var obj={
                                    ID: nPercepcion,
                                    key: aData[i][oTaxKeyValue.Key],
                                    item: oContext.onGetDescripcionCombo(aCombos.KeysIIBB, aData[i][oTaxKeyValue.Key]),
                                    value:  sImportePerc
                                }
                                aData[i].PercepcionesTable.push(obj);
                                nPercepcion = nPercepcion + 1;
                            }else{
                                //var sImportePerc = oCommonHelp.onReturnNumberDecimal(aData[i][oTaxKeyValue.Val], true);
                                var sImportePerc = oCommonHelp.onReturnFormatNumber(Number(aData[i][oTaxKeyValue.Val]),2);
                                var obj={
                                    ID: nIva,
                                    key: aData[i][oTaxKeyValue.Key],
                                    item: oContext.onGetDescripcionCombo(aCombos.KeysIva, aData[i][oTaxKeyValue.Key]),
                                    value: sImportePerc
                                }
                                nIva = nIva + 1;
                                aData[i].IvaTable.push(obj);
                            }
                        }
                    }
                    aData[i].IvaTableMax = aData[i].IvaTable.length;
                    aData[i].PercepcionesTableMax = aData[i].PercepcionesTable.length;
                }
                models.get(sModelMainFacturasView).setProperty("/rowsFacturasView", aData);
                var nLengthView = aData.length;
                if(aData.length > 10){
                    nLengthView = 10;
                }
                models.get(sModelMainFacturasView).setProperty("/rowsFacturasViewCount",nLengthView);
                models.get(sModelMainFacturasView).refresh();
                oCommonHelp.onCloseBusy();
			})
			.catch(function(oError){
				oCommonHelp.onCloseBusy(oContext);
				var sText = oCommonHelp.getMsgError(oError, oContext);
				sap.m.MessageBox.error(sText);
			});
		},

        onGetTiposDoc: function(){
            var oCommonHelp = this.getCommon(); 
            var sEntity = "/TiposDocSet";
            //var oUserData = models.get("Model_User").getProperty("/DataUser");
            var oContext = this;
            //if models.get(sModelMainFacturasView).getProperty("/ComboSubtipo").length > 0
            var boolTest = false;
            if(boolTest){
                oCommonHelp.onCloseBusy();
            }else{
                gateway.read(sService, sEntity, {})
                .then(function(oRecive){                
                    models.get(sModelMainFacturasView).setProperty("/ComboSubtipo", oRecive.results)
                    models.get(sModelMainFacturasView).refresh();
                    var sEntity = "/SociedadesSet";
                    gateway.read(sServiceGeneral, sEntity, {})
                    .then(function(oRecive){                
                        models.get(sModelMainFacturasView).setProperty("/ComboSociedad", oRecive.results);
                        models.get(sModelMainFacturasView).setProperty("/Filtros/Sociedad", oRecive.results);
                        
                        models.get(sModelMainFacturasView).refresh();
                        oCommonHelp.onCloseBusy();
                    })
                    .catch(function(error){
                        console.log(error);
                        oCommonHelp.onCloseBusy();
                    });
                })
                .catch(function(error){
                    console.log(error);
                    oCommonHelp.onCloseBusy();
                });
            }
        },

        onGetDescripcionCombo: function(arrCombo, sKey){
            var sValue = "";
            var aNewObjetc = arrCombo.filter(nfilter=>nfilter.key === sKey);
            if(aNewObjetc.length > 0){
                sValue = aNewObjetc[0].value;
            }
            return sValue;
        },

        toBlob: function(base64str){
            var binary = atob(base64str.replace(/\s/g, ''));
            var len = binary.length;
            var buffer = new ArrayBuffer(len);
            var view = new Uint8Array(buffer);
            for (var i = 0; i < len; i++) {
                view[i] = binary.charCodeAt(i);
            }
            // create the blob object with content-type "application/pdf"               
            var blob = new Blob( [view], { type: "application/pdf" });
            var url = URL.createObjectURL(blob);
            return blob;
        },

        onDetailFactura: function(oFactura){
            var oCommonHelp = this.getCommon();
            oCommonHelp.onShowBusy();
			oCommonHelp.onChangeTextBusy(this.getI18nText("RecuperandoDatos"));
            models.get(sModelMainFacturasView).setProperty("/DetailFactura/Factura", oFactura);
            if(oFactura.editDocument){
                if(oFactura.Circuito === "1"){
                    models.get(sModelMainFacturasView).setProperty("/comboOrdenCompra/habilitado", true);  
                }else if(oFactura.Circuito === "2"){
                    models.get(sModelMainFacturasView).setProperty("/comboOrdenCompra/habilitado", false);
                }else if(oFactura.Circuito === "3"){
                    models.get(sModelMainFacturasView).setProperty("/comboOrdenCompra/habilitado", true);
                } 
            }else{
                models.get(sModelMainFacturasView).setProperty("/comboOrdenCompra/habilitado", oFactura.editDocument);
            }
            
            
            models.get(sModelMainFacturasView).refresh();
            var oContext = this;
            var sEntity = "/AdjuntoSet(Lifnr='" + oFactura.Lifnr + "',IdDoc='" + oFactura.IdDoc + "')";
            gateway.read(sService, sEntity, {})
            .then(function(oRecive){
                console.log(oRecive);
                if(oRecive.Contenido === ""){
                    models.get(sModelMainFacturasView).setProperty("/DetailFactura/PDFViewerDetail", 
                        {"isVisibile": false, "Contenido":"", "SourcePDF":""});
                }else{
                    var oBlob = oContext.toBlob(oRecive.Contenido);
                    jQuery.sap.addUrlWhitelist("blob");
                    models.get(sModelMainFacturasView).setProperty("/DetailFactura/PDFViewerDetail", 
                        {"isVisibile": true, "SourcePDF":URL.createObjectURL(oBlob),"Contenido":oRecive.Contenido});
                }
                models.get(sModelMainFacturasView).refresh();


                var sEntity = "/OCListadoSet";
                var nFilter =  new sap.ui.model.Filter("IvLifnr", "EQ", oFactura.Lifnr);
                var nFilter2 =  new sap.ui.model.Filter("IvSaldos", "EQ", true);
                gateway.read(sServiceOC, sEntity, {"filters": [nFilter, nFilter2]})
                .then(function(oRecive){
                    var aData = oRecive.results;
                    if(aData.length > 0){
                        for(var i in aData){
                            aData[i].Fecha = oCommonHelp.formatDate(aData[i].Aedat, "Main");
                            if(aData[i].IdEstado === "1"){
                                aData[i].InfoStatus = "Success";
                            }else if(aData[i].IdEstado === "2"){
                                aData[i].InfoStatus = "Information";
                            }else if(aData[i].IdEstado === "3"){
                                aData[i].InfoStatus = "Warning";
                            }else if(aData[i].IdEstado === "4"){
                                aData[i].InfoStatus = "Error";
                            }
                            aData[i].SaldoFact = oCommonHelp.onReturnFormatNumber(Number(aData[i].SaldoFact),2);
                        }
                        aData = aData.filter(nfilter=>nfilter.IdEstado !== "1");
                    }else{
                        aData = [];
                    }
                    
                    models.get(sModelMainFacturasView).setProperty("/comboOrdenCompra/rowTemplate", aData);
                    models.get(sModelMainFacturasView).refresh();
                    console.log(oRecive);
                    oContext.onDetailViewFactura();
                })
                .catch(function(oError){
                    oCommonHelp.onCloseBusy();
                })
                
            })
            .catch(function(oError){
                oCommonHelp.onCloseBusy();
                console.log(oError);
            })
        },

        onDeleteItems:function(oModel, sPath, rowProperty, countProperty){
			var oRowDelete = oModel.getProperty(sPath);
			var aData = oModel.getProperty(rowProperty);
			var indx = aData.findIndex(findind=>findind.ID === oRowDelete.ID);
			aData.splice(indx, 1);
			oModel.setProperty(rowProperty, aData);
			oModel.setProperty(countProperty, aData.length);			
			oModel.refresh();
		},

        onAddItems:function(oModel, aRows, oNewRow, rowProperty, countProperty){
			aRows.push(oNewRow);
			oModel.setProperty(rowProperty, aRows);
			oModel.setProperty(countProperty, aRows.length);
			oModel.refresh();
		},

        onDetailViewFactura: function (oFactura) {
            var oCommonHelp = this.getCommon();
            var oController = models.get(sModelMain).getProperty("/ControllerMain");
            var oContext = this;
            var oDialog,
                oDeferred = new jQuery.Deferred();
            if (!oController._ControllerDetailFactura) {
                oController._ControllerDetailFactura = {
                    "deferred": null,
                    "liveNumberDecimal": function(oEvent){
                        oCommonHelp.liveNumberDecimal(oEvent.getSource());
                    },
                    "onPressCancel": function (oEvent) {
                        oDialog.close();
                    },
                    "onSaveEdit": function(oEvent){
                        oCommonHelp.onShowBusy();
			            oCommonHelp.onChangeTextBusy(oContext.getI18nText("RecuperandoDatos"));
                        debugger;
                        var oFactura = oEvent.getSource().getModel().getProperty("/DetailFactura/Factura");
                        oContext.onPressSave(oFactura, "", oDialog);
                    }, 
                    "onCommentRej": function(oEvent){
                        var sMotivo = oEvent.getSource().getModel().getProperty("/valueCommentRej");
                        if(sMotivo === ""){
                            sap.m.MessageBox.error("El motivo de rechazo es obligatorio.");
                        }else{
                            oCommonHelp.onShowBusy();
			                oCommonHelp.onChangeTextBusy(oContext.getI18nText("GrabandoDatos"));
                            this._oPopoverRej.close();
                            var oFactura = oEvent.getSource().getModel().getProperty("/DetailFactura/Factura");
                            oContext.onPressSave(oFactura, sMotivo, oDialog);
                        }
                    },						
                    "onSaveReject": function(oEvent){
						var oModel= oEvent.getSource().getModel();
						oModel.setProperty("/valueCommentRej", "")
						if (!this._oPopoverRej) {
							this._oPopoverRej = sap.ui.xmlfragment("popoverNavCon", "simplot.portalsanalistaqas.view.fragment.CommentRej", this);
							oController.getView().addDependent(this._oPopoverRej);
						}
						var oPopoverReject = this._oPopoverRej;
						var sBtnSource = oEvent.getSource();
						oPopoverReject.openBy(sBtnSource);
						oPopoverReject.setModel(oEvent.getSource().getModel());
					},

                    "onSaveExport": function(oEvent){
                        oCommonHelp.onShowBusy();
			            oCommonHelp.onChangeTextBusy(oContext.getI18nText("GrabandoDatos"));
                        var oFactura = oEvent.getSource().getModel().getProperty("/DetailFactura/Factura");
                        var oProperty = {IvIdDoc: oFactura.IdDoc, IvLifnr: oFactura.Lifnr};                        
                        oContext.onPressSaveExport(oFactura, oProperty, oDialog);                                               
                    },

                    "onDeleteIva":function(oEvent){
                        var sPath = oEvent.getSource().getBindingContext().sPath;
                        oContext.onDeleteItems(oEvent.getSource().getModel(), sPath, "/DetailFactura/Factura/IvaTable", "/DetailFactura/Factura/IvaTableMax");
                    },
            
                    "onAddIva":function(oEvent){
                        var nCount = oEvent.getSource().getModel().getProperty("/DetailFactura/Factura/IvaTableMax");
                        var aRows = oEvent.getSource().getModel().getProperty("/DetailFactura/Factura/IvaTable");                        
                        var oNewRow = {ID: nCount + 1, item: "", value: "", key:"" };
                        oContext.onAddItems(oEvent.getSource().getModel(), aRows, oNewRow, "DetailFactura/Factura/IvaTable", "/DetailFactura/Factura/IvaTableMax");
                    },
            
                    "onDeleteIibb":function(oEvent){
                        var sPath = oEvent.getSource().getBindingContext().sPath;
                        oContext.onDeleteItems(oEvent.getSource().getModel(), sPath, "/DetailFactura/Factura/PercepcionesTable", "/DetailFactura/Factura/PercepcionesTableMax");
                    },
            
                    "onAddIibb":function(oEvent){
                        var nCount = oEvent.getSource().getModel().getProperty("/DetailFactura/Factura/PercepcionesTableMax");
                        var aRows = oEvent.getSource().getModel().getProperty("/DetailFactura/Factura/PercepcionesTable");
                        var oNewRow = {ID: nCount + 1, item: "", value: "", key:"" };
                        oContext.onAddItems(oEvent.getSource().getModel(), aRows, oNewRow, "DetailFactura/Factura/PercepcionesTable", "/DetailFactura/Factura/PercepcionesTableMax");
                    },

                    "onValueHelpOCs": function(){   
                        var oTableListOCs,
                            oDeferred = new jQuery.Deferred();
                        if (!oController._ControllerListOCs) {
                            oController._ControllerListOCs = {
                                "deferred": null,
                                "onPressCancel": function (oEvent) {
                                    oTableListOCs.close();
                                },
                                "onSelectionChange": function (oEvent) {                                    
                                    var sOrdenSelect = oEvent.getSource().getSelectedItem().getProperty("title")
                                    oEvent.getSource().getModel().setProperty("/DetailFactura/Factura/NumOc", sOrdenSelect)
                                    oEvent.getSource().getModel().refresh();
                                    oTableListOCs.close();
                                }
                            };
                        }
                        oController._ControllerListOCs.deferred = oDeferred;            
                        if (!oController._dialoListOCs) {
                            oController._dialoListOCs = sap.ui.xmlfragment("simplot.portalsanalistaqas.view.fragment.ListsOCs", oController._ControllerListOCs);
                        }
                        oTableListOCs = oController._dialoListOCs;
                        oTableListOCs.setModel(models.get(sModelMainFacturasView));
                        oController.getView().addDependent(oTableListOCs);
                        oTableListOCs.open();
                    },

                    "onRefreshComboOC": function(boolRequired, boolHabilitado){
                        //models.get(sModelMainFacturasView).setProperty("/comboOrdenCompra/required", boolRequired);
                        models.get(sModelMainFacturasView).setProperty("/comboOrdenCompra/habilitado", boolHabilitado);
                        models.get(sModelMainFacturasView).setProperty("/DetailFactura/Factura/NumOc", "");
                        models.get(sModelMainFacturasView).refresh();
                        return true; 
                    },
                    
                    "onChangeCircuito":function(oEvent){
                        var sKey = oEvent.getSource().getSelectedKey();
                        if(sKey === "1"){
                            this.onRefreshComboOC(true, true);           
                        }else if(sKey === "2"){
                            this.onRefreshComboOC(false, false);
                        }else if(sKey === "3"){
                            this.onRefreshComboOC(false, true);
                        }            
                    },

                };
            }
            oController._ControllerDetailFactura.deferred = oDeferred;
            if (!oController._dialogDetailFactura) {
                oController._dialogDetailFactura = sap.ui.xmlfragment("simplot.portalsanalistaqas.view.fragment.DetailFacturas", oController._ControllerDetailFactura);
            }
            oDialog = oController._dialogDetailFactura;
            oDialog.setModel(models.get(sModelMainFacturasView));
            oController.getView().addDependent(oDialog);
            oCommonHelp.onCloseBusy();
            oDialog.open();
        },

        onViewNotaFactura: function (sNota) {
            var oCommonHelp = this.getCommon();

            var oController = models.get(sModelMain).getProperty("/ControllerMain");
            var oContext = this;
            var oNotaProveedor,
                oDeferred = new jQuery.Deferred();
            models.get(sModelMainFacturasView).setProperty("/Nota", sNota);
            models.get(sModelMainFacturasView).refresh();
            if (!oController._ControllerViewNotaProveedor) {
                oController._ControllerViewNotaProveedor = {
                    "deferred": null,
                    "onClose": function (oEvent) {
                        oNotaProveedor.close();
                    }
                };
            }
            oController._ControllerViewNotaProveedor.deferred = oDeferred;

            if (!oController._dialogViewNotaProveedor) {
                oController._dialogViewNotaProveedor = sap.ui.xmlfragment("simplot.portalsanalistaqas.view.fragment.ViewNotaProveedor", oController._ControllerViewNotaProveedor);
            }
            oNotaProveedor = oController._dialogViewNotaProveedor;
            oNotaProveedor.setModel(models.get(sModelMainFacturasView));
            oController.getView().addDependent(oNotaProveedor);
            oNotaProveedor.open();
        }
	};
});
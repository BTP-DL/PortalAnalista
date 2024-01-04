sap.ui.define([
	"simplot/portalsanalistaqas/utils/models",
	"simplot/portalsanalistaqas/utils/gateway"
	//helpers
], function (models, gateway) {
	"use strict";
	var sService = "NOTICIAS";
    var sServiceGeneral = "GENERAL";
    var sModelMainPizarron = "Model_Pizarron";
    var sModelMain = "Model_MainEmp";
	return {

        getCommon:function(){
            var commonHelp = sap.ui.require("simplot/portalsanalistaqas/utils/Common");
            return commonHelp;
        },

        onLoadModelUserSAP: function(sUser){
            var oCommonHelp = this.getCommon();
            var oContext = this;
            oCommonHelp.onShowBusy();
            oCommonHelp.onChangeTextBusy(oCommonHelp.getI18nText("RecuperandoDatos"));
            models.load("Model_UserSAP", {
				"DataUser": {}
			});
            if(sUser === undefined){
                //sUser = 'matias.favale@hotmail.com.ar';
                //sUser = 'gdandretta@simplot.com.ar';
                sUser = 'agonzalez@dlconsultores.com.ar';
            }
            var sEntity = "/UsuarioSAPSet('" + sUser.toUpperCase() + "')";
            gateway.read(sServiceGeneral, sEntity, {/*"filters": [nFilter]*/})
            .then(function(oRecive){
                models.get("Model_UserSAP").setProperty("/DataUser", oRecive);
                models.get("Model_UserSAP").refresh();  
                //Habilita Apps
                oCommonHelp.onCheckUser();  
                oCommonHelp.onCloseBusy();       
            })
            .catch(function(oError){
                oCommonHelp.onCloseBusy(); 
                console.log(oError);
            });
        },    

        onLoadModelPizarron:function(){
            var aData = []
            if(models.exists(sModelMainPizarron)){
            }else{
                models.load(sModelMainPizarron, {
                    "rowsPizarron":[],
                    "rowsPizarronCount":0,
                    "rowsPizarronBack": [],
                    "rowsProveedoresVisto":[],
                    "rowsProveedoresVistoCount":0,
                    "valueSearch": "",
                    "dateValueOne":  undefined,
                    "dateValueTwo":  undefined
                });
            }
            models.get(sModelMainPizarron).refresh();
            this.onGetNoticias();
        },

        onGetNoticias: function(){
            var oContext = this;
            var oCommonHelp = this.getCommon();
            var sEntity = "/ListaNoticiaSet";
            gateway.read(sService, sEntity, {/*"filters": [nFilter]*/})
            .then(function(oRecive){
                var aData = oRecive.results;
                for(var i in aData){
                    aData[i].FechaInicio = oCommonHelp.formatDate(aData[i].FechaIni, "Main");
                    aData[i].FechaFinal = oCommonHelp.formatDate(aData[i].FechaFin, "Main");
                    aData[i].FechaFormatted = oCommonHelp.formatDate(aData[i].Fecha, "Main");
                    aData[i].HoraFormatted = oCommonHelp.formatDate(aData[i].Hora, "GetHour");
                    aData[i].FechaHora = aData[i].Fecha + "" + aData[i].Hora;
                    aData[i].ID = Number(aData[i].Codnot).toString();
                }
                aData = aData.sort(oCommonHelp.sortGlobal);
                models.get(sModelMainPizarron).setProperty("/rowsPizarron", aData);
                models.get(sModelMainPizarron).setProperty("/rowsPizarronBack", aData);
                models.get(sModelMainPizarron).setProperty("/rowsPizarronCount", aData.length);
                models.get(sModelMainPizarron).refresh();
                console.log(oRecive);
            })
            .catch(function(oError){
                console.log(oError);
            });
        },

        onGetObtenerVisto:function(sCode){
            var oCommonHelp = this.getCommon();
            var oContext = this;
            var sEntity = "/ObtenerVistosSet";
            var nFilter = new sap.ui.model.Filter("IvCodnot", "EQ", sCode);
            gateway.read(sService, sEntity, {"filters": [nFilter]})
            .then(function(oRecive){
                var aData = oRecive.results;
                for(var i in aData){
                    aData[i].Fecha = oCommonHelp.formatDate(aData[i].Fecha, "Main");
                    aData[i].Hora = oCommonHelp.formatDate(aData[i].Hora, "GetHour");
                }
                models.get(sModelMainPizarron).setProperty("/rowsProveedoresVisto", aData);
                models.get(sModelMainPizarron).setProperty("/rowsProveedoresVistoCount", aData.length);                
                models.get(sModelMainPizarron).refresh();
                console.log(oRecive);
            })
            .catch(function(oError){
                console.log(oError);
            });
        },

        onGetCuerpoNoticia:function(sCode){
            var oCommonHelp = this.getCommon();
            var oContext = this;
            var sEntity = "/ObtenerCuerpoSet('" + sCode + "')";
            gateway.read(sService, sEntity, {/*"filters": [nFilter]*/})
            .then(function(oRecive){
                //var aData = oRecive.results;
                models.get(sModelMainPizarron).setProperty("/ViewNoticia", oRecive);
                models.get(sModelMainPizarron).refresh();
                oCommonHelp.onCloseBusy();
                console.log(oRecive);
            })
            .catch(function(oError){
                console.log(oError);
            });
        },

        onViewNoticia:function(sCode){
            var oCommonHelp = this.getCommon();
            var oController = models.get(sModelMain).getProperty("/ControllerMain");
            var oContext = this;
			var oTableNoticia,
				oDeferred = new jQuery.Deferred();
            var objData = {EvCuerpo:""};
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
            this.onChangeTextBusy(oCommonHelp.getI18nText("RecuperandoDatos"));
            setTimeout(function() {
                oContext.onGetCuerpoNoticia(sCode);
                oContext.onGetObtenerVisto(sCode);
            }, 2000);
        },

        onAddNoticia: function () {
            var oCommonHelp = this.getCommon();
            var oController = models.get(sModelMain).getProperty("/ControllerMain");
            var oContext = this;
			var oTableNoticia,
				oDeferred = new jQuery.Deferred();
            var oUser = models.get("Model_UserSAP").getProperty("/DataUser");
            var oCargaNoticia = {
                Codnot: "0000000000", TipoBp:"P", Titulo: "", GrupoNac: false,GrupoExt:false,
                Usuario:oUser.UsuarioSap,
                FechaFormatted:this.formatDate(new Date(),"GetDate"),Hora:this.formatDate(new Date(),"GetTimer"),
                FechaIniFormatted:this.formatDate(new Date(),"GetDate"), 
                FechaFinFormatted:this.formatDate(new Date(),"GetDate"),
                IvCuerpo:""
            };
            models.get(sModelMainPizarron).setProperty("/CargaNoticia",oCargaNoticia);
            models.get(sModelMainPizarron).refresh();
            if (!oController._ControllerNoticia) {
				oController._ControllerNoticia = {
					"deferred": null,
					"onPressCancelNoticia": function (oEvent) {
						oTableNoticia.close();
					},
                    "onValidateNoticia":function(oProperty){
                        var objValid = {BoolValid:true, Mensaje:""};
                        if(oProperty.FechaIni === "" || oProperty.FechaFin === ""){
                            objValid.BoolValid = false;
                            objValid.Mensaje = "Los campo fecha son obligatorios.";
                        }
                        if(oProperty.FechaIni > oProperty.FechaFin){
                            objValid.BoolValid = false;
                            objValid.Mensaje = "La fecha Hasta debe ser mayor a la fecha Desde.";
                        }
                        if(oProperty.GrupoNac === false && oProperty.GrupoExt === false){
                            objValid.BoolValid = false;
                            objValid.Mensaje = "Debe seleccion al menos un grupo.";
                        }
                        return objValid;
                    },
					"onPressConfirmNoticia": function (oEvent) {
                        var oProperty = models.get(sModelMainPizarron).getProperty("/CargaNoticia");                        
                        oProperty.FechaIni = oCommonHelp.formatDate(oProperty.FechaIniFormatted,"Update");
                        oProperty.FechaFin = oCommonHelp.formatDate(oProperty.FechaFinFormatted,"Update");
                        oProperty.Fecha = oCommonHelp.formatDate(oProperty.FechaFormatted,"Update");
                        
                        var oValid = this.onValidateNoticia(oProperty);
                        if(oValid.BoolValid){
                            delete oProperty.FechaIniFormatted;
                            delete oProperty.FechaFinFormatted;
                            delete oProperty.FechaFormatted;
                            var sEntity = "/CrearNoticiaSet";                        
                            gateway.create(sService, sEntity , oProperty)
                            .then(function(oRecive) {
                                oContext.onGetNoticias();
                                console.log(oRecive);
                                oTableNoticia.close();
                            })
                            .catch(function(oError){
                                console.log(oError);
                            }); 
                        }else{
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

        onDeleteNoticia:function(sCode){
            var oCommonHelp = this.getCommon();
            var oContext = this;
            var sText = oCommonHelp.getI18nText("AskDeleteNew");
			sap.m.MessageBox.show(sText, {
				"icon": sap.m.MessageBox.Icon.WARNING,
				"title": oCommonHelp.getI18nText("Info"),
				"actions": [
					sap.m.MessageBox.Action.YES,
					sap.m.MessageBox.Action.NO
				],
				"onClose": function (vAction) {
					if (vAction === sap.m.MessageBox.Action.YES) {
                        oContext.onConfirmDelete(sCode);
					} else {}
				}
			});
        },
        onConfirmDelete:function(sCode){
            var oCommonHelp = this.getCommon();
            var oContext = this;
            this.onShowBusy();
            this.onChangeTextBusy(oCommonHelp.getI18nText("EliminandoDatos"));
            
            var sEntity = "/BorrarNoticiaSet('" + sCode + "')";
            gateway.read(sService, sEntity, {/*"filters": [nFilter]*/})
            .then(function(oRecive){
                if(oRecive.EvTipo === "E"){
                    sap.m.MessageBox.error(oRecive.EvMensaje);                    
                }else{
                    sap.m.MessageBox.success(oRecive.EvMensaje);
                    oContext.onGetNoticias();
                }
                
                oCommonHelp.onCloseBusy();
            })
            .catch(function(oError){
                console.log(oError);
            });
        }	
	};
});
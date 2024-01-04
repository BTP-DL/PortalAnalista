sap.ui.define([
	"simplot/portalsanalistaqas/controller/BaseController",
	"simplot/portalsanalistaqas/utils/models",
	"simplot/portalsanalistaqas/utils/gateway",
	"sap/ui/core/BusyIndicator",
    "simplot/portalsanalistaqas/utils/modelHelper",
    "simplot/portalsanalistaqas/utils/FileReaderHelp",
    "simplot/portalsanalistaqas/utils/Common"
], function (Controller,  models, gateway, BusyIndicator,  modelHelper, FileReaderHelp,  Common) {
	"use strict";
	var sService = "AUTOGESTION";
	var sModelMainPizarron = "Model_Pizarron";
	return Controller.extend("simplot.portalsanalistaqas.controller.Pizarron.Pizarron", {
		onInit: function() {
            //this._onObjectMatched(); 
		},	
		
        onAfterRendering: function(){
            console.log("HOY08092023");
            this._onObjectMatched(); 			
		},

        _onObjectMatched: function() {
            //this.onLoadModelAlta();
            this.getView().setModel(models.get(sModelMainPizarron));            
        },

        onLoadModelAlta:function(){
            //var oRow = modelHelper.getObjectJson();
            models.load(sModelMainPizarron, {
				"rowsPizarron": [],
                "rowsPizarronCount": 0
			});
        },

        onAddNoticia:function(oEvent){
            Common.onAddNoticia()
        },

        onViewNoticia:function(oEvent){
            var sCode = oEvent.getSource().getBindingContext().getObject().Codnot;
            Common.onViewNoticia(sCode);
        },
        onDeleteNoticia:function(oEvent){
            var sCode = oEvent.getSource().getBindingContext().getObject().Codnot;
            Common.onDeleteNoticia(sCode);
        },
        
        onSearch:function(){
            var objectData = {
                Query: models.get(sModelMainPizarron).getProperty("/valueSearch"),
                Model: models.get(sModelMainPizarron), 
                Prop1: "Titulo", Prop2: "ID",
                ListaData: "/rowsPizarron", ListaDataBack: "/rowsPizarronBack", 
                ListaDataCount: "/rowsPizarronCount"
            };
            Common.onSearchGlobal(objectData);
        },

        onPressFilter:function(){
            var sText = Common.getI18nText("ValidDateRange");
            var oModel = models.get(sModelMainPizarron);
            var sBegin = oModel.getProperty("/dateValueOne");
            var sEnd = oModel.getProperty("/dateValueTwo");
            if(sBegin === undefined || sEnd === undefined){
                sap.m.MessageBox.error(sText);
            }else{
                var aRowPizarron = oModel.getProperty("/rowsPizarron");
                var aNewPizarron = [];
                for(var i in aRowPizarron){
                    
                    var datePizarron = new Date(Common.formatDate(aRowPizarron[i].FechaFormatted, "FormatAAAAmmDD"));
                    if(datePizarron >= sBegin && datePizarron <= sEnd){
                        aNewPizarron.push(aRowPizarron[i])
                    }
                }
                oModel.setProperty("/rowsPizarron", aNewPizarron);
                oModel.setProperty("/rowsPizarronCount", aNewPizarron.length);
                oModel.refresh();
            }
            
        },

        onClearFilter:function(){
            
            var oModel = models.get(sModelMainPizarron);
            oModel.setProperty("/dateValueOne", undefined);
            oModel.setProperty("/dateValueTwo", undefined);
            var aRowPizarronBack = oModel.getProperty("/rowsPizarronBack");
            oModel.setProperty("/rowsPizarron", aRowPizarronBack);
            oModel.setProperty("/rowsPizarronCount", aRowPizarronBack.length);
            oModel.refresh();
        },
        
        onNavBack: function (oEvent) {
            //this.getRouter().navTo("main", {}, true);
			this.getOwnerComponent().getTargets().display("TargetMain");
		}
	});
});
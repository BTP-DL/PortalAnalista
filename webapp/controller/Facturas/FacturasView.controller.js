sap.ui.define([
	"simplot/portalsanalistaqas/controller/BaseController",
	"simplot/portalsanalistaqas/utils/models",
	"simplot/portalsanalistaqas/utils/gateway",
	"sap/ui/core/BusyIndicator",
    "simplot/portalsanalistaqas/utils/modelHelper",
    "simplot/portalsanalistaqas/utils/FileReaderHelp",
    "simplot/portalsanalistaqas/utils/Common",
    "simplot/portalsanalistaqas/utils/controller/CommonFacturasView"
], function (Controller,  models, gateway, BusyIndicator,  modelHelper, FileReaderHelp,  Common, CommonFacturasView) {
	"use strict";
	var sService = "AUTOGESTION";
	var sModelMainFacturasView = "Model_FacturasView";
	return Controller.extend("simplot.portalsanalistaqas.controller.Facturas.FacturasView", {
		onInit: function() {
            //this._onObjectMatched(); 
		},	
		
        onAfterRendering: function(){
            //this.getRouter().getRoute("altaform").attachPatternMatched(this._onObjectMatched, this);             
            this._onObjectMatched(); 			
		},

        _onObjectMatched: function() {
            this.getView().setModel(models.get(sModelMainFacturasView));            
        },

        onRejectDocument:function(oEvent){
            var oFactura = oEvent.getSource().getBindingContext().getObject();
            CommonFacturasView.onViewNotaFactura( oFactura.NotaEmpresa);
        },

        onViewNotaFactura:function(oEvent){
            var oFactura = oEvent.getSource().getBindingContext().getObject();
            CommonFacturasView.onViewNotaFactura( oFactura.NotaProveedor);
        },
        /*
        onViewNotaFactura:function(oEvent){
            var oFactura = oEvent.getSource().getBindingContext().getObject();
            CommonFacturasView.onViewNotaFactura(oFactura);
        },
        */
        onDetailFactura: function(oEvent){
            var oFactura = oEvent.getSource().getBindingContext().getObject();
            CommonFacturasView.onDetailFactura(oFactura);
        },

        onPressFilter:function(){
            CommonFacturasView.onPressFilter();
        },

        onDownloadExcel: function (oEvent) {
            var oDataSource = models.get(sModelMainFacturasView).getProperty("/rowsFacturasView");
            var aColumns = [];
            aColumns.push({
                label: "Estado",
                property: "StateValue"
            });
            aColumns.push({
                label: "Numero Proveedor",
                property: "Lifnr"
            });
            aColumns.push({
                label: "Nombre Proveedor",
                property: "Nombre"
            });
            aColumns.push({
                label: "Tipo Documento",
                property: "TipoDocValue"
            });
            aColumns.push({
                label: "Subtipo Documento",
                property: "SubtipoDocValue"
            });
            aColumns.push({
                label: "Texto",
                property: "Descripcion"
            });
            aColumns.push({
                label: "Nro. Factura",
                property: "Numero"
            });
            aColumns.push({
                label: "Fecha Documento",
                property: "FechaDoc"
            });
            aColumns.push({
                label: "Empresa",
                property: "SociedadValue"
            });
            aColumns.push({
                label: "Circuito",
                property: "CircuitoValue"
            });
            aColumns.push({
                label: "Moneda",
                property: "Moneda"
            });
            aColumns.push({
                label: "Total",
                property: "ImpBruto"
            });
            aColumns.push({
                label: "Subtotal",
                property: "ImpNeto"
            });
            aColumns.push({
                label: "Tipo de Cambio",
                property: "TipoCambio"
            });
            aColumns.push({
                label: "Empresa",
                property: "SociedadValue"
            });
            aColumns.push({
                label: "Orden de Compra",
                property: "NumOc"
            });
            aColumns.push({
                label: "Fecha de Carga",
                property: "FechaCarga"
            });
            aColumns.push({
                label: "Nota Proveedor",
                property: "NotaProveedor"
            });
            aColumns.push({
                label: "Motivo Rechazo",
                property: "NotaEmpresa"
            });
            var sNameExc = "ListaFacturas_";
            var oObjectExcel = {Application: "Simplot", Name: "Facturas", NameExcel: sNameExc,
				Source: oDataSource, Columnas: aColumns};
            Common.onDownloadExcel(oObjectExcel);
        },
        
        onNavBack: function (oEvent) {
            //this.getRouter().navTo("main", {}, true);
			this.getOwnerComponent().getTargets().display("TargetMain");
		}
	});
});
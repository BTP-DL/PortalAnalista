sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "simplot/portalsanalistaqas/controller/BaseController",
    "simplot/portalsanalistaqas/model/Claim/formatter",
    "simplot/portalsanalistaqas/utils/controller/CommonClaims",
    "simplot/portalsanalistaqas/utils/models",
    "simplot/portalsanalistaqas/utils/Common"
], function (Filter, FilterOperator, JSONModel, Controller, formatter, CommonClaims, models, Common) {
    "use strict";
    var sModelClaims = "Model_Claims";
    return Controller.extend("simplot.portalsanalistaqas.controller.Claim.Claims", {
        CommonClaims: CommonClaims,
        formatter: formatter,
        /* =========================================================== */
        /* Lifecycle events                                            */
        /* =========================================================== */
        onInit: function () {
            this._oTable = this.getView().byId("claims-table");
            // this._oTableTemplate = this._oTable.getBindingInfo("rows").template;
            // this._oTable.unbindRows();
            this._initModels();
            this.getRouter().getTarget("claims").attachDisplay(this._onClaimsMatched, this);
        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */
        onSearch: function () {
            //COMENT 20220704 this._oTable.getBinding("rows").filter(this._buildFilters(), sap.ui.model.FilterType.Application);
        },

        getFilterDataEstado: function(filters){
            return CommonClaims.getClaims(filters, true);
        },


        onPressFilter: function(){
            var nMaxLenth = 8;
            Common.onShowBusy();
            Common.onChangeTextBusy(Common.getI18nText("RecuperandoDatos"));
            //var sText = Common.getI18nText("ValidDateRange");
            var oModel = models.get(sModelClaims);
            var sBegin = oModel.getProperty("/Filtros/dateValueOne");
            var sEnd = oModel.getProperty("/Filtros/dateValueTwo");
            var aEstado = oModel.getProperty("/Filtros/selectStatuses");
            var aMotivos = oModel.getProperty("/Filtros/selectMotivos");
            var aProveedor = oModel.getProperty("/Filtros/selectProveedor");
            var sUserAnalista = oModel.getProperty("/Filtros/selectUsers");
            
            var aRowClaim = oModel.getProperty("/Claims/DataBack"); 
            var aRowClaims = Object.values(aRowClaim) ;
            var aClaims = [];
            debugger;
            var aAndFilter = [];
            if(aEstado.length > 0){
                var aOrFilter = [];
                for(var i in aEstado){
                    aOrFilter.push(new sap.ui.model.Filter("Estado", "EQ", aEstado[i]));
                }   
                aAndFilter.push(new sap.ui.model.Filter(aOrFilter, false));            
            }else{
            } 
            this.getFilterDataEstado(aAndFilter).then(function(dataClaims){
                oModel.setProperty("/Filtros/isFiltered", true);
                console.log(dataClaims);
                aRowClaims = Object.values(dataClaims);
                var selectFilter = false;
                if(sBegin === undefined || sEnd === undefined || sBegin === null || sEnd === null){
                    //sap.m.MessageBox.error(sText);
                }else{     
                    selectFilter = true;                             
                    for(var i in aRowClaims){               
                        var dateClaim = new Date(Common.formatDate(Common.formatDate(aRowClaims[i].Fecha, "Main"), "FormatAAAAmmDD"));     
                        if(dateClaim >= sBegin && dateClaim <= sEnd){
                            aClaims.push(aRowClaims[i])
                        }
                    }
                    nMaxLenth=aClaims.length
                    oModel.setProperty("/Claims/Data", aClaims);
                    oModel.refresh();
                }          
                
                if(aMotivos.length > 0){
                    selectFilter = true;
                    var aNewClaim = [];
                    for(var i in aMotivos){
                        var arrClaim;
                        if(aClaims.length > 0){
                            arrClaim = aClaims.filter(nfilter=>nfilter.Motivo === aMotivos[i]);
                        }else{
                            arrClaim  = aRowClaims.filter(nfilter=>nfilter.Motivo === aMotivos[i]);
                        }
                        for(var j in arrClaim){
                            aNewClaim.push(arrClaim[j]);
                        }                                     
                    } 
                    aClaims = aNewClaim;
                    oModel.setProperty("/Claims/Data", aClaims);
                    oModel.refresh();             
                }else{
                }
    
                if(aProveedor.length > 0){
                    selectFilter = true;
                    var aNewClaim = [];
                    for(var i in aProveedor){
                        var arrClaim;
                        if(aClaims.length > 0){
                            arrClaim = aClaims.filter(nfilter=>nfilter.BpSap === aProveedor[i]);
                        }else{
                            arrClaim  = aRowClaims.filter(nfilter=>nfilter.BpSap === aProveedor[i]);
                        }
                        for(var j in arrClaim){
                            aNewClaim.push(arrClaim[j]);
                        }                                     
                    } 
                    aClaims = aNewClaim;
                    oModel.setProperty("/Claims/Data", aClaims);
                    oModel.refresh();             
                }else{
                }
    
                if(sUserAnalista === "" || sUserAnalista === null){
                }else{
                    selectFilter = true;
                    var aNewClaim = [];
                    var arrClaim;
                    if(aClaims.length > 0){
                        arrClaim = aClaims.filter(nfilter=>nfilter.Usuario === sUserAnalista);
                    }else{
                        arrClaim  = aRowClaims.filter(nfilter=>nfilter.Usuario === sUserAnalista);
                    }
                    for(var j in arrClaim){
                        aNewClaim.push(arrClaim[j]);
                    }      
                    aClaims = aNewClaim;
                    oModel.setProperty("/Claims/Data", aClaims);
                    oModel.refresh();    
                }

                if(!selectFilter){
                    aClaims = aRowClaims;
                }
                
                var aClaimsModel = aClaims.reduce((x, data) => {
                    x[data.Nrorec] = data;
                    return x;
                }, {});
                oModel.setProperty("/Claims/Data", aClaimsModel);
                oModel.setProperty("/Claims/Count", aClaims.length);
                oModel.refresh(); 
                Common.onCloseBusy(); 
            })
            .catch(function(error){
                Common.onCloseBusy(); 
                console.log(error);
            });
        },

        onClearFilter:function(){      
            Common.onShowBusy();
            Common.onChangeTextBusy(Common.getI18nText("RecuperandoDatos"));
            var oModel = models.get(sModelClaims);
            this.onMyselfFilterChange();
            oModel.setProperty("/Filtros/dateValueOne", undefined);
            oModel.setProperty("/Filtros/dateValueTwo", undefined);
            oModel.setProperty("/Filtros/selectStatuses", []);
            oModel.setProperty("/Filtros/selectMotivos", []);
            oModel.setProperty("/Filtros/selectUsers", "");
            this.getModel("viewModel").setProperty("/myself", false);
            this.getModel("viewModel").refresh();
            var aRowClaims = oModel.getProperty("/Claims/DataBack");
            var aAndFilter = [];
            this.getFilterDataEstado(aAndFilter).then(function(dataClaims){
                Common.onCloseBusy();  
                oModel.setProperty("/Claims/Data", dataClaims);
                oModel.setProperty("/Claims/Count", Object.values(dataClaims).length);
                oModel.refresh();
            })
            .catch(function(error){
                Common.onCloseBusy();  
                console.log(error);
            })
            
        },

        onNavBack: function (oEvent) {
            this.getOwnerComponent().getTargets().display("TargetMain");
        },

        onViewClaimPress: function (oEvent) {
            this.saveSortingState();
            const oItem = oEvent.getSource();
            CommonClaims.navToClaim(this.getOwnerComponent().getTargets(), oItem.getBindingContext().getProperty("Nrorec"));
        },

        onMyselfChange: function (oEvent) {
            const selected = oEvent.getParameter("selected");
            this.getModel("filterModel").setProperty("/filter/Usuario", null);
            if (selected) {
                this.getModel("filterModel").setProperty("/filter/Usuario", CommonClaims.getBpSap());
            }
            //COMENT 20220704 this.onSearch();
        },

        onMyselfFilterChange: function (oEvent) {
            var selected = true;
            if(oEvent === undefined){
                selected = false;
            }else{
                selected = oEvent.getParameter("selected");
            }
            

            this.getModel().setProperty("/Filtros/selectUsers", null);
            if (selected) {
                this.getModel().setProperty("/Filtros/selectUsers", CommonClaims.getBpSap());
            }
            //this.onSearch();
        },

        /* =========================================================== */
        /* Private Methods                                             */
        /* =========================================================== */
        _onClaimsMatched: function () {
            this._oTable.setBusy(true);
            var aAndFilter = [],
                aOrFilter = [];
            aOrFilter.push(new sap.ui.model.Filter("Estado", "EQ", "1"));
            aOrFilter.push(new sap.ui.model.Filter("Estado", "EQ", "2"));
            aAndFilter.push(new sap.ui.model.Filter(aOrFilter, false));
            this._loadClaimsData(aAndFilter).then(() => {
                this._oTable.bindRows({
                    path: "/Claims/Data"
                    // template: this._oTableTemplate,
                    //filters: this._buildFilters()
                });
                //this._oTable.getBinding("rows").filter(this._buildFilters(), sap.ui.model.FilterType.Application);
                this.restoreSortingState();
                this.getModel("viewModel").setProperty("/tableTitle", this.getResourceBundle().getText("claim.title.count", [this.getModel().getProperty("/Claims/Count")]))
            }).finally(() => {
                this._oTable.setBusy(false);
            });
        },

        _setSortedColumn: function (oColumm, sOrder) {
            this._resetSortingState();
            oColumm.setSorted(true);
            oColumm.setSortOrder(sOrder);

        },

        _buildFilters: function () {
            const oFilters = $.extend(true, {}, this.getModel("filterModel").getObject("/filter"));
            return this._prepareFilters(oFilters);
        },

        _prepareFilters: function (oFilters) {
            return Object.keys(oFilters).filter(field => {
                return (oFilters[field] !== null && oFilters[field] !== undefined && (!Array.isArray(oFilters[field]) || oFilters[field].length));
            }).map(field => {
                let filter = null;
                if (Array.isArray(oFilters[field])) {
                    filter = new Filter(oFilters[field].map(value => new Filter(field, FilterOperator.EQ, value)), false);
                } else {
                    filter = new Filter(field, FilterOperator.Contains, oFilters[field]);
                }
                return filter;
            });
        },

        _initModels: function () {
            CommonClaims.getStatuses();
            CommonClaims.getUsers();
            // this.setModel(new JSONModel({
            //     Statuses: CommonClaims.getStatuses(),
            //     Users: null
            // }), "matchcodes");
            //CommonClaims.getUsers();
            this.setModel(CommonClaims.getModelClaims());
            this.setModel(new JSONModel({
                myself: true,
                tableTitle: this.getResourceBundle().getText("claim.title"),
                tableNoDataText: this.getResourceBundle().getText("claim.tableNoDataText"),
            }), "viewModel");
            this.setModel(new JSONModel({
                filter: {
                    Titulo: null,
                    Estado: ["1", "2"],
                    Usuario: CommonClaims.getBpSap()
                },
            }), "filterModel");
        },

        _loadClaimsData: function (filters) {
            return CommonClaims.getClaims(filters, true);
        },

        

        _resetSortingState: function () {
            var aColumns = this._oTable.getColumns();
            for (var i = 0; i < aColumns.length; i++) {
                aColumns[i].setSorted(false);
            }
        },

        restoreSortingState: function () {
            let sPath = "Nrorec",
                sSortOrder = sap.ui.table.SortOrder.Descending;

            if (this.sortingStateColumn) {
                sPath = this.sortingStateColumn.getSortProperty();
                sSortOrder = this.sortingStateColumn.getSortOrder();
                this._setSortedColumn(this.sortingStateColumn, sSortOrder)
            } else {
                this._setSortedColumn(this.byId("nrorecColumn"), sap.ui.table.SortOrder.Descending)
            }
            this._oTable.getBinding("rows").sort(new sap.ui.model.Sorter("Nrorec", sSortOrder === sap.ui.table.SortOrder.Descending));
        },

        saveSortingState: function () {
            const aColumns = this._oTable.getColumns(),
                oColumn = aColumns.find(oColumn => {
                    return oColumn.getSorted();
                });

            this.sortingStateColumn = null;
            if (oColumn) {
                this.sortingStateColumn = oColumn;
            }
        }
    });
});
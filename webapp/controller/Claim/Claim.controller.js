sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "simplot/portalsanalistaqas/controller/BaseController",
    "simplot/portalsanalistaqas/utils/controller/CommonClaims",
    "simplot/portalsanalistaqas/utils/FileReaderHelp"
], function (JSONModel, Controller, CommonClaims, FileReaderHelp) {
    "use strict";
    return Controller.extend("simplot.portalsanalistaqas.controller.Claim.Claim", {
        /* =========================================================== */
        /* Lifecycle events                                            */
        /* =========================================================== */
        onInit: function () {
            this._oTable = this.getView().byId("claims-table");
            this._initModels();
            this.getRouter().getTarget("claim").attachDisplay(this._onObjectMatched, this);
        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */
        onClaimSavePress: function () {
            this.getView().setBusy(true);
            if (this.getModel().hasPendingChanges()) {
                this.getModel().setProperty(this.getView().getBindingContext().getPath() + "/Estado", "2");
                this.getModel().setProperty(this.getView().getBindingContext().getPath() + "/AutorMod", "2");
                this.getModel().setProperty(this.getView().getBindingContext().getPath() + "/UsuarioMod", CommonClaims.getBpSap());
            }
            this._saveClaim();
        },

        onClaimBackPressNOT: function () {
            this.getModel().resetChanges(null, true);
            this.onNavBack();
        },

        onClaimBackPress: function () {
            debugger;
            var sIdAttachment = this.byId("attachmentBlock").getId() + "-Collapsed";
            var aItems = sap.ui.getCore().byId(sIdAttachment + "--UploadSet").getItems();
            for(var i in aItems){
                if(aItems[i].getProperty("visibleEdit")){
                    sap.ui.getCore().byId(sIdAttachment + "--UploadSet").removeItem(aItems[i]);
                }
            }
            this.getModel().resetChanges(null, true);
            this.onNavBack();
        },

        onClaimClosePress: function () {
            const oClaim = this.getView().getBindingContext().getObject();
            sap.m.MessageBox.confirm(this.getResourceBundle().getText("claim.closeConfirm.message", [oClaim.Nrorec]), {
                onClose: this._onClaimCloseConfirmed.bind(this)
            });
        },

        onNavBack: function () {
            this.getOwnerComponent().getTargets().display("claims");
        },

        /* =========================================================== */
        /* Private Methods                                             */
        /* =========================================================== */
        _onObjectMatched: function (oEvent) {
            const data = oEvent.getParameter("data"),
                sEntryKey = "/" + this.getModel().createKey("ReclamoSet", {
                    Nrorec: data.nrorec
                });
            this.getModel().resetChanges(null, true);
            this._bindView(sEntryKey);
        },

        _initModels: function () {
            CommonClaims.getPriorities();
            CommonClaims.getReasons();
            CommonClaims.getUsers();
            this.setModel(CommonClaims.getModelClaims(), "claimModel");

            this.getView().setModel(this.getOwnerComponent().getModel(CommonClaims.getServiceName()));
            this.setModel(new JSONModel({
                busy: false,
                myself: true
            }), "viewModel");
        },

        _onClaimCloseConfirmed: function (oAction) {
            if (oAction === sap.m.MessageBox.Action.OK) {
                this.getView().setBusy(true);
                const sPath = this.getView().getBindingContext().getPath();
                this.getModel().setProperty(sPath + "/Estado", "3");
                this.getModel().setProperty(sPath + "/AutorMod", "2");
                this.getModel().setProperty(sPath + "/UsuarioMod", CommonClaims.getBpSap());
                this._saveClaim();
            }
        },

        _uploadFilesNOT: function (aFiles) {
            const claim = this.getView().getBindingContext().getObject();
            return Promise.all(aFiles.map((file, index) => {
                return FileReaderHelp.readBinaryStringPromise(file).then(binaryString => {
                    const oEntry = this.getModel().createEntry("/AdjuntoSet", { changeSetId: `changeSet-${index}`, properties: { Nrorec: claim.Nrorec, Contenido: binaryString, Archivo: file.name, Autor: "2" } });
                    return oEntry;
                });
            })).then(() => {
                return this._submitChanges();
            });
        },

        _saveClaimNOT: function () {
            return this._submitChanges().then((response) => {
                this.getMessageDialog().addResponse(response);
                const baseId = this.byId("attachmentBlock").getId() + "-Collapsed",
                    uploadSet = sap.ui.getCore().byId(baseId + "--UploadSet");
                return this._uploadFiles(uploadSet.getIncompleteItems().map(item => item.getFileObject())).then(() => {
                    uploadSet.removeAllIncompleteItems();
                }).then(() => {
                    sap.m.MessageToast.show(this.getResourceBundle().getText("claim.message.crudSuccefully"));
                });
            }).catch((error) => {
                this.getMessageDialog().addResponse(error);
            }).finally(() => {
                this.getView().setBusy(false);
            });
        },

        _uploadFiles: function (aFiles) {
            const claim = this.getView().getBindingContext().getObject();
            return Promise.all(aFiles.map((file, index) => {
                return FileReaderHelp.readBinaryStringPromise(file).then(binaryString => {
                    const oEntry = this.getModel().createEntry("/AdjuntoSet", { changeSetId: `changeSet-${index}`, properties: { Nrorec: claim.Nrorec, Contenido: binaryString, Archivo: file.name, Autor: "1" } });
                    return oEntry;
                });
            })).then((response) => {
                debugger;
                return this._submitChanges();
            }).catch((error) => {
                debugger;
                this.getMessageDialog().addResponse(error);
            }).finally(() => {
                this.getView().setBusy(false);
            });
        },

        _saveClaim: function () {
            debugger;
            var sIdAttachment = this.byId("attachmentBlock").getId() + "-Collapsed";
            var uploadSet = sap.ui.getCore().byId(sIdAttachment + "--UploadSet");
                var aItems = uploadSet.getItems();
                var aNewItems =  aItems.filter(nfilter=>nfilter.getProperty("visibleEdit") === true); //uploadSet.getIncompleteItems()
            return this._submitChanges().then((response) => {
                this.getMessageDialog().addResponse(response);
                
                debugger;
                return this._uploadFiles(aNewItems.map(item => item.getFileObject())).then(() => {
                    
                    for(var i in aNewItems){
                        sap.ui.getCore().byId(sIdAttachment + "--UploadSet").removeItem(aNewItems[i]);
                    }
                    //uploadSet.removeAllIncompleteItems();
                }).then(() => {
                    sap.m.MessageToast.show(this.getResourceBundle().getText("claim.message.crudSuccefully"));
                });
            }).catch((error) => {
                this.getMessageDialog().addResponse(error);
            }).finally(() => {
                this.getView().setBusy(false);
            });
        },

        _submitChanges: function () {
            return new Promise(function (resolve, reject) {
                this.getModel().submitChanges({
                    success: function (data, response) {
                        resolve(response);
                    },
                    error: reject
                });
            }.bind(this));
        },

        /**
         * Binds the view to the object path.
         * @function
         * @param {string} sObjectPath path to the object to be bound
         * @private
         */
        _bindView: function (sObjectPath) {
            var oViewModel = this.getModel("viewModel"),
                oDataModel = this.getModel();

            this.getView().bindElement({
                path: sObjectPath,
                parameters: {
                    expand: "Posiciones,Adjuntos"
                },
                events: {
                    change: this._onBindingChange.bind(this),
                    dataRequested: function () {
                        oDataModel.metadataLoaded().then(function () {
                            oViewModel.setProperty("/busy", true);
                        });
                    },
                    dataReceived: function () {
                        oViewModel.setProperty("/busy", false);
                    }.bind(this)
                }
            });
        },

        _onBindingChange: function () {
            var oView = this.getView(),
                oViewModel = this.getModel("viewModel"),
                oElementBinding = oView.getElementBinding();

            // No data for the binding
            if (!oElementBinding.getBoundContext()) {
                this.getRouter().getTargets().display("objectNotFound");
                return;
            }

            const oClaim = oView.getBindingContext().getObject();
            oViewModel.setProperty("/busy", false);
        }
    })
});
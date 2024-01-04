sap.ui.define([
    "simplot/portalsanalistaqas/controller/BaseController",
    "simplot/portalsanalistaqas/utils/models",
    "simplot/portalsanalistaqas/utils/gateway",
    "simplot/portalsanalistaqas/utils/Common"
],

    function (Controller, models, gateway, Common) {
        "use strict";
        var sModelMain = "Model_MainEmp";

        return Controller.extend("simplot.portalsanalistaqas.controller.Main", {
            onInit: function () {
                console.log("V20231221");
                models.load(sModelMain, {
                    "UserEnabled": false,
                    "Targets": this.getOwnerComponent().getTargets(),
                    "ControllerMain": this,
                    "Apps": [
                        {
                            "App": "Pizarron", "canUseApp": false
                        }, 
                        {
                            "App": "Reclamos", "canUseApp": false
                        }, 
                        {
                            "App": "Solicitudes", "canUseApp": true
                        }, 
                        {
                            "App": "Facturas", "canUseApp": false
                        }
                    ],
                    "Reclamos": { "CountNew": 0, "CountInProcess": 0, "canUseApp": false }
                });
                var oUser = sap.ushell.Container.getUser();
                console.log(oUser.getEmail());
                Common.onLoadModelUserSAP(oUser.getEmail());
                this.getView().setModel(models.get(sModelMain));
            },

            onPressPizarron: function () {
                var oAppPizarron = models.get(sModelMain).getProperty("/Apps").filter(nfilter => nfilter.App === "Pizarron")[0];
                if (oAppPizarron.canUseApp) {
                    var oTargets = this.getOwnerComponent().getTargets();
                    Common.navToPizarron(oTargets);
                } else {
                    sap.m.MessageBox.error(Common.getI18nText("Permisos"));
                }
            },

            onPressSolicitudes: function () {
                var oAppSolicitudes = models.get(sModelMain).getProperty("/Apps").filter(nfilter => nfilter.App === "Solicitudes")[0];
                if (oAppSolicitudes.canUseApp) {
                    var oTargets = this.getOwnerComponent().getTargets();
                    Common.navToSolicitud(oTargets);
                } else {
                    sap.m.MessageBox.error(Common.getI18nText("Solicitudes"));
                }
            },

            onPressViewFacturas: function () {
                var oAppFacturas = models.get(sModelMain).getProperty("/Apps").filter(nfilter => nfilter.App === "Facturas")[0];
                if (oAppFacturas.canUseApp) {
                    var oTargets = models.get(sModelMain).getProperty("/Targets");
                   Common.navToViewFacturas(oTargets);
                } else {
                    sap.m.MessageBox.error(Common.getI18nText("Permisos"));
                }
            },

            onPressReclamos: function (oEvent) {
                var oApp = models.get(sModelMain).getProperty("/Apps").filter(nfilter => nfilter.App === "Reclamos")[0];
                if (oApp.canUseApp) {
                    const oSource = oEvent.getSource();
                    oSource.setBusy(true);
                    Common.navToClaims(this.getOwnerComponent().getTargets()).finally(() => {
                        oSource.setBusy(false);
                    });
                } else {
                    sap.m.MessageBox.error(Common.getI18nText("Permisos"));
                }
            },
        });
    });

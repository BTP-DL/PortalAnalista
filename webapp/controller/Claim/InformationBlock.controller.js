sap.ui.define([
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "simplot/portalsanalistaqas/controller/BaseController",
    "simplot/portalsanalistaqas/utils/controller/CommonClaims",
    "simplot/portalsanalistaqas/model/Claim/formatter"
], function (Filter, FilterOperator, Controller, CommonClaims, formatter) {
    "use strict";
    return Controller.extend("simplot.portalsanalistaqas.controller.Claim.InformationBlock", {
        formatter: formatter,
        /* =========================================================== */
        /* Lifecycle events                                            */
        /* =========================================================== */
        onInit: function () {
            //this._initRichTextEditor();
            this._oReasonCombo = this.byId("reasonCombo");
            this._oUserCombo = this.byId("userCombo");
        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */
        onAssignToMe: function () {
            const sPath = this.getView().getBindingContext().getPath(),
                oClaims = this.getView().getBindingContext().getObject(),
                oUsers = this.getModel("claimModel").getObject("/Users/FilteredData/");

            this.getModel().setProperty(sPath + "/Usuario", null);
            this._oUserCombo.setValueState(sap.ui.core.ValueState.None);
            if (oUsers.hasOwnProperty(CommonClaims.getBpSap()) && oUsers[CommonClaims.getBpSap()].Motivos.includes(oClaims.Motivo)) {
                this.getModel().setProperty(sPath + "/Usuario", CommonClaims.getBpSap());
            } else {
                this._oUserCombo.setValueState(sap.ui.core.ValueState.Error);
            }
        },
        onUserChange: function () {
            this._oUserCombo.setValueState(sap.ui.core.ValueState.None);
        },

        onReasonChange: function (oEvent) {
            const selectedItem = oEvent.getParameter("selectedItem"),
                oReason = selectedItem.getBindingContext("claimModel").getObject();

            this._oUserCombo.setValueState(sap.ui.core.ValueState.None);
            this._oUserCombo.getBinding("items").filter([new Filter("Motivo", FilterOperator.EQ, oReason.Motivo)], sap.ui.model.FilterType.Application);
        },

        onContextChange: function () {
            const oBinding = this.getView().getBindingContext();
            if (oBinding) {
                const oClaim = oBinding.getObject();
                this._oUserCombo.setValueState(sap.ui.core.ValueState.None);
                this._oUserCombo.getBinding("items").filter([new Filter("Motivo", FilterOperator.EQ, oClaim.Motivo)], sap.ui.model.FilterType.Application);
            }
        }

        /* =========================================================== */
        /* Private Methods                                             */
        /* =========================================================== */
    });
});
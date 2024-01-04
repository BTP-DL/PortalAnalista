sap.ui.define([
	"sap/ui/base/EventProvider",
	"./ResourceBundle",
	"./MessageParser"
], function (UI5Object, ResourceBundle, MessageParser) {
	"use strict";

	var instance = null,
		MessageDialog = UI5Object.extend("simplot.portalsanalistaqas.utils.MessageDialog", {
			constructor: function () {
				UI5Object.apply(this);
				this.init();
			}
		});

	MessageDialog.prototype.init = function () {
		var that = this;
		this._oMessageParser = new MessageParser();
		this._oMessageProcessor = new sap.ui.core.message.ControlMessageProcessor();
		var oMessageManager = sap.ui.getCore().getMessageManager();

		oMessageManager.registerMessageProcessor(this._oMessageProcessor);
		var oMessageTemplate = new sap.m.MessageItem({
			description: "{description}",
			type: "{type}",
			subtitle: '{description}',
			title: "{message}"
		});

		var oBackButton = new sap.m.Button({
			icon: sap.ui.core.IconPool.getIconURI("nav-back"),
			visible: false,
			press: function () {
				that._oMessageView.navigateBack();
				this.setVisible(false);
			}
		});

		this._oMessageView = new sap.m.MessageView({
			showDetailsPageHeader: false,
			itemSelect: function () {
				oBackButton.setVisible(true);
			},
			items: {
				path: "/",
				template: oMessageTemplate
			}
		});

		this._oMessageView.setModel(oMessageManager.getMessageModel());
		this._oDialog = new sap.m.Dialog({
			customHeader: new sap.m.Bar({
				contentRight: [
					new sap.m.Button({
						icon: "sap-icon://decline",
						press: function (oEvent) {
							oEvent.getSource().getParent().getParent().close();
						}
					})
				],
				contentMiddle: [
					new sap.m.Title({
						text: "Mensajes"
					})
				],
				contentLeft: [oBackButton]
			}),
			resizable: true,
			content: this._oMessageView,
			state: "Error",
			contentHeight: "300px",
			contentWidth: "500px",
			verticalScrolling: false
		}).attachAfterClose({}, function () {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			that.fireEvent("closed");
		}, this).attachBeforeClose({}, function () {
			that._oMessageView.navigateBack();
		}, this);
		this._oDialog.setModel(oMessageManager.getMessageModel());
	};

	MessageDialog.prototype.hasErrorMessage = function (response) {
		return (response && response.__batchResponses && response.__batchResponses.some(function (batchResponse) {
			return batchResponse.response && batchResponse.response.statusCode && !batchResponse.response.statusCode.startsWith("2");
		}));
	};

	MessageDialog.prototype.showMessage = function () {
		if (this._oDialog.isOpen()) {
			return;
		}
		this._oDialog.open();
	};

	MessageDialog.prototype.addBatchResponseError = function (oResponse) {
		sap.ui.getCore().getMessageManager().removeAllMessages();
		let oErrorReponses = oResponse.__batchResponses.filter(function (oBatchResponse) {
			return oBatchResponse.response && !oBatchResponse.response.statusCode.startsWith("2");
		}).map(function (oBatchResponse) {
			return this._oMessageParser.parse(oBatchResponse.response.body);
		}.bind(this)).reduce(function (aAccumulator, oBatchResponse) {
			if (oBatchResponse.error.innererror && oBatchResponse.error.innererror.errordetails.length > 0) {
				aAccumulator = aAccumulator.concat(oBatchResponse.error.innererror.errordetails);
			} else {
				aAccumulator = aAccumulator.concat(oBatchResponse.error);
			}
			return aAccumulator;
		}, []);
		oErrorReponses.forEach(function (oErrorMessage) {
			this.addMessage(oErrorMessage, sap.ui.core.MessageType.Error);
		}.bind(this));
		this.showMessage();
	};

	MessageDialog.prototype.addResponse = function (oResponse) {
		if (oResponse) {
			sap.ui.getCore().getMessageManager().removeAllMessages();
			const aMessages = this._oMessageParser.parse(oResponse);
			if (aMessages && aMessages.length) {
				aMessages.forEach(function (oMessage) {
					this.addMessage(oMessage, sap.ui.core.MessageType.Error);
				}.bind(this));
				this.showMessage();
			}
		}
	};

	MessageDialog.prototype.addFunctionError = function (oResponse) {
		sap.ui.getCore().getMessageManager().removeAllMessages();
		const oError = this._oMessageParser.parse(oResponse.responseText);
		this.addMessage(oError.error, sap.ui.core.MessageType.Error);
		this.showMessage();
	};

	MessageDialog.prototype.showSingleError = function (oResponse) {
		sap.ui.getCore().getMessageManager().removeAllMessages();
		const oError = this._oMessageParser.parse(oResponse.responseText);
		sap.m.MessageBox.error(oError.error.message);
	};

	MessageDialog.prototype.addMessage = function (oMessage, sType) {
		sap.ui.getCore().getMessageManager().addMessages(
			new sap.ui.core.message.Message({
				code: oMessage.code,
				message: oMessage.code,
				description: oMessage.message,
				type: sType, //sap.ui.core.MessageType.Error,
				processor: this._oMessageProcessor
			})
		);
	};

	return {
		getInstance: function () {
			if (!instance) {
				instance = new MessageDialog();
			}
			return instance;
		}
	};
});
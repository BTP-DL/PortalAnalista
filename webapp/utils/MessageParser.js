/*!
 * OpenUI5
 * (c) Copyright 2009-2022 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
/*eslint-disable max-len */
sap.ui.define([
    "sap/ui/model/odata/ODataUtils",
    "sap/ui/core/library",
    "sap/ui/thirdparty/URI",
    "sap/ui/core/message/MessageParser",
    "sap/ui/core/message/Message",
    "sap/base/Log"
],
    function (ODataUtils, coreLibrary, URI, MessageParser, Message, Log) {
        "use strict";

        var sClassName = "simplot.portalsanalistaqas.utils.MessageParser",
            rEnclosingSlashes = /^\/+|\/$/g,
            // shortcuts for enums
            MessageType = coreLibrary.MessageType,
            // This map is used to translate back-end response severity values to the values defined in the
            // enumeration sap.ui.core.MessageType
            mSeverity2MessageType = {
                "error": MessageType.Error,
                "info": MessageType.Information,
                "success": MessageType.Success,
                "warning": MessageType.Warning
            };

        /**
         * A plain error object as returned by the server. Either "@sap-severity"- or "severity"-property
         * must be set.
         *
         * @typedef {object} ObjectMessageParser~ServerError
         * @property {string} target - The target entity path for which the message is meant
         * @property {string} message - The error message description
         * @property {string} code - The error code (message)
         * @property {string} [@sap-severity] - The level of the error (alternatively in V2: oMessageObject.severity) can be one of "success", "info", "warning", "error"
         * @property {string} [severity] - The level of the error (alternatively in V4: oMessageObject.@sap-severity) can be one of "success", "info", "warning", "error"
         */

        /**
         * A map containing the relevant request-URL and (if available) the request and response objects
         *
         * @typedef {object} ObjectMessageParser~RequestInfo
         * @property {string} url - The URL of the request
         * @property {object} request - The request object
         * @property {object} response - The response object
         */

        /**
         * A map containing a parsed URL
         *
         * @typedef {object} ObjectMessageParser~UrlInfo
         * @property {string} url - The URL, stripped of query and hash
         * @property {Object<string,string>} parameters - A map of the query parameters
         * @property {string} hash - The hash value of the URL
         */

        /**
         *
         * @namespace
         * @name sap.ui.model.odata
         * @public
         */

        /**
         * OData implementation of the sap.ui.core.message.MessageParser class. Parses message responses
         * from the back end.
         *
         * @param {string} sServiceUrl
         *   Base URI of the service used for the calculation of message targets
         * @param {sap.ui.model.odata.ODataMetadata} oMetadata
         *   The ODataMetadata object
         * @param {boolean} bPersistTechnicalMessages
         *   Whether technical messages should always be treated as persistent, since 1.83.0
         *
         * @class
         *   OData implementation of the sap.ui.core.message.MessageParser class. Parses message responses
         *   from the back end.
         * @extends sap.ui.core.message.MessageParser
         *
         * @author SAP SE
         * @version 1.101.0
         * @public
         * @alias sap.ui.model.odata.ObjectMessageParser
         */
        var ObjectMessageParser = MessageParser.extend("simplot.portalsanalistaqas.utils.MessageParser", {
            metadata: {
                publicMethods: ["parse", "setProcessor", "getHeaderField", "setHeaderField"]
            },

            constructor: function () {
                MessageParser.apply(this);
                this._headerField = "sap-message"; // Default header field
                this._lastMessages = [];
            }
        });

        ////////////////////////////////////////// Public Methods //////////////////////////////////////////

        /**
         * Returns the name of the header field that is used to parse the server messages
         *
         * @return {string} The name of the header field
         * @public
         */
        ObjectMessageParser.prototype.getHeaderField = function () {
            return this._headerField;
        };

        /**
         * Sets the header field name that should be used for parsing the JSON messages
         *
         * @param {string} sFieldName - The name of the header field that should be used as source of the message object
         * @return {this} Instance reference for method chaining
         * @public
         */
        ObjectMessageParser.prototype.setHeaderField = function (sFieldName) {
            this._headerField = sFieldName;
            return this;
        };

        /**
         * Parses the given response for messages, calculates the delta and fires the messageChange-event
         * on the MessageProcessor if messages are found. Messages of responses to GET requests with status
         * codes 204 or 424 are ignored.
         *
         * @param {object} oResponse
         *   The response from the server containing body and headers
         * @param {object} oRequest
         *   The original request that lead to this response
         * @param {object} [mGetEntities]
         *   A map with the keys of the entities requested from the back-end mapped to true
         * @param {object} [mChangeEntities]
         *   A map with the keys of the entities changed in the back-end mapped to true
         * @param {boolean} [bMessageScopeSupported]
         *   Whether the used OData service supports the message scope
         *   {@link sap.ui.model.odata.MessageScope.BusinessObject}
         * @public
         */
        ObjectMessageParser.prototype.parse = function (oResponse, oRequest, mGetEntities, mChangeEntities,
            bMessageScopeSupported) {
            var aMessages,
                mRequestInfo,
                sStatusCode = String(oResponse.statusCode);

            mRequestInfo = {
                response: oResponse
            };

            if (oResponse.statusCode >= 200 && oResponse.statusCode < 300) {
                // Status is 2XX - parse headers
                aMessages = this._parseHeader(oResponse, mRequestInfo);
            } else if (oResponse.statusCode >= 400 && oResponse.statusCode < 600) {
                // Status us 4XX or 5XX - parse body
                try {
                    aMessages = this._parseBody(oResponse, mRequestInfo);
                    this._logErrorMessages(aMessages, oRequest, sStatusCode);
                } catch (ex) {
                    aMessages = this._createGenericError(mRequestInfo);
                    Log.error("Request failed with status code " + sStatusCode);
                }
            } else {
                // Status neither ok nor error, may happen if no network connection is available (some
                // browsers use status code 0 in that case)
                aMessages = this._createGenericError(mRequestInfo);
                Log.error("Request failed with unsupported status code " + sStatusCode);
            }

            // if (oRequest.method === "GET" && sStatusCode === "424") {
            // 	// Failed dependency: End user message already created for superordinate request
            // 	return;
            // }

            return aMessages;
        };

        ////////////////////////////////////////// onEvent Methods /////////////////////////////////////////

        ////////////////////////////////////////// Private Methods /////////////////////////////////////////

        /**
         * Creates a <code>sap.ui.core.message.Message</code> from the given JavaScript object parsed from a
         * server response. Since 1.78.0 unbound non-technical messages are supported if the message scope
         * for the request is <code>BusinessObject</code>.
         *
         * @param {ObjectMessageParser~ServerError} oMessageObject
         *   The object containing the message data
         * @param {ObjectMessageParser~RequestInfo} mRequestInfo
         *   Info object about the request and the response; both properties <code>request</code> and
         *   <code>response</code> of <code>mRequestInfo</code> are mandatory
         * @param {boolean} bIsTechnical
         *   Whether the given message object is a technical error (like 404 - not found)
         * @return {sap.ui.core.message.Message}
         *   The message for the given error
         */
        ObjectMessageParser.prototype._createMessage = function (oMessageObject, mRequestInfo,
            bIsTechnical) {
            var bPersistent = oMessageObject.target && oMessageObject.target.indexOf("/#TRANSIENT#") === 0 || oMessageObject.transient ||
                oMessageObject.transition || bIsTechnical && this._bPersistTechnicalMessages,
                sText = typeof oMessageObject.message === "object" ? oMessageObject.message.value : oMessageObject.message,
                sType = oMessageObject["@sap.severity"] || oMessageObject.severity;

            oMessageObject.transition = !!bPersistent;

            return new Message({
                code: oMessageObject.code || "",
                description: oMessageObject.description,
                descriptionUrl: oMessageObject.longtext_url || "",
                message: sText,
                persistent: !!bPersistent,
                processor: this._processor,
                technical: bIsTechnical,
                technicalDetails: {
                    headers: mRequestInfo.response.headers,
                    statusCode: mRequestInfo.response.statusCode
                },
                type: mSeverity2MessageType[sType] || sType
            });
        };

        /**
         * Parses the header with the set headerField and tries to extract the messages from it.
         *
         * @param {object} oResponse - The response object from which the headers property map will be used
         * @param {ObjectMessageParser~RequestInfo} mRequestInfo - Info object about the request URL
         * @returns {sap.ui.core.message.Message[]} An array with messages contained in the header
         */
        ObjectMessageParser.prototype._parseHeader = function (oResponse, mRequestInfo) {
            var i, sKey, sMessages, oServerMessage,
                sField = this.getHeaderField(),
                aMessages = [];

            if (!oResponse.headers) {
                // No header set, nothing to process
                return aMessages;
            }

            for (sKey in oResponse.headers) {
                if (sKey.toLowerCase() === sField.toLowerCase()) {
                    sField = sKey;
                }
            }

            if (!oResponse.headers[sField]) {
                // No header set, nothing to process
                return aMessages;
            }

            sMessages = oResponse.headers[sField];

            try {
                oServerMessage = JSON.parse(sMessages);

                aMessages.push(this._createMessage(oServerMessage, mRequestInfo));

                if (Array.isArray(oServerMessage.details)) {
                    for (i = 0; i < oServerMessage.details.length; i += 1) {
                        aMessages.push(this._createMessage(oServerMessage.details[i], mRequestInfo));
                    }
                }
            } catch (ex) {
                Log.error("The message string returned by the back-end could not be parsed: '" + ex.message + "'");

                return aMessages;
            }

            return aMessages;
        };

        /**
         * Parses the body of the request and tries to extract the messages from it.
         *
         * @param {object} oResponse - The response object from which the body property will be used
         * @param {ObjectMessageParser~RequestInfo} mRequestInfo - Info object about the request URL
         * @returns {sap.ui.core.message.Message[]} An array with messages contained in the body
         * @throws {Error} If the body cannot be parsed
         */
        ObjectMessageParser.prototype._parseBody = function (oResponse, mRequestInfo) {
            var sContentType = getContentType(oResponse);

            return (sContentType && sContentType.indexOf("xml") > -1) ? this._parseBodyXML(oResponse, mRequestInfo, sContentType) : this._parseBodyJSON(
                oResponse, mRequestInfo);
        };

        /**
         * Creates a technical generic error message and returns it in an array containing only this error
         * message. The <code>description</code> of the error message is the response body.
         *
         * @param {ObjectMessageParser~RequestInfo} mRequestInfo
         *   Info object about the request and the response
         * @returns {sap.ui.core.message.Message[]}
         *   The array with the generic error message
         */
        ObjectMessageParser.prototype._createGenericError = function (mRequestInfo) {
            return [this._createMessage({
                description: mRequestInfo.response.body,
                message: sap.ui.getCore().getLibraryResourceBundle().getText("CommunicationError"),
                severity: MessageType.Error,
                transition: true
            }, mRequestInfo, true)];
        };

        /**
         * Gets the body messages from the given outer and inner messages. If there is a message in the
         * inner messages with the same code and message as the outer message, the outer message is filtered
         * out. If the request given in "mRequestInfo" has a "Content-ID" header only messages without a
         * "ContentID" or with the same "ContentID" are returned.
         *
         * @param {object} oOuterError
         *   The outer error message as parsed by "_parseBodyJSON" or "_parseBodyXML"; outer message differs
         *   in the "message" property, in JSON it is an object like {value : "foo"} and in XML it is a
         *   string; "_createMessage" takes care of this difference
         * @param {object[]} aInnerErrors
         *   The inner error messages as parsed by "_parseBodyJSON" or "_parseBodyXML"
         * @param {ObjectMessageParser~RequestInfo} mRequestInfo
         *   Info object about the request URL
         * @returns {sap.ui.core.message.Message[]}
         *   An array with messages contained in the body
         */
        ObjectMessageParser.prototype._getBodyMessages = function (oOuterError, aInnerErrors, mRequestInfo) {
            var aMessages = [],
                oOuterMessage = this._createMessage(oOuterError, mRequestInfo, true),
                that = this;

            aInnerErrors.forEach(function (oInnerError) {
                var oMessage = that._createMessage(oInnerError, mRequestInfo, true);

                if (oOuterMessage && oOuterMessage.getCode() === oMessage.getCode() && oOuterMessage.getMessage() === oMessage.getMessage()) {
                    oOuterMessage = undefined;
                }

                if (!oInnerError.ContentID) {
                    aMessages.push(oMessage);
                }
            });

            if (oOuterMessage) {
                aMessages.unshift(oOuterMessage);
            }

            return aMessages;
        };

        /**
         * Logs the given messages as an error.
         *
         * @param {sap.ui.core.message.Message[]} aMessages Messages to be logged
         * @param {object} oRequest The request object which caused the given messages
         * @param {string} sStatusCode The status code of the error response
         */
        ObjectMessageParser.prototype._logErrorMessages = function (aMessages, oRequest, sStatusCode) {
            var sErrorDetails = aMessages.length ? JSON.stringify(aMessages.map(function (oMessage) {
                return {
                    code: oMessage.getCode(),
                    message: oMessage.getMessage(),
                    persistent: oMessage.getPersistent(),
                    targets: oMessage.getTargets(),
                    type: oMessage.getType()
                };
            })) : "Another request in the same change set failed";

            Log.error("Request failed with status code " + sStatusCode, sErrorDetails, sClassName);
        };

        /**
         * Parses the body of a JSON request and tries to extract the messages from it.
         *
         * @param {object} oResponse - The response object from which the body property will be used
         * @param {ObjectMessageParser~RequestInfo} mRequestInfo - Info object about the request URL
         * @param {string} sContentType - The content type of the response (for the XML parser)
         * @returns {sap.ui.core.message.Message[]} An array with messages contained in the body
         * @throws {Error} If the body cannot be parsed
         */
        ObjectMessageParser.prototype._parseBodyXML = function (oResponse, mRequestInfo, sContentType) {
            var oChildNode, sChildName, oError, i, m, n, oNode,
                oDoc = new DOMParser().parseFromString(oResponse.body, sContentType),
                aElements = getAllElements(oDoc, ["error", "errordetail"]),
                aErrors = [];

            if (!aElements.length) {
                return this._createGenericError(mRequestInfo);
            }
            for (i = 0; i < aElements.length; i += 1) {
                oNode = aElements[i];

                oError = {};
                // Manually set severity in case we get an error response
                oError.severity = MessageType.Error;

                for (n = 0; n < oNode.childNodes.length; n += 1) {
                    oChildNode = oNode.childNodes[n];
                    sChildName = oChildNode.nodeName;

                    if (sChildName === "errordetails" || sChildName === "details" || sChildName === "innererror" || sChildName === "#text") {
                        // Ignore known children that contain other errors
                        continue;
                    }

                    if (sChildName === "message" && oChildNode.hasChildNodes() && oChildNode.firstChild.nodeType !== window.Node.TEXT_NODE) {
                        // Special case for V2 error message - the message is in the child node "value"
                        for (m = 0; m < oChildNode.childNodes.length; m += 1) {
                            if (oChildNode.childNodes[m].nodeName === "value") {
                                oError.message = oChildNode.childNodes[m].text || oChildNode.childNodes[m].textContent;
                            }
                        }
                    } else {
                        oError[oChildNode.nodeName] = oChildNode.text || oChildNode.textContent;
                    }
                }

                aErrors.push(oError);
            }

            return this._getBodyMessages(aErrors[0], aErrors.slice(1), mRequestInfo);
        };

        /**
         * Parses the body of a JSON request and tries to extract the messages from it.
         *
         * @param {object} oResponse - The response object from which the body property will be used
         * @param {ObjectMessageParser~RequestInfo} mRequestInfo - Info object about the request URL
         * @returns {sap.ui.core.message.Message[]} An array with messages contained in the body
         * @throws {Error} If the body cannot be parsed
         */
        ObjectMessageParser.prototype._parseBodyJSON = function (oResponse, mRequestInfo) {
            var aInnerErrors, oOuterError,
                oErrorResponse = JSON.parse(oResponse.body);

            if (oErrorResponse.error) {
                // V4 response according to OData specification or V2 response according to MS specification
                // and SAP message specification
                oOuterError = oErrorResponse.error;
            } else {
                // Actual V2 response in some tested services
                oOuterError = oErrorResponse["odata.error"];
            }

            if (!oOuterError) {
                Log.error("Error message returned by server did not contain error-field");
                return this._createGenericError(mRequestInfo);
            }

            // Manually set severity in case we get an error response
            oOuterError.severity = MessageType.Error;

            // Check if more than one error has been returned from the back-end
            if (Array.isArray(oOuterError.details)) {
                // V4 errors
                aInnerErrors = oOuterError.details;
            } else if (oOuterError.innererror && Array.isArray(oOuterError.innererror.errordetails)) {
                // V2 errors
                aInnerErrors = oOuterError.innererror.errordetails;
            } else {
                // No further errors
                aInnerErrors = [];
            }

            return this._getBodyMessages(oOuterError, aInnerErrors, mRequestInfo);
        };

        /**
         * Parses the URL into an info map containing the url, the parameters and the has in its properties
         *
         * @param {string} sUrl - The URL to be stripped
         * @returns {ObjectMessageParser~UrlInfo} An info map about the parsed URL
         * @private
         */
        ObjectMessageParser.prototype._parseUrl = function (sUrl) {
            var mUrlData = {
                url: sUrl,
                parameters: {},
                hash: ""
            };

            var iPos = -1;

            iPos = sUrl.indexOf("#");
            if (iPos > -1) {
                mUrlData.hash = mUrlData.url.substr(iPos + 1);
                mUrlData.url = mUrlData.url.substr(0, iPos);
            }

            iPos = sUrl.indexOf("?");
            if (iPos > -1) {
                var sParameters = mUrlData.url.substr(iPos + 1);
                mUrlData.parameters = URI.parseQuery(sParameters);
                mUrlData.url = mUrlData.url.substr(0, iPos);
            }

            return mUrlData;
        };

        /**
         * Sets whether technical messages should always be treated as persistent.
         *
         * @param {boolean} bPersistTechnicalMessages
         *   Whether technical messages should always be treated as persistent
         * @private
         */
        ObjectMessageParser.prototype._setPersistTechnicalMessages = function (bPersistTechnicalMessages) {
            this._bPersistTechnicalMessages = bPersistTechnicalMessages;
        };

        ///////////////////////////////////////// Hidden Functions /////////////////////////////////////////

        /**
         * Returns the content-type header of the given response, it searches in a case-insentitive way for
         * the header
         *
         * @param {object} oResponse - The response object from which the body property will be used
         * @return {string|false} Either the content-type header content or false if none is found
         * @private
         */
        function getContentType(oResponse) {
            if (oResponse && oResponse.headers) {
                for (var sHeader in oResponse.headers) {
                    if (sHeader.toLowerCase() === "content-type") {
                        return oResponse.headers[sHeader].replace(/([^;]*);.*/, "$1");
                    }
                }
            }
            return false;
        }

        /**
         * Local helper element used to determine the path of a URL relative to the server
         *
         * @type {HTMLAnchorElement}
         */
        var oLinkElement = document.createElement("a");
        /**
         * Returns the URL relative to the host (i.e. the absolute path on the server) for the given URL
         *
         * @param {string} sUrl - The URL to be converted
         * @returns {string} The server-relative URL
         */
        function getRelativeServerUrl(sUrl) {
            oLinkElement.href = sUrl;
            return URI.parse(oLinkElement.href).path;
        }

        /**
         * Returns all elements in the given document (or node) that match the given elementnames
         *
         * @param {Node} oDocument - The start node from where to search for elements
         * @param {string[]} aElementNames - The names of the elements to search for
         * @returns {HTMLElement[]} The matching elements
         * @private
         */
        function getAllElements(oDocument, aElementNames) {
            var aElements = [];

            var mElementNames = {};
            for (var i = 0; i < aElementNames.length; i += 1) {
                mElementNames[aElementNames[i]] = true;
            }

            var oElement = oDocument;
            while (oElement) {
                if (mElementNames[oElement.tagName]) {
                    aElements.push(oElement);
                }

                if (oElement.hasChildNodes()) {
                    oElement = oElement.firstChild;
                } else {
                    while (!oElement.nextSibling) {
                        oElement = oElement.parentNode;

                        if (!oElement || oElement === oDocument) {
                            oElement = null;
                            break;
                        }
                    }
                    if (oElement) {
                        oElement = oElement.nextSibling;
                    }
                }
            }

            return aElements;
        }

        //////////////////////////////////////// Overridden Methods ////////////////////////////////////////

        return ObjectMessageParser;

    });
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "simplot/portalsanalistaqas/utils/models",
	"simplot/portalsanalistaqas/utils/gateway",
    "simplot/portalsanalistaqas/utils/lib/xlsx",
    "simplot/portalsanalistaqas/utils/lib/jszip",
    "simplot/portalsanalistaqas/utils/helper/ExcelTemplate",
    "sap/ui/core/BusyIndicator",
    "sap/m/MessageBox"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, models, gateway, xlsx, jszip, ExcelTemplate, BusyIndicator, MessageBox) {
        "use strict";
        var sService = "CREAR_USUARIO";
        var sModelSolicitud = "Model_Solicitud";
        var sServiceAuto = "AUTOGESTION";
        var kIdx = 0;
        var testing = false;

        return Controller.extend("simplot.portalsanalistaqas.controller.Solicitud.Solicitud", {
            onInit: function () {
                console.log("20230912");
                var oContext = this;
                models.load(sModelSolicitud, {
                    "Solicitud":[],
                    "SolicitudCount":0,
                    "visibleAcceptReject": false,
                    "Filtros":{
                        "Estado": [{"key": "1", "value": "Nuevo"},{"key": "2", "value": "Creado"},
                        {"key": "3", "value": "Rechazado"}],
                        "selectEstado" :"1",
                        "dateValueOne":null,
                        "dateValueTwo":null
                    }
                });
                oContext.getView().setModel(models.get(sModelSolicitud));
                
                var sEntity = "/ListaPaisSet";
                gateway.read(sServiceAuto, sEntity, {/*"filters": [nFilter, nFilter2]*/})
                .then(function(oRecive){
                    models.get(sModelSolicitud).setProperty("/arrPais", oRecive.results);
                    models.get(sModelSolicitud).refresh();
                    var nFilter = new sap.ui.model.Filter("Estado", "EQ", "1");
                    oContext.onFilterSolicitud([nFilter], "1");
                    BusyIndicator.hide();
                })
                .catch(function(oError){
                    models.get(sModelSolicitud).setProperty("/arrPais", []);
                    models.get(sModelSolicitud).refresh();
                    sap.m.MessageBox.error("No se pudo cargar el listado de Paises.");
                    BusyIndicator.hide();
                });
            },

            onCheckPromiseFn:function(nFilterLength){
                kIdx = kIdx + 1;
                if(kIdx<nFilterLength){ 
                    return true;
                }else{
                    return false
                }
            },

            onValidCharDate:function(nDate){
                if(nDate.toString().length === 1){
                    nDate = "0" + nDate;
                }
                return nDate;
            },

            onFormatDate: function(sDate){
                return sDate.getFullYear() + "" + this.onValidCharDate((sDate.getMonth() + 1)) + "" + this.onValidCharDate(sDate.getDate());
            },

            onPressFilter:function(){
                BusyIndicator.show();
                debugger;
                var sEstado = models.get(sModelSolicitud).getProperty("/Filtros/selectEstado");
                var nFilter = new sap.ui.model.Filter("Estado", "EQ", sEstado);
                var dDateFrom = models.get(sModelSolicitud).getProperty("/Filtros/dateValueOne");
                var dDateTo = models.get(sModelSolicitud).getProperty("/Filtros/dateValueTwo");
                if(dDateFrom !== null &&  dDateTo !== null){
                    var sDateFrom = this.onFormatDate(dDateFrom);
                    var sDateTo = this.onFormatDate(dDateTo);
                    var nFilter2 = new sap.ui.model.Filter("Fecha", "BT", sDateFrom,sDateTo);
                    this.onFilterSolicitud([nFilter,nFilter2], sEstado);
                }else{
                    this.onFilterSolicitud([nFilter], sEstado);
                }                
            },

            onFilterSolicitud:function(aFilter, sEstado){
                var sEntitySol = "/SolicitudSet";
                var oContext = this;
                gateway.read(sService, sEntitySol, {"filters": aFilter})
                .then(function(oRecive){
                    debugger;
                    
                    var aData = oRecive.results;
                    for(var i in aData){
                        aData[i].visibleAcceptReject = true;
                        if(sEstado !== "1"){
                            aData[i].visibleAcceptReject = false;
                        }
                        aData[i].FechaFormatt = oContext.onGetFechaFormat(aData[i].Fecha);
                        aData[i].HoraFormatt = oContext.onGetHoraFormat(aData[i].Hora);
                        aData[i].PaisFormatt = models.get(sModelSolicitud).getProperty("/arrPais").filter(nfilter=>nfilter.Codigo === aData[i].Pais)[0].Texto;
                        if(aData[i].Tipo === "1"){
                            aData[i].TipoFormatt = "Nuevo";
                        }else if(aData[i].Tipo === "2"){
                            aData[i].TipoFormatt = "Existente";
                        }
                    }
                    if(sEstado !== "1"){
                        models.get(sModelSolicitud).setProperty("/visibleAcceptReject", false);
                    }else{
                        models.get(sModelSolicitud).setProperty("/visibleAcceptReject", true);
                    }                    
                    models.get(sModelSolicitud).setProperty("/Solicitud", aData);
                    models.get(sModelSolicitud).setProperty("/SolicitudCount", aData.length);                    
                    models.get(sModelSolicitud).refresh();
                    BusyIndicator.hide();
                })
                .catch(function(oError){
                    BusyIndicator.hide();
                    console.log(oError);
                });
            },

            onGetFechaFormat:function(sDate){
                return sDate.substring(6,8) + "/" + sDate.substring(4,6) + "/" +  sDate.substring(0,4);
            },

            onGetHoraFormat:function(sHour){
                return sHour.substring(0,2) + ":" + sHour.substring(2,4) + ":" +  sHour.substring(4,6);
            },

            onSendSolicitud:function(objSolicitud,sEstado, dialog, userCreate){                
                var oContext  = this;                
                var sEntity = "/SolicitudSet('" + objSolicitud.NroSol + "')"
                var objectUpdate = {
                    "NroSol": objSolicitud.NroSol,
                    "Estado": sEstado,
                    "Rechazo": objSolicitud.Rechazo,
                    "BpSap":objSolicitud.BpSap
                }
                gateway.update(sService, sEntity, objectUpdate)
                .then(function(oRecive){
                    debugger;
                    var sMsg = "";
                    if(sEstado === "2"){
                        sMsg = "Se confirmo la solicitud de forma exitosa.";
                    }else{
                        sMsg = "Se rechazo la solicitud de forma exitosa.";
                    }    
                    dialog.close();
                    oContext.onPressFilter();
                    BusyIndicator.hide();
                    sap.m.MessageBox.success(sMsg);        
                })
                .catch(function(oError){
                    debugger;
                    
                    var sMsg = oError.responseText;
                    if(sMsg !== undefined){
                        sMsg = JSON.parse(oError.responseText).error.message.value
                    }else{
                        sMsg = "No se pudo generar la solicitud. Reintente."
                    }                    
                    if(userCreate !== null){
                        oContext.onDeleteUser(userCreate.id, sMsg);
                    }else{
                        BusyIndicator.hide();
                        sap.m.MessageBox.error(sMsg);
                    }
                    
                })
            },

            onDeleteUser:function(userDelete,sMsg){
                debugger;
                if(sMsg !== undefined){
                    sMsg = "20230804 /" + sMsg;
                }
                
                var sDeleteUser = "0112fec3-1c8d-471b-ab86-660018896660";                
                this.getToken().then(function (oToken) {
                    //var sEntityLocal = "/scim" + "/Users" + "/" + userDelete; 
                    var sEntity = $.appModulePath + "/cis/" + userDelete;
                    if(testing){
                        sEntity = "/scim" + "/Users" + "/" + userDelete; 
                    }
                    var settings = {
                        "url": sEntity,
                        "method": "DELETE",
                        "headers": {
                            "Content-Type": "application/scim+json",
                            "X-CSRF-Token": oToken
                        }
                    };
                    debugger;
                    $.ajax(settings)
                    .done(function (response) {
                        BusyIndicator.hide();
                        if(sMsg !== undefined){
                            sap.m.MessageBox.error(sMsg);
                        }
                    })
                    .fail(function (error){
                        BusyIndicator.hide();
                        if(sMsg !== undefined){
                            sap.m.MessageBox.error(sMsg);
                        }
                    })
                })
            },

            createUser: function (objSolicitud, fnPromise, nFilterLength, dialog, sEstado) {                
                var oContext = this;  
                if(sEstado === "3"){
                    //Rechazado desde Main Tabla
                    oContext.onSendSolicitud(objSolicitud,sEstado, dialog, null);
                }else{
                    debugger;
                    var data = JSON.stringify({
                        "meta": {
                            "created": "",
                            "lastModified": "",
                            "location": "",
                            "resourceType": "User",
                            "version": ""
                        },
                        "schemas": [
                            "urn:ietf:params:scim:schemas:core:2.0:User",
                            "urn:ietf:params:scim:schemas:extension:sap:2.0:User"
                        ],
                        "userName": "", // objSolicitud.IasNombre + " " + objSolicitud.IasApellido,
                        "password": "Inicio001",
                        "name": {
                            "familyName": objSolicitud.IasApellido,
                            "givenName": objSolicitud.IasNombre
                        },
                        "displayName": "None",
                        "userType": "customer",
                        "active": true,
                        "emails": [
                            {
                                "type": "work",
                                "value": objSolicitud.Mail,
                                "display": "",
                                "primary": true
                            }
                        ],
                        "groups": [
                            {
                                "value": "e63d17ae-3a7a-41b4-8ddd-7a3dadaab6cf",
                                "display": "Rol para Proveedore IAS",
                                "primary": false,
                                "$ref": "https://aqj0y4e7g.accounts.ondemand.com/scim/Groups/e63d17ae-3a7a-41b4-8ddd-7a3dadaab6cf"
                            }
                        ],
                        "urn:ietf:params:scim:schemas:extension:sap:2.0:User": {
                            "sendMail": false,
                            "totpEnabled": true,
                            "webAuthEnabled": true,
                            "mailVerified": true
                        }
                    })

                    this.getToken().then(function (oToken) {
                        //var sEntityLocal = "/scim" + "/Users"; 
                        var sEntity = $.appModulePath + "/cis/";
                        if(testing){
                            sEntity = "/scim" + "/Users"; 
                        }
                        var settings = {
                            "url": sEntity,
                            "method": "POST",
                            "headers": {
                                "Content-Type": "application/scim+json",
                                "X-CSRF-Token": oToken
                            },
                            "data": data
                        };
                        debugger;
                        $.ajax(settings)
                            .done(function (response) {
                                console.log(response);
                                oContext.setOnGroup(response, fnPromise, nFilterLength, dialog,objSolicitud,sEstado)
                                //resolve(true);
                            })
                            .fail(function (error) {
                                var boolFilter = true;
                                if(fnPromise === null){
                                    boolFilter = true;
                                    let smgIas = JSON.parse(error.responseText)[0];
                                    BusyIndicator.hide();
                                    if(smgIas !== undefined && smgIas.length > 0){
                                        smgIas = JSON.parse(error.responseText)[0].detail
                                    }else{
                                        smgIas = JSON.parse(error.responseText).detail
                                    }
                                    var sMsg = "No se pudo cargar el usuario en la plataforma IAS. " + smgIas;
                                    sap.m.MessageBox.error(sMsg);
                                    //BusyIndicator.hide();
                                }else{
                                    objSolicitud.Mensaje = "No se pudo cargar el usuario en la plataforma IAS";
                                    objSolicitud.MensajeState = "Error";  
                                    models.get("Model_Detail").refresh();  
                                    if(oContext.onCheckPromiseFn(nFilterLength)){
                                        boolFilter = false;
                                        fnPromise();
                                    }else{                                    
                                        boolFilter = true;
                                        kIdx=0;
                                        BusyIndicator.hide();
                                        sap.m.MessageBox.information("Se enviaron las solicitudes revise los Mensajes para confirmar.");
                                    }                       
                                }
                                if(boolFilter){
                                    oContext.onPressFilter();
                                }
                                
                                //reject(false);
                            });
                    })
                }
                
            },

            setOnGroup:function(userCreate,fnPromise,nFilterLength, dialog, objSolicitud,sEstado){
                debugger;
                var boolFilter = true;
                var oContext = this;
                var sUserDisplay = userCreate.userName;
                var sUseruiid = userCreate.id;
                var data = JSON.stringify({
                    "schemas": [
                        "urn:ietf:params:scim:api:messages:2.0:PatchOp"
                    ],
                    "Operations": [
                        {
                        "op": "add",
                        "path": "members",
                        "value": [
                            {
                            "display": sUserDisplay,
                            "value": sUseruiid
                            }
                        ]
                        }
                    ]
                });
                this.getToken().then(function (oToken) {
                    var sEntity = $.appModulePath + "/cisGroup/";
                    //var sEntityLocal = "/scim" + "/Groups/e63d17ae-3a7a-41b4-8ddd-7a3dadaab6cf";
                    if(testing){
                        sEntity = "/scim" + "/Groups/e63d17ae-3a7a-41b4-8ddd-7a3dadaab6cf";
                    }
                    var settings = {
                        "url": sEntity,
                        "method": "PATCH",
                        "headers": {
                            "Content-Type": "application/scim+json",
                            "X-CSRF-Token": oToken
                        },
                        "data": data
                    };
                    debugger;
                    $.ajax(settings)
                        .done(function (response) {
                            if(fnPromise === null){
                                //Aceptado desde Main Tabla
                                oContext.onSendSolicitud(objSolicitud,sEstado, dialog, userCreate);
                            }else{
                                var sEntity =  "/SolicitudSet";
                                gateway.create(sService, sEntity , objSolicitud)
                                .then(function(oRecive) {
                                    objSolicitud.Mensaje = "Se envio correctamente";
                                    objSolicitud.MensajeState = "Success";  
                                    models.get("Model_Detail").refresh();  
                                    if(oContext.onCheckPromiseFn(nFilterLength)){
                                        boolFilter = false;
                                        fnPromise();
                                    }else{                                    
                                        boolFilter = true;
                                        kIdx=0;
                                        BusyIndicator.hide();
                                        sap.m.MessageBox.information("Se enviaron las solicitudes revise los Mensajes para confirmar.");
                                    }
                                    if(boolFilter){
                                        oContext.onPressFilter();
                                    }
                                })
                                .catch(function(oError){    
                                    objSolicitud.Mensaje = "No se pudo cargar en SAP";
                                    objSolicitud.MensajeState = "Error";   
                                    //ToDo DeleteUser
                                    oContext.onDeleteUser(sUseruiid, undefined); 
                                    models.get("Model_Detail").refresh();                             
                                    if(oContext.onCheckPromiseFn(nFilterLength)){
                                        boolFilter = false;
                                        fnPromise();
                                    }else{        
                                        boolFilter = true;       
                                        kIdx=0;
                                        BusyIndicator.hide();
                                        sap.m.MessageBox.information("Se enviaron las solicitudes revise los Mensajes para confirmar.");
                                    }  
                                    if(boolFilter){
                                        oContext.onPressFilter();
                                    }                                  
                                }); 
                            }
                            
                        })
                        .fail(function (error) {
                            console.log(error);
                            if(fnPromise === null){
                                BusyIndicator.hide();
                                boolFilter = true;
                                dialog.close();
                            }else{
                                objSolicitud.Mensaje = "No se pudo cargar el grupo del usuario en la plataforma IAS";
                                objSolicitud.MensajeState = "Error";  
                                models.get("Model_Detail").refresh();  
                                //ToDo DeleteUser
                                oContext.onDeleteUser(sUseruiid, undefined); 
                                if(oContext.onCheckPromiseFn(nFilterLength)){
                                    boolFilter = false;
                                    fnPromise();
                                }else{
                                    boolFilter = true;
                                    kIdx=0;
                                    BusyIndicator.hide();
                                    sap.m.MessageBox.information("Se enviaron las solicitudes revise los Mensajes para confirmar.");
                                }
                            }
                            if(boolFilter){
                                oContext.onPressFilter();
                            }
                        });
                })
            },

            getToken: function () {
                return new Promise(function (resolve, reject) {
                    $.ajax({
                        type: "GET",
                        url: $.appModulePath,
                        headers: {
                            "X-CSRF-Token": "Fetch"
                        },
                        success: function (data, statusText, xhr) {
                            resolve(xhr.getResponseHeader("X-CSRF-Token"));
                        },
                        error: function (errMsg) {
                            resolve(errMsg.getResponseHeader("X-CSRF-Token"));
                        },
                        contentType: "application/json"
                    });
    
                });
            },

            onCargaMasiva: function (oEvent) {
                var oDetailDialog,
                    oDeferred = new jQuery.Deferred();
                models.load("Model_Detail", {
                    "rowsDetail":[],
                    "File": {},
                    "selectedTipo": 0
                });
                var oContext = this;
                if (!this._ControllerDetail) {
                    this._ControllerDetail = {
                        "deferred": null,
                        "onPressCancel": function () {
                            sap.ui.getCore().byId("myFileUpload").clear();
                            oDetailDialog.close();
                        },
                        "onImport": function(oEvent){
                            var oEvt = oEvent;
                            oEvt.getSource().getModel().setProperty("/File", oEvt.getParameter("files") && oEvt.getParameter("files")[0]);
                            oEvt.getSource().getModel().refresh();
                            this._import(oEvt)
                        },
                        "validChar": function(sTime){
                            if(sTime.toString().length === 1){
                                sTime = "0" + sTime;
                            }
                            return sTime
                        },
                        "_import": function (oEvt) {
                            var file = oEvt.getSource().getModel().getProperty("/File");
                            var that = this;
                            var aExcelData = {};
                            if (file && window.FileReader) {
                                var reader = new FileReader();
                                reader.onload = function (e) {
                                    var data = e.target.result;
                                    var workbook = XLSX.read(data, {
                                        type: 'binary'
                                    });
                                    workbook.SheetNames.forEach(function (sheetName) {
                                        // Here is your object for every sheet in workbook
                                        if(sheetName.toUpperCase() === "HOJA1"){
                                            aExcelData = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
                                        }
                                    });
                                    // Setting the data to the local model
                                    var aSendData = [];
                                    var arrPais = models.get(sModelSolicitud).getProperty("/arrPais");
                                    //Nombre	Apellido	Mail	Nif	Tipo	Pais	Comentario
                                    for(var i in aExcelData){
                                        var sTipo = "1";
                                        var sPais = "AR";
                                        if(aExcelData[i]["Tipo"] === "Proveedor Existente"){
                                            sTipo = "2";
                                        }
                                        var aFilterPais = arrPais.filter(nfilter=>nfilter.Texto.toUpperCase() === aExcelData[i]["Pais"].toUpperCase());
                                        if(aFilterPais.length > 0){
                                            sPais = aFilterPais[0].Codigo
                                        }
                                        var oProperty = {
                                            "BpSap":aExcelData[i]["BP Sap"],
                                            "NroSol":"",
                                            "Estado": "2",
                                            "IasNombre": aExcelData[i]["Nombre"],
                                            "IasApellido": aExcelData[i]["Apellido"],
                                            "Tipo": sTipo,
                                            "Mail":aExcelData[i]["Mail"],
                                            "Nombre":aExcelData[i]["Razon Social"],
                                            "Nif":aExcelData[i]["Nif"],
                                            "Pais":  aExcelData[i]["Pais"],
                                            "Comentario": aExcelData[i]["Comentario"]
                                        }
                                        aSendData.push(oProperty);
                                    }
                                    models.get("Model_Detail").setProperty("/rowsDetail", aSendData);
                                    models.get("Model_Detail").setProperty("/rowsDetailBack", aSendData);
                                    models.get("Model_Detail").setProperty("/maxrowsDetail", aSendData.length);
                                    models.get("Model_Detail").refresh();
                                };
                                reader.onerror = function (ex) {
                                    console.log(ex);
                                };
                                reader.readAsBinaryString(file);
                            }
                        },
                        "b64toBlob": function(b64Data, contentType ){
                            var oContextThat = this;
                            var sliceSize=512;
                            var byteCharacters = b64Data; //atob(b64Data);
                            var byteArrays = [];
                            for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
                                var slice = byteCharacters.slice(offset, offset + sliceSize);
                                var byteNumbers = new Array(slice.length);
                                for (var i = 0; i < slice.length; i++) {
                                    byteNumbers[i] = slice.charCodeAt(i);
                                }
                                var byteArray = new Uint8Array(byteNumbers);
                                byteArrays.push(byteArray);
                            }
                            var blob = new Blob(byteArrays, {type: contentType});
                            return blob;
                        },
                        "onDownloadTemplate": function(oEvent){
                            var oBlob;
                            var sFile = ExcelTemplate.onGetFile();
                            if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                                var byteCharacters = atob(atob(sFile.replace(/\n/gi, "")));
                                var byteNumbers = new Array(byteCharacters.length);
                                for (var i = 0; i < byteCharacters.length; i++) {
                                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                                }
                                var byteArray = new Uint8Array(byteNumbers);
                                oBlob = new Blob([byteArray], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
                            }else{
                                oBlob = this.b64toBlob(atob(sFile.replace(/\n/gi, "")), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                            }
                            var sName = "TemplateCargaSolicitudes.csv";
                            if (window.navigator && window.navigator.msSaveOrOpenBlob) { 
                                window.navigator.msSaveOrOpenBlob(oBlob, sName);
                            }
                            else {
                                var elem = window.document.createElement('a');
                                elem.href = window.URL.createObjectURL(oBlob);
                                elem.download = sName;        
                                document.body.appendChild(elem);
                                elem.click();        
                                document.body.removeChild(elem);
                            }
                        },                        
                        "onPressSaveMasiva": function (oEvent) {
                            
                            sap.ui.getCore().byId("myFileUpload").clear();
                            var aExcelProperty = oEvent.getSource().getModel().getProperty("/rowsDetail");
                            var oObjectExps = {"Error": [], "Success":[]};
                            
                            var nMax = 0;
                            var nFilterLength = aExcelProperty.length;
                            
                            var fnPromise = function(){
                                debugger;
                                BusyIndicator.show();
                                var aOrFilter = [];
                                nMax = nMax + 1;
                                var sEntity =  "/SolicitudSet";

                                oContext.createUser(aExcelProperty[kIdx],fnPromise,nFilterLength,null);
                            };
                            fnPromise();
                        }
                    };
                }
                this._ControllerDetail.deferred = oDeferred;
    
                if (!this._DialogDetail) {
                    this._DialogDetail = sap.ui.xmlfragment("simplot.portalsanalistaqas.view.fragment.UploadSolicitudes", this._ControllerDetail);
                    if (this.getView()) this.getView().addAssociation(this._DialogDetail);
                    //this._DialogSelectValue.setModel(models.get(sModelSelectedValue));
                }
                oDetailDialog = this._DialogDetail;
                oDetailDialog.setModel(models.get("Model_Detail"));
                this.getView().addDependent(oDetailDialog);
                BusyIndicator.hide();
                oDetailDialog.open();
            },


            onPressDetail:function(oEvent){
                debugger;
                BusyIndicator.show();
                var objectResumen = oEvent.getSource().getBindingContext().getObject();
                var oResumenDialog,
                    oDeferred = new jQuery.Deferred();
                models.load("Model_Resumen", {
                    Resumen: objectResumen
                });
                var oContext = this;
                if (!this._ControllerResumen) {
                    this._ControllerResumen = {
                        "onPressCancel": function () {
                            oResumenDialog.close();
                        },
                        "onAcceptSol":function(oEvt){
                            BusyIndicator.show();
                            debugger;
                            var objSolicitud = oEvt.getSource().getModel().getProperty("/Resumen");
                            oContext.createUser(objSolicitud, null,null, oResumenDialog,"2");
                        },
                        "onRejectSol":function(oEvt){
                            BusyIndicator.show();
                            debugger;
                            var objSolicitud = oEvt.getSource().getModel().getProperty("/Resumen");
                            oContext.createUser(objSolicitud, null,null, oResumenDialog,"3");
                        }
                    }
                }                    

                this._ControllerResumen.deferred = oDeferred;
    
                if (!this._DialogResumen) {
                    this._DialogResumen = sap.ui.xmlfragment("simplot.portalsanalistaqas.view.fragment.DetailSolicitud", this._ControllerResumen);
                    if (this.getView()) this.getView().addAssociation(this._DialogResumen);
                }
                oResumenDialog = this._DialogResumen;
                oResumenDialog.setModel(models.get("Model_Resumen"));
                this.getView().addDependent(oResumenDialog);
                BusyIndicator.hide();
                oResumenDialog.open();
            },

            onNavBack: function (oEvent) {
                //this.getRouter().navTo("main", {}, true);
                this.getOwnerComponent().getTargets().display("TargetMain");
            }

            
        });
    });

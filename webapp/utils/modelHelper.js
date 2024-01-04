sap.ui.define([
    "simplot/portalsanalistaqas/utils/models",
    "simplot/portalsanalistaqas/utils/Common"
    //helpers
], function (models, Common) {
    "use strict";
    var sModelMain = "Model_Main";
    var sModelAlta = "Model_MainAltaForm";

    return {

        getCommon: function () {
            var commonHelp = sap.ui.require("simplot/portalsanalistaqas/utils/Common");
            return commonHelp;
        },

        getState: function (sEstado) {
            //ToDo 
            var objEstado = { Descripcion: "", State: "" };
            if (sEstado === "0") {
                objEstado.State = "Warning";
                objEstado.Descripcion = "Pendiente";
            } else if (sEstado === "1") {
                objEstado.State = "Warning";
                objEstado.Descripcion = "Enviado";
            } else if (sEstado === "2") {
                objEstado.State = "Success";
                objEstado.Descripcion = "En Proceso";
            } else if (sEstado === "3") {
                objEstado.State = "Success";
                objEstado.Descripcion = "Completo";
            }
            return objEstado;
        },

        isValid: function (sEstado) {
            var oValid = { boolHabilitado: true, boolBtnModifica: true, boolBtnSave: true, boolBtnSend: true, boolBtnCancel: false };
            var boolHabilitado = true;
            if (sEstado === "0") {
                oValid.boolHabilitado = true;
                oValid.boolBtnSave = true;
                oValid.boolBtnSend = true;
                oValid.boolBtnModifica = false;
                oValid.boolBtnCancel = false;
            } else if (sEstado === "1") {
                oValid.boolHabilitado = false;
                oValid.boolBtnSave = false;
                oValid.boolBtnSend = false;
                oValid.boolBtnModifica = false;
                oValid.boolBtnCancel = false;
            } else if (sEstado === "2") {
                oValid.boolHabilitado = false;
                oValid.boolBtnSave = false;
                oValid.boolBtnSend = false;
                oValid.boolBtnModifica = false;
                oValid.boolBtnCancel = false;
            } else if (sEstado === "3") {
                oValid.boolHabilitado = false;
                oValid.boolBtnSave = false;
                oValid.boolBtnSend = false;
                oValid.boolBtnModifica = true;
                oValid.boolBtnCancel = false;
            }
            return oValid;
        },

        onEnableFields: function (boolProp) {
            var objBasico = models.get(sModelAlta).getProperty("/MaestroProveedores/DatosBasicos");
            var objDireccion = models.get(sModelAlta).getProperty("/MaestroProveedores/Direccion");
            var objBanco = models.get(sModelAlta).getProperty("/MaestroProveedores/DatosBanco");
            var objImpuesto = models.get(sModelAlta).getProperty("/MaestroProveedores/Impuesto");
            /*
            var objBasico= {Nombre: "", Telefono: "", Mail: "", CUIT: "", CatFiscal: "", InicioAct: ""};
            var objDireccion= {Calle:"", Ciudad: "", CP: "", Pais: "", Idioma: "", Provincia: "", Nrocalle: ""};
            var objBanco = {Banco: "", CBU: "", CtaBancaria: "", PaisBanco: ""};
            */
            for (var propBasico in objBasico) {
                var sPathIni = "/MaestroProveedores/DatosBasicos/" + propBasico + "/Validar/Habilitado";
                var boolBasico = boolProp;
                if (boolProp) {
                    boolBasico = objBasico[propBasico].Validar.IsModify;
                } else {
                    boolBasico = false;
                }
                models.get(sModelAlta).setProperty(sPathIni, boolBasico);
            }
            for (var propDireccion in objDireccion) {
                var sPathIni = "/MaestroProveedores/Direccion/" + propDireccion + "/Validar/Habilitado";
                var boolDire = boolProp;
                if (boolProp) {
                    boolDire = objDireccion[propDireccion].Validar.IsModify;
                } else {
                    boolDire = false;
                }
                models.get(sModelAlta).setProperty(sPathIni, boolDire);
            }
            for (var propBanco in objBanco) {
                var sPathIni = "/MaestroProveedores/DatosBanco/" + propBanco + "/Validar/Habilitado";
                var boolBanco = boolProp;
                if (boolProp) {
                    boolBanco = objBanco[propBanco].Validar.IsModify;
                } else {
                    boolBanco = false;
                }
                models.get(sModelAlta).setProperty(sPathIni, boolBanco);
            }
            for (var propImpuesto in objImpuesto) {
                var sPathIni = "/MaestroProveedores/Impuesto/" + propImpuesto + "/Validar/Habilitado";
                var boolBanco = boolProp;
                if (boolProp) {
                    boolBanco = objImpuesto[propImpuesto].Validar.IsModify;
                } else {
                    boolBanco = false;
                }
                models.get(sModelAlta).setProperty(sPathIni, boolBanco);
            }
            models.get(sModelAlta).setProperty("/HabilitaPcia", boolProp);
            models.get(sModelAlta).setProperty("/MaestroProveedores/Habilitado/boolBtnCancel", boolProp);
            models.get(sModelAlta).refresh();
            models.get(sModelAlta).refresh();
        },


        onLoadDataAltaForm: function (objData, objDataConf, objDataMod) {
            var oCommonHelp = this.getCommon();
            //Requerido  Habilitado IsModify
            var objBasico = {
                Nombre: { Texto: objData.Nombre, Validar: oCommonHelp.isRequerido(objDataConf.Nombre, objData.Estado, objDataMod.Nombre) },
                Telefono: { Texto: objData.Telefono, Validar: oCommonHelp.isRequerido(objDataConf.Telefono, objData.Estado, objDataMod.Telefono) },
                Mail: { Texto: objData.Mail, Validar: oCommonHelp.isRequerido(objDataConf.Mail, objData.Estado, objDataMod.Mail) },
                CUIT: { Texto: objData.Nif, Validar: oCommonHelp.isRequerido(objDataConf.Nif, objData.Estado, objDataMod.Nif) },
                //CatFiscal: {Texto:objData.Catfiscal,Validar:oCommonHelp.isRequerido(objDataConf.Catfiscal, objData.Estado, objDataMod.Catfiscal)},
                InicioAct: {
                    Texto: oCommonHelp.formatDate(objData.Fechainiact, "Main"),
                    Validar: oCommonHelp.isRequerido(objDataConf.Fechainiact, objData.Estado, objDataMod.Fechainiact)
                }
            };
            var objDireccion = {
                Calle: { Texto: objData.Calle, Validar: oCommonHelp.isRequerido(objDataConf.Calle, objData.Estado, objDataMod.Calle) },
                Ciudad: { Texto: objData.Ciudad, Validar: oCommonHelp.isRequerido(objDataConf.Ciudad, objData.Estado, objDataMod.Ciudad) },
                CP: { Texto: objData.Cp, Validar: oCommonHelp.isRequerido(objDataConf.Cp, objData.Estado, objDataMod.Cp) },
                Pais: { Texto: objData.Pais, Validar: oCommonHelp.isRequerido(objDataConf.Pais, objData.Estado, objDataMod.Pais) },
                Idioma: { Texto: objData.Idioma, Validar: oCommonHelp.isRequerido(objDataConf.Idioma, objData.Estado, objDataMod.Idioma) },
                Provincia: { Texto: objData.Provincia, Validar: oCommonHelp.isRequerido(objDataConf.Provincia, objData.Estado, objDataMod.Provincia) },
                Nrocalle: { Texto: objData.Nrocalle, Validar: oCommonHelp.isRequerido(objDataConf.Nrocalle, objData.Estado, objDataMod.Nrocalle) }
            };
            var objBanco = {
                Banco: { Texto: objData.Banco, Validar: oCommonHelp.isRequerido(objDataConf.Banco, objData.Estado, objDataMod.Banco) },
                CBU: { Texto: objData.Cbu, Validar: oCommonHelp.isRequerido(objDataConf.Cbu, objData.Estado, objDataMod.Cbu) },
                CtaBancaria: { Texto: objData.Ctabancaria, Validar: oCommonHelp.isRequerido(objDataConf.Ctabancaria, objData.Estado, objDataMod.Ctabancaria) }
                //PaisBanco: {Texto:objData.Paisbanco, Validar:oCommonHelp.isRequerido(objDataConf.Paisbanco, objData.Estado, objDataMod.Paisbanco)}
            };
            var objImpuesto = {
                Iga: { Texto: objData.Iga, Validar: oCommonHelp.isRequerido(objDataConf.Iga, objData.Estado, objDataMod.Iga) },
                Iva: { Texto: objData.Iva, Validar: oCommonHelp.isRequerido(objDataConf.Iva, objData.Estado, objDataMod.Iva) },
                Iibb: { Texto: objData.Iibb, Validar: oCommonHelp.isRequerido(objDataConf.Iibb, objData.Estado, objDataMod.Iibb) }
            };

            var objEstado = {
                Id: objData.Estado,
                Descripcion: this.getState(objData.Estado).Descripcion,
                State: this.getState(objData.Estado).State
            };
            var oValid = this.isValid(objData.Estado);
            if (objDireccion.Pais.Texto === "") {
            } else {
                oCommonHelp.onGetPcia(objDireccion.Pais.Texto, "X");
            }
            models.get(sModelAlta).setProperty("/MaestroProveedores/Habilitado", oValid);
            models.get(sModelAlta).setProperty("/MaestroProveedores/DatosBasicos", objBasico);
            models.get(sModelAlta).setProperty("/MaestroProveedores/Direccion", objDireccion);
            models.get(sModelAlta).setProperty("/MaestroProveedores/Impuesto", objImpuesto);
            models.get(sModelAlta).setProperty("/MaestroProveedores/DatosBanco", objBanco);
            models.get(sModelAlta).setProperty("/MaestroProveedores/Estado", objEstado);
            models.get(sModelAlta).refresh();
        },

        onReturnDataAdjBP: function (sCodAdj, aDataBP) {
            var oCommonHelp = this.getCommon();
            var aNewDataBP = aDataBP.filter(nFilter => nFilter.CodAdj === sCodAdj);
            if (aNewDataBP.length > 0) {
                aNewDataBP[0].FechaVence = oCommonHelp.formatDate(aNewDataBP[0].Vencimiento, "Main")
                return aNewDataBP[0];
            } else {
                return null;
            }
        },

        onLoadDataArchivo: function (aData, aDataBP) {
            aData = aData.filter(nFilter => nFilter.TipoBp === "P");
            var aNewData = [];
            for (var i in aData) {
                var boolObliga = true;
                var objDataBP = this.onReturnDataAdjBP(aData[i].CodAdj, aDataBP);
                var sDate = "";
                var boolIsLoad = true;
                if (aData[i].TipoAdj === "M") {
                    boolObliga = true;
                } else {
                    boolObliga = false;
                }
                if (objDataBP !== null) {
                    sDate = objDataBP.FechaVence;
                    boolIsLoad = true;
                } else {
                    sDate = "";
                    boolIsLoad = false;
                }
                var objData = { Tipo: aData[i].DescAdj, FechaVence: sDate, Codigo: aData[i].CodAdj, Obliga: boolObliga, IsLoad: boolIsLoad };
                aNewData.push(objData);
            }
            models.get(sModelAlta).setProperty("/MaestroProveedores/Archivos", aNewData);
            models.get(sModelAlta).setProperty("/MaestroProveedores/maxArchivos", aNewData.length);
            models.get(sModelAlta).refresh();
        },

        getObjectJson: function () {

            var objBasico = {
                Nombre: { Texto: "", Validar: { Requerido: false, Habilitado: false, IsModify: false } },
                Telefono: { Texto: "", Validar: { Requerido: false, Habilitado: false, IsModify: false } },
                Mail: { Texto: "", Validar: { Requerido: false, Habilitado: false, IsModify: false } },
                CUIT: { Texto: "", Validar: { Requerido: false, Habilitado: false, IsModify: false } },
                //CatFiscal: {Texto:"",Validar:{Requerido:false,  Habilitado:false, IsModify:false}},
                InicioAct: { Texto: "", Validar: { Requerido: false, Habilitado: false, IsModify: false } }
            };
            var objDireccion = {
                Calle: { Texto: "", Validar: { Requerido: false, Habilitado: false, IsModify: false } },
                Ciudad: { Texto: "", Validar: { Requerido: false, Habilitado: false, IsModify: false } },
                CP: { Texto: "", Validar: { Requerido: false, Habilitado: false, IsModify: false } },
                Pais: { Texto: "", Validar: { Requerido: false, Habilitado: false, IsModify: false } },
                Idioma: { Texto: "", Validar: { Requerido: false, Habilitado: false, IsModify: false } },
                Provincia: { Texto: "", Validar: { Requerido: false, Habilitado: false, IsModify: false } },
                Nrocalle: { Texto: "", Validar: { Requerido: false, Habilitado: false, IsModify: false } }
            };
            var objBanco = {
                Banco: { Texto: "", Validar: { Requerido: false, Habilitado: false, IsModify: false } },
                CBU: { Texto: "", Validar: { Requerido: false, Habilitado: false, IsModify: false } },
                CtaBancaria: { Texto: "", Validar: { Requerido: false, Habilitado: false, IsModify: false } }
                //PaisBanco: {Texto:"", Validar:{Requerido:false,  Habilitado:false, IsModify:false}}
            };
            var objImpuesto = {
                Iga: { Texto: "", Validar: { Requerido: false, Habilitado: false, IsModify: false } },
                Iva: { Texto: "", Validar: { Requerido: false, Habilitado: false, IsModify: false } },
                Iibb: { Texto: "", Validar: { Requerido: false, Habilitado: false, IsModify: false } }
            };

            var objEstado = {
                Id: "",
                Descripcion: "",
                State: "None"
            };
            var oJsonModel = {
                "Habilitado": true,
                "Estado": objEstado,
                "DatosBasicos": objBasico,
                "Direccion": objDireccion,
                "DatosBanco": objBanco,
                "Impuesto": objImpuesto,
                "Archivos": [],
                "maxArchivos": 0,

                "ReferenciaBankD": {
                    "Banco": "",
                    "Sucursal": "",
                    "OfiCuenta": "",
                    "CtaCte": "",
                    "Telefono": "",
                    "Fecha": ""
                },
                "CBU": {
                    "Banco": "",
                    "CBU": "",
                    "TipoCuenta": ""
                },
                "Checks": [{ "Value": "Constancia de inscrpcion AFIP", "FechaIni": "", "FechaFin": "" },
                { "Value": "Constancia de inscripcion IIBB", "FechaIni": "", "FechaFin": "" },
                { "Value": "CM05 Actualizado", "FechaIni": "", "FechaFin": "" },
                { "Value": "Certificado de no retencion/excension de impuestos (en caso de existir) ", "FechaIni": "", "FechaFin": "" },
                { "Value": "Inscripcion como agente de recaudacion IIBB (en caso de corresponder)", "FechaIni": "", "FechaFin": "" },
                { "Value": "Estatuto actualizado", "FechaIni": "", "FechaFin": "" },
                { "Value": "Ultimos 2 balances y/o ventas de los ultimos 2 años", "FechaIni": "", "FechaFin": "" },
                { "Value": "Actas de desingacion de autoridades y poderes de los firmantes", "FechaIni": "", "FechaFin": "" },
                { "Value": "Ultimos 2 formularios de cargas sociales pagas", "FechaIni": "", "FechaFin": "" }
                ],

                "Cli1_RazonSocial": "",
                "Cli1_Contacto": "",
                "Cli1_Telefono": "",
                "Cli1_Email": "",
                "Cli2_RazonSocial": "",
                "Cli2_Contacto": "",
                "Cli2_Telefono": "",
                "Cli2_Email": "",
                "Cli3_RazonSocial": "",
                "Cli3_Contacto": "",
                "Cli3_Telefono": "",
                "Cli3_Email": "",
                "PersonaContacto": "",
                "Telefonocobro": "",
                "emailCobro": "",

                "Prestacion": "",

                "Prov1_RazonSocial": "",
                "Prov1_Contacto": "",
                "Prov1_Telefono": "",
                "Prov1_Email": "",
                "Prov2_RazonSocial": "",
                "Prov2_Contacto": "",
                "Prov2_Telefono": "",
                "Prov2_Email": "",
                "Prov3_RazonSocial": "",
                "Prov3_Contacto": "",
                "Prov3_Telefono": "",
                "Prov3_Email": ""
            };
            return oJsonModel;
        }

    };
});
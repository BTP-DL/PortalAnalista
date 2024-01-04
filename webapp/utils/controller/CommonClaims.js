sap.ui.define([
    "simplot/portalsanalistaqas/utils/models",
    "simplot/portalsanalistaqas/utils/gateway"
    //helpers
], function (models, gateway) {
    "use strict";
    return {
        /* =========================================================== */
        /* Instance Attributes                                         */
        /* =========================================================== */
        reasons: {},
        claims: {},

        /* =========================================================== */
        /* BEGIN: General Methods                                      */
        /* =========================================================== */
        getCommon: function () {
            var commonHelp = sap.ui.require("simplot/portalsanalistaqas/utils/Common");
            return commonHelp;
        },

        getServiceName: function () {
            return "claims"
        },

        getModelName: function () {
            return "Model_Claims";
        },

        getI18nText: function (sId) {
            return models.get("i18n").getProperty(sId);
        },
        getModelClaims: function () {
            if (!models.exists(this.getModelName())) {
                this.initModelClaims();
            }
            return models.get(this.getModelName());
        },

        initModelClaims: function () {
            models.load(this.getModelName(), {
                Claims: {
                    Data: {},
                    DataBack:{},
                    Count: 0,
                    CountNew: 0,
                    CountInProcess: 0
                },
                Statuses: {
                    Data: {},
                    Count: 0
                },
                Reasons: {
                    Data: {},
                    Count: 0
                },
                Priorities: {
                    Data: {},
                    Count: 0
                },
                Users: {
                    FilteredData: {},
                    Data: [],
                    Count: 0
                },
                Filtros: {"rowsProveedor":[], "selectProveedor":[],
                    "rowStatuses": [], "selectStatuses": ["1", "2"], "CountStatuses": 0,
                    "Users": [], "selectUsers": this.getBpSap(), "CountUsers": 0, DataUsers:[],
                    "rowsMotivos": [], "selectMotivos": [],
                    "dateValueOne":  undefined, "dateValueTwo":  undefined,
                    "isFiltered": false
                }
            });
        },
        
        getBpSap: function () {
            var oUserData = models.get("Model_UserSAP").getProperty("/DataUser");
            return oUserData.UsuarioSap;
        },

        zeroPad: function (num, length) {
            const zero = length - num.toString().length + 1;
            return Array(+(zero > 0 && zero)).join("0") + num;
        },
        /* =========================================================== */
        /* END: General Methods                                        */
        /* =========================================================== */

        /* =========================================================== */
        /* BEGIN: Priorities Methods                                   */
        /* =========================================================== */
        setModelPriorities: function (priorities) {
            this.getModelClaims().setProperty("/Priorities/Data", priorities);
            this.getModelClaims().setProperty("/Priorities/Count", priorities.length);
            this.getModelClaims().refresh();
            console.log(priorities);
        },

        getPriorities: function () {
            const priorities = [{
                id: "1",
                descripcion: this.getI18nText("claim.priority.low")
            }, {
                id: "2",
                descripcion: this.getI18nText("claim.priority.normal")
            }, {
                id: "3",
                descripcion: this.getI18nText("claim.priority.high")
            }];
            this.setModelPriorities(priorities);
            return priorities;
        },
        /* =========================================================== */
        /* END: Priorities Methods                                     */
        /* =========================================================== */

        /* =========================================================== */
        /* BEGIN: Statuses Methods                                     */
        /* =========================================================== */
        setModelStatuses: function (statuses) {
            this.getModelClaims().setProperty("/Statuses/Data", statuses);
            this.getModelClaims().setProperty("/Statuses/Count", statuses.length);
            this.getModelClaims().setProperty("/Filtros/rowStatuses", statuses);
            this.getModelClaims().setProperty("/Filtros/CountStatuses", statuses.length);
            this.getModelClaims().refresh();
            console.log(statuses);
        },

        getStatuses: function () {
            const statuses = [{
                id: "1",
                descripcion: this.getI18nText("claim.status.new")
            }, {
                id: "2",
                descripcion: this.getI18nText("claim.status.inProcess")
            }, {
                id: "3",
                descripcion: this.getI18nText("claim.status.closed")
            }];
            this.setModelStatuses(statuses);
            return statuses;
        },
        /* =========================================================== */
        /* END: Statuses Methods                                       */
        /* =========================================================== */

        /* =========================================================== */
        /* BEGIN: Reasons Methods                                      */
        /* =========================================================== */
        setModelReasons: function (reasons) {
            this.getModelClaims().setProperty("/Reasons/Data", reasons);
            this.getModelClaims().setProperty("/Reasons/Count", (reasons) ? Object.keys(reasons).length : 0);
            this.getModelClaims().refresh();
            console.log(reasons);
        },

        getReasons: function (refresh = false) {
            let oPromise = null;
            if (refresh) {
                this.reasons = {};
            }
            if (!Object.keys(this.reasons).length) {
                oPromise = this.loadReasons().then(reasons => {
                    this.setModelReasons(reasons);
                    return reasons;
                });
            } else {
                oPromise = Promise.resolve(this.reasons);
            }
            return oPromise;
        },

        loadReasons: function () {
            return gateway.read(this.getServiceName(), "/MotivosSet").then((oRecive) => {
                this.reasons = oRecive.results.reduce((x, data) => {
                    x[data.Motivo] = data;
                    return x;
                }, {});
                console.log(oRecive);
                return this.reasons;
            }).catch(function (oError) {
                console.log(oError);
            });
        },

        /* =========================================================== */
        /* END: Reasons Methods                                        */
        /* =========================================================== */

        /* =========================================================== */
        /* BEGIN: Users Methods                                        */
        /* =========================================================== */
        setModelUsers: function (users) {
            var objReducerFilter = users.reduce((x, user) => {
                if (!x.hasOwnProperty(user.Usuario)) {
                    x[user.Usuario] = {
                        Usuario: user.Usuario,
                        Motivos: []
                    };
                }
                x[user.Usuario].Motivos.push(user.Motivo)
                return x;
            }, {});
            this.getModelClaims().setProperty("/Users", {
                FilteredData: objReducerFilter,
                Data: users, 
                Count: users.length
            });

            this.getModelClaims().setProperty("/Filtros/Users", objReducerFilter);
            this.getModelClaims().setProperty("/Filtros/DataUsers", users);
            this.getModelClaims().setProperty("/Filtros/CountUsers", users.length);
            this.getModelClaims().refresh();
            console.log(users);
        },

        getUsers: function (refresh = false) {
            let oPromise = null;
            if (refresh) {
                this.users = {};
            }
            if (!this.users || !Object.keys(this.users).length) {
                oPromise = this.loadUsers();
            } else {
                oPromise = Promise.resolve(this.users);
            }
            return oPromise.then((users) => {
                this.setModelUsers(users);
                return users;
            });
        },

        loadUsers: function () {
            return gateway.read(this.getServiceName(), "/UsuariosSet").then((oRecive) => {
                this.users = oRecive.results;
                console.log(oRecive);
                return this.users;
            }).catch(function (oError) {
                console.log(oError);
            });
        },
        /* =========================================================== */
        /* END: Users Methods                                          */
        /* =========================================================== */

        /* =========================================================== */
        /* BEGIN: Claims Methods                                       */
        /* =========================================================== */
        setModelClaims: async function (claims) {
            var isFiltered = this.getModelClaims().getProperty("/Filtros/isFiltered");
            var aEstado = this.getModelClaims().getProperty("/Filtros/selectStatuses");
            this.getModelClaims().setProperty("/Claims/DataBack", claims);
            //this.getModelClaims().setProperty("/Claims/Data", claims);
            //this.getModelClaims().setProperty("/Claims/Count", (claims) ? Object.keys(claims).length : 0);
            
            if((aEstado.filter(nfilter=>nfilter === "1").length > 0) && (aEstado.filter(nfilter=>nfilter === "1").length > 0)){
                this.getModelClaims().setProperty("/Claims/CountNew", (claims) ? Object.values(claims).filter(claim => claim.Estado === "1").length : 0);
                this.getModelClaims().setProperty("/Claims/CountInProcess", (claims) ? Object.values(claims).filter(claim => claim.Estado === "2").length : 0);            
                models.get("Model_MainEmp").setProperty("/Reclamos/CountNew", (claims) ? Object.values(claims).filter(claim => claim.Estado === "1").length : 0);
                models.get("Model_MainEmp").setProperty("/Reclamos/CountInProcess", (claims) ? Object.values(claims).filter(claim => claim.Estado === "2").length : 0);
            }            
            
            if(!isFiltered){                
                this.setModelMotives(claims);
                this.setModelBpSap(claims);
                this.getModelClaims().setProperty("/Claims/Data", this.setModelClaimFilter(claims));
                this.getModelClaims().setProperty("/Claims/Count", this.setModelClaimFilter(claims).length);
            }         
            models.get("Model_MainEmp").refresh();
            this.getModelClaims().refresh();
            console.log(claims);
        },

        setModelClaimFilter:function(claims){
            var oModel = this.getModelClaims();
            var aEstado = oModel.getProperty("/Filtros/selectStatuses");
            var sUserAnalista = oModel.getProperty("/Filtros/selectUsers");
            var aClaims = [];
            var aRowClaims = Object.values(claims);
            if(aEstado.length > 0){
                var aNewClaim = [];
                for(var i in aEstado){
                    var arrClaim;
                    if(aClaims.length > 0){
                        arrClaim = aClaims.filter(nfilter=>nfilter.Estado === aEstado[i]);
                    }else{
                        arrClaim  = aRowClaims.filter(nfilter=>nfilter.Estado === aEstado[i]);
                    }
                    for(var j in arrClaim){
                        aNewClaim.push(arrClaim[j]);
                    }
                }   
                aClaims = aNewClaim;
                oModel.refresh();             
            }else{
            }

            if(sUserAnalista === "" || sUserAnalista === null){
            }else{
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
            }
            return aClaims;
        },

        getClaims: function (filters, refresh = false) {
            let oPromise = null;
            if (refresh) {
                this.claims = {};
            }
            this.claims = {};
            if (!Object.keys(this.claims).length) {
                oPromise = this.loadClaims(filters);
            } else {
                oPromise = Promise.resolve(this.claims);
            }
            return oPromise.then((claims) => {
                this.setModelClaims(claims);
                return claims;
            });
        },

        setModelMotives: function(claims){
            let data = Object.values(claims);
            const uniqueArr = [];
            data.forEach((item)=>{
                if(item.BpSap === ""){}else{
                    if(uniqueArr.filter(nfilter=>nfilter.Id === item.Motivo).length > 0){}else{
                        var objItem = {Id: item.Motivo, Name: item.Motivo};
                        uniqueArr.push(objItem);
                    }
                }
            }); 
            this.getModelClaims().setProperty("/Filtros/rowsMotivos", uniqueArr);
            this.getModelClaims().refresh();
            return null;
        },

        setModelBpSap: function(claims){
            let data = Object.values(claims);
            const uniqueArr = [];
            data.forEach((item)=>{
                if(item.BpSap === ""){}else{
                    if(uniqueArr.filter(nfilter=>nfilter.Id === item.BpSap).length > 0){}else{
                        var objItem = {Id: item.BpSap, Name: item.Nombre};
                        uniqueArr.push(objItem);
                    }
                }
            }); 
            this.getModelClaims().setProperty("/Filtros/rowsProveedor", uniqueArr);
            this.getModelClaims().refresh();
            return null;
        },

        loadClaims: function (filters) {
            filters = filters || [];
            return gateway.read(this.getServiceName(), "/ReclamoSet", { "filters": filters }).then((oRecive) => {
                this.claims = oRecive.results.reduce((x, data) => {
                    x[data.Nrorec] = data;
                    return x;
                }, {});
                return this.claims;
            }).catch(function (oError) {
                console.log(oError);
            });
        },


        loadClaim: function (claimNumber) {
            return gateway.read(this.getServiceName(), `/ReclamoSet('${claimNumber}')`, { "urlParameters": { "$expand": "Posiciones,Adjuntos" } }).then((oRecive) => {
                return oRecive;
            }).catch(function (oError) {
                console.log(oError);
            });
        },

        navToClaims: function (oTargets) {
            return this.getReasons().finally(() => {
                oTargets.display("claims");
            });
        },

        navToClaim: function (oTargets, sNrorec) {
            return this.loadClaim(sNrorec).then(() => {
                oTargets.display("claim", {
                    nrorec: sNrorec
                });
            });
        },

        getClaimAttachment: function (claimNumber, fileName) {
            if (!claimNumber || !fileName) {
                return Promise.reject();
            }

            const sPath = "/" + models.get(this.getServiceName()).createKey("AdjuntoSet", {
                Nrorec: claimNumber,
                Archivo: fileName
            });

            return gateway.read(this.getServiceName(), sPath).then((oRecive) => {
                return oRecive;
            }).catch(function (oError) {
                console.log(oError);
            });
        }
        /* =========================================================== */
        /* END: Claims Methods                                         */
        /* =========================================================== */
    };
});
sap.ui.define([
	"simplot/portalsanalistaqas/utils/models"
], function(models){				
	return function(sName, vModel, bIgnoreRequestCompleted, fnFactoryPromise){
		return models.makeHelper(sName, vModel, bIgnoreRequestCompleted, fnFactoryPromise);
	};
})
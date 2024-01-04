sap.ui.define(["sap/ui/core/library", "sap/uxap/BlockBase"], function (coreLibrary, BlockBase) {
	"use strict";

	let ViewType = coreLibrary.mvc.ViewType;

	let InformationBlock = BlockBase.extend("simplot.portalsanalistaqas.view.Claim.block.information.InformationBlock", {
		metadata: {
			views: {
				Collapsed: {
					viewName: "simplot.portalsanalistaqas.view.Claim.block.information.InformationBlock",
					type: ViewType.XML
				},
				Expanded: {
					viewName: "simplot.portalsanalistaqas.view.Claim.block.information.InformationBlock",
					type: ViewType.XML
				}
			}
		}
	});
	return InformationBlock;
}, true);

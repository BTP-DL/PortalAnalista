sap.ui.define(["sap/ui/core/library", "sap/uxap/BlockBase"], function (coreLibrary, BlockBase) {
	"use strict";

	let ViewType = coreLibrary.mvc.ViewType;

	let AttachmentBlock = BlockBase.extend("simplot.portalsanalistaqas.view.Claim.block.attachment.AttachmentBlock", {
		metadata: {
			views: {
				Collapsed: {
					viewName: "simplot.portalsanalistaqas.view.Claim.block.attachment.AttachmentBlock",
					type: ViewType.XML
				},
				Expanded: {
					viewName: "simplot.portalsanalistaqas.view.Claim.block.attachment.AttachmentBlock",
					type: ViewType.XML
				}
			}
		}
	});
	return AttachmentBlock;
}, true);

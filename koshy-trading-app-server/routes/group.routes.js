const { Router } = require("express");
const GroupController = require("../controllers/groups.controller");

const router = Router();

router.post("/", GroupController.createGroup);
router.get("/", GroupController.getGroups);
router.get("/tree", GroupController.getGroupsTreeData);
router.get("/symbols", GroupController.getSymbols);
router.post("/symbols", GroupController.addStockForGroup);
router.put("/:group_id", GroupController.updateGroup);
router.get("/:group_id", GroupController.getGroupDetails);
router.delete("/:group_id", GroupController.deleteGroup);
router.post("/symbols/:symbol_id/disable", GroupController.disableSymbol);
router.get("/:group_id/symbols", GroupController.getSymbolsForGroup);
router.delete("/:group_id/symbols/:symbol_id", GroupController.deleteSymbol);

const groupRoutes = router;

module.exports = groupRoutes;

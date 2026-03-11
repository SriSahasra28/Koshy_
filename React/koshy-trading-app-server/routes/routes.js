const { Router } = require("express");
const groupRoutes = require("./group.routes");
const DataController = require("../controllers/data.controller");
const scanController = require('../controllers/scanController');

const router = Router();

// Route to restart scan processes
router.get('/api/restart-scan', scanController.restartScanProcesses);

// Route to check scan status
router.get('/api/status', scanController.getScanStatus);

// Route to stop scan processes
router.post('/api/stop', scanController.stopScanProcesses);


//router.get(`/api/heikin`, DataController.getData);
// router.get(`/api/heikin`, DataController.getDataV2);
router.get(`/api/heikin`, DataController.getData_redis);
router.get(`/api/heikinv2`, DataController.getData_redisv2);
router.get(`/api/psar`, DataController.getPsarSettings);
router.get(`/api/faststoch`, DataController.getFastStochSettings);
router.get(`/api/lrc`, DataController.getLRCSettings);
router.use(`/api/groups`, groupRoutes);
router.put('/api/update-psar-settings', DataController.updatePsarSettings);
router.put('/api/update-lrc-settings', DataController.updateLRCSettings);
router.put('/api/update-stoch-settings', DataController.updateStochSettings)
router.get(`/api/indicators`, DataController.getIndicators);

router.get(`/api/custom_indicators`, DataController.getCustomIndicators);
router.put(`/api/insert-custom-indicators`, DataController.insertCustomIndicator);
router.put(`/api/update-custom-indicators`, DataController.updateCustomIndicator);
router.put(`/api/delete-custom-indicators`, DataController.deleteCustomIndicator);
router.put(`/api/custom_indicator_by_id`, DataController.fetchCustomIndicatorById);
router.put(`/api/custom_indicator_by_type`, DataController.fetchCustomIndicatorBytype);

router.get(`/api/conditions`, DataController.getConditions);
router.put(`/api/insert-condition`, DataController.insertConditions);
router.put(`/api/update-condition`, DataController.updateCondition);
router.put(`/api/delete-condition`, DataController.deleteCondition);
router.post(`/api/fetch-condition-by-id`, DataController.fetchConditionById);

router.get(`/api/scans`, DataController.getScans);
router.put(`/api/insert-scans`, DataController.insertScans);
router.put(`/api/delete-scan-by-id`, DataController.deleteScan);
router.put(`/api/get-scan-by-id`, DataController.getScanById);
router.post(`/api/update-scan`, DataController.updateScans);


router.put(`/api/scanitem-by-scanid`, DataController.fetchScanItemsByScanID);
router.put(`/api/delete-scanitem-by-id`, DataController.deleteScanItem);
router.post(`/api/update-scanitem-by-id`, DataController.updateScanItem);
router.post(`/api/insert-scanitem-by-id`, DataController.insertScanItem);

router.get(`/api/alerts`, DataController.getAlerts);
router.put(`/api/delete-alert-by-id`, DataController.deleteAlert);
router.get(`/api/hlfp`, DataController.gethlfp);
router.post(`/api/update-hlfp`, DataController.updateHlfp);

router.post(`/api/alerts-by-symbol`, DataController.getAlertsBySymbol);

router.post(`/api/scan-indicators`, DataController.getScanIndicatorsById);

const apiRoutes = router;

module.exports = apiRoutes;

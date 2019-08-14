import Router from 'koa-router';
import auth from '../middlewares/auth';

import PerformanceController from "../controllers/PerformanceController";

const router = new Router({
  prefix: '/app'
});

router.post('/performance/save', PerformanceController.save)
      .post('/avgelapsedtime', PerformanceController.avgElapsedTime)
      .post('/reportsummary', PerformanceController.reportSummary)
      .post('/runningvuser', PerformanceController.runningVuser)
      .post("/totalerrorpersecond", PerformanceController.totalErrorPerSecond)
      .post("/hitpersecond", PerformanceController.hitPerSecond)
      .post("/avgelapsedvuser", PerformanceController.avgElapsedTimeVUser)
      .post("/avgtimebytrans",  PerformanceController.avgTimeByTrans)
      .post("/avgTimeByTransHost", PerformanceController.avgTimeByTransHost)
      .post("/kbPerSec", PerformanceController.kbPerSec)
      .post("/transPerSec", PerformanceController.transPerSec)
      .post("/transPerSecVUser", PerformanceController.transPerSecVUser)
      .post("/errorPerSecByDesc", PerformanceController.errorPerSecByDesc)
      .post("/errorPerSecByDescVUser", PerformanceController.errorPerSecByDescVUser)
      .post("/errorPerSec", PerformanceController.errorPerSec)
      .post("/errorPerSecVUser", PerformanceController.errorPerSecVUser)
      .post("/transactionSummary", PerformanceController.transactionSummary)
      .post("/pageTimings", PerformanceController.pageTimings)
      .get("/startAutomationTest/:application", PerformanceController.startAutomation )
      .get('/automationResult/:application', PerformanceController.automationResult)
  
export default router;
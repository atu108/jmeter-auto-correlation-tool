import Application from '../models/Application';
import Scenario from '../models/Scenario';
import Workflow from '../models/Workflow';
import WorkflowController from './WorkflowController';
import PerformanceTestReport from '../models/PerformanceTestReport';
import ErrorPerSec from '../models/ErrorPerSec';
import TransactionPerSecond from '../models/TransactionPerSecond';
import ResponseTimeAnalysis from '../models/ResponseTimeAnalysis';
import HitPerSecond from '../models/HitPerSecond';
import RunningVUser from '../models/RunningVUser';
import pool from '../middlewares/database';
import percentile from 'stats-percentile';

class PerformanceController {
  constructor() {
    return {
      save: this.save.bind(this),
      avgElapsedTime: this.avgElapsedTime.bind(this),
      reportSummary: this.reportSummary.bind(this),
      runningVuser: this.runningVuser.bind(this),
      totalErrorPerSecond: this.totalErrorPerSecond.bind(this),
      hitPerSecond: this.hitPerSecond.bind(this),
      avgElapsedTimeVUser: this.avgElapsedTimeVUser.bind(this),
      avgTimeByTrans: this.avgTimeByTrans.bind(this),
      avgTimeByTransHost: this.avgTimeByTransHost.bind(this),
      kbPerSec: this.kbPerSec.bind(this),
      transPerSec: this.transPerSec.bind(this),
      transPerSecVUser: this.transPerSecVUser.bind(this),
      errorPerSecByDesc: this.errorPerSecByDesc.bind(this),
      errorPerSecByDescVUser: this.errorPerSecByDescVUser.bind(this),
      errorPerSec: this.errorPerSec.bind(this),
      errorPerSecVUser: this.errorPerSecVUser.bind(this),
      transactionSummary: this.transactionSummary.bind(this)
    }
  }

  async save(objectArray) {
    try {
      let keys = Object.keys(objectArray[0]);
      let values = objectArray.map(obj => keys.map(key => obj[key]));
      console.log(values.length)
      let q1 = 'INSERT INTO performance_test_report' + ' (' + keys.join(',') + ') VALUES ?';
      let q2 = 'INSERT INTO PERF_TXN_WISE SELECT * FROM performance_test_report WHERE responseMessage like \'"Number of samples in transaction%\'';
      await pool.query(q1, [values]);
      await pool.query(q2)
      // await PerformanceTestReport.create(ctx.request.body);
      // await this.insertProcessedDataIntoErrorPerSec()
      // await this.insertProcessedDataIntoTransactionPerSecond()
      // await this.insertProcesedDataIntoResponseTimeAnalysis()
      // await this.insertProcessedDataIntoHitPerSecond()
      // await this.insertProcessedDataIntoRunningVUser()
      // await this.insertProcessedDataIntoRunWiseAnalysisSummary()
      // await this.insertProcessedDataIntoPerformanceWiseTransactionSummary(runId, releaseId, testType, applicationName)
      return 
    } catch (e) {
      console.log(e)
      return false
    }
  }

  async avgElapsedTime(ctx) {
    try {
      const { application_id , test_id } = ctx.request.body;
      console.log(application_id, test_id)
      const q = `SELECT sum(elapsed)/(1000) as elapsed, label, round(timeStamp/1000) timeStamp FROM performance.perf_txn_wise where application_id= '${application_id}' and test_id = '${test_id}' group by  round(timeStamp/1000), label order by round(timeStamp/1000) asc`;
      const getUniqueLabel = `select distinct label from performance.perf_txn_wise where application_id= '${application_id}' and test_id = '${test_id}'`;
      let minQ = `select min(round(timeStamp/1000)) as minTime from performance.perf_txn_wise where application_id= '${application_id}' and test_id = '${test_id}'`
      const graphData = await pool.query(q);
      const uniqueLabels = await pool.query(getUniqueLabel);
      const minTime = await pool.query(minQ);
      return ctx.body = {
        success: true,
        data: graphData,
        uniqueLabels,
        minTime
      };
    } catch (e) {
      return ctx.body = {
        success: false,
        message: "Something went wrong"
      }
    }

  }
  async reportSummary(ctx) {
    try {
      const { application_id , test_id } = ctx.request.body;
      const q = `select sum(ptr.bytes+ptr.sentBytes) as total_Throughput ,sum(ptr.bytes+ptr.sentBytes)/((max(ptr.timeStamp) - min(ptr.timeStamp))) as avg_Throughput, count(*) as total_Hits,count(*)/((max(ptr.timeStamp) - min(ptr.timeStamp))) as Avg_Hit_PS, sum(CASE WHEN ptr.success= 'false' and ptr.responseMessage not like '\"Number of samples in transaction%\' THEN 1 ELSE 0 END) as total_Error, sum(CASE WHEN (ptr.success= 'true' and ptr.responseMessage not like '\"Number of samples in transaction%\') THEN 1 ELSE 0 END) as total_Pass_Transaction,sum(CASE WHEN (ptr.success= 'false' and ptr.responseMessage not like '\"Number of samples in transaction%\') THEN 1 ELSE 0 END) as total_Fail_Transaction from performance_test_report ptr where ptr.responseMessage not like '"Number of samples in transaction%\' and ptr.application_id= '${application_id}' and ptr.test_id = '${test_id}'`;
      const summary = await pool.query(q);
      return ctx.body = {
        success: true,
        data: summary
      }
    } catch (e) {
      console.log(e);
      return ctx.body = {
        success: false,
        message: "Something went wrong"
      }
    }
  }

  async runningVuser(ctx) {
    try {
      const { application_id , test_id } = ctx.request.body;
      const q = `select round(ptr.timeStamp/1000) as timeStamp, max(ptr.allThreads) as user from performance_test_report ptr where application_id= '${application_id}' and test_id = '${test_id}' group by round(ptr.timeStamp/1000), ptr.hostname order by round(ptr.timeStamp/1000)`;
      const runningVsuer = await pool.query(q);
      return ctx.body = {
        success: true,
        data: runningVsuer
      }
    } catch (e) {
      console.log(e);
      return ctx.body = {
        success: false,
        message: "Something went wrong"
      }
    }
  }

  async totalErrorPerSecond(ctx) {
    try {
      const { application_id , test_id } = ctx.request.body;
      const q = `select round(ptr.timeStamp/1000) as timeStamp, count(ptr.responseMessage) as errorCount from performance_test_report ptr where ptr.responseMessage like '\"Number of samples in transaction%\' and ptr.success = "false" and ptr.application_id= '${application_id}' and ptr.test_id = '${test_id}' group by round(ptr.timeStamp/1000) order by round(ptr.timeStamp/1000)`;
      const error = await pool.query(q);
      return ctx.body = {
        success: true,
        data: error
      }
    } catch (e) {
      console.log(e)
      return ctx.body = {
        success: false,
        message: "Something went wrong"
      }
    }
  }

  async hitPerSecond(ctx) {
    try {
      const { application_id , test_id } = ctx.request.body;
      const q = `select round(ptr.timeStamp/1000) as timeStamp, count(ptr.label) as hits from performance_test_report ptr where ptr.responseMessage not like '"Number of samples in transaction%\' and ptr.application_id= '${application_id}' and ptr.test_id = '${test_id}' group by round(ptr.timeStamp/1000) order by round(ptr.timeStamp/1000)`;
      const hit = await pool.query(q);
      return ctx.body = {
        success: true,
        data: hit
      }
    } catch (e) {
      console.log(e)
      return ctx.body = {
        success: false,
        message: "Something went wrong"
      }
    }
  }
  async avgElapsedTimeVUser(ctx) {
    try {
      const { application_id , test_id } = ctx.request.body;
      const q = `SELECT sum(elapsed)/(1000) as elapsed, label, round(timeStamp/1000) timeStamp FROM performance.perf_txn_wise where application_id= '${application_id}' and test_id = '${test_id}' group by  round(timeStamp/1000), label order by round(timeStamp/1000) asc`;
      // const getUniqueLabel = "select distinct label from performance.perf_txn_wise";
      // let minQ = "select min(round(timeStamp/1000)) as minTime from performance.perf_txn_wise"
      const q2 = `select round(ptr.timeStamp/1000) as timeStamp, max(ptr.allThreads) as user from performance_test_report ptr where application_id= '${application_id}' and test_id = '${test_id}' group by round(ptr.timeStamp/1000), ptr.hostname order by round(ptr.timeStamp/1000)`
      const graphData = await pool.query(q);
      const vuser = await pool.query(q2);
      // const uniqueLabels = await pool.query(getUniqueLabel);
      
      // const minTime = await pool.query(minQ);
      let finalData = []
      graphData.forEach( d => {
        vuser.forEach( u => {
          if(d.timeStamp == u.timeStamp){
            d.user = u.user
            return false
          }
        })
        finalData.push(d)
      })
      return ctx.body = {
        success: true,
        data: finalData
      };
    } catch (e) {
      console.log(e)
      return ctx.body = {
        success: false,
        message: "Something went wrong"
      }
    }

  }

  async avgTimeByTrans(ctx) {
    try {
      const { application_id , test_id } = ctx.request.body;
      const q = `select ptr.label, avg(ptr.elapsed) as elapsed from performance_test_report ptr where ptr.responseMessage like '\"Number of samples in transaction%\' and ptr.application_id= '${application_id}' and ptr.test_id = '${test_id}' group by ptr.label`;
      const graphData = await pool.query(q);
      return ctx.body = {
        success: true,
        data: graphData
      };
    } catch (e) {
      console.log(e)
      return ctx.body = {
        success: false,
        message: "Something went wrong"
      }
    }
  }
  async avgTimeByTransHost(ctx) {
    try {
      const { application_id , test_id } = ctx.request.body;
      const q = `select ptr.label, ptr.Hostname, avg(ptr.elapsed) as elapsed from performance_test_report ptr where ptr.responseMessage like '\"Number of samples in transaction%\' and ptr.application_id= '${application_id}' and ptr.test_id = '${test_id}' group by ptr.label , ptr.hostname`;
      const getUniqueHost= "select distinct Hostname from performance.perf_txn_wise";
      const graphData = await pool.query(q);
      const uniqueHost = await pool.query(getUniqueHost)
      return ctx.body = {
        success: true,
        data: graphData,
        uniqueHost
      };
    } catch (e) {
      console.log(e)
      return ctx.body = {
        success: false,
        message: "Something went wrong"
      }
    }
  }

  async kbPerSec( ctx ){
    try{
      const { application_id , test_id } = ctx.request.body;
      const q = `select round(ptr.timeStamp/1000) as timeStamp, sum(ptr.bytes+ptr.sentBytes)/1024 as kb from performance_test_report ptr where ptr.application_id= '${application_id}' and ptr.test_id = '${test_id}' group by round(ptr.timeStamp/1000) order by round(ptr.timeStamp/1000)`;
      const kbs = await pool.query(q);
      return ctx.body = {
        success: true,
        data: kbs
      }
    }catch(e){
      console.log(e)
      return ctx.body = {
        success: false,
        message: "Something went wrong"
      }
    }
  }

  async transPerSec(ctx){
    try{
      const { application_id , test_id } = ctx.request.body;
      const q = `select round(timeStamp/1000) as timeStamp, count(label) as label from performance_test_report ptr where ptr.responseMessage like '"Number of samples in transaction%\' and ptr.application_id= '${application_id}' and ptr.test_id = '${test_id}' group by round(ptr.timeStamp/1000) order by round(ptr.timeStamp/1000)`;
      const trans = await pool.query(q);
      return ctx.body = {
        success: true,
        data: trans
      }
    }catch(e){
      console.log(e)
      return ctx.body = {
        success: false,
        message: "Something went wrong"
      }
    }
  }
  async transPerSecVUser(ctx){
    try{
      const { application_id , test_id } = ctx.request.body;
      const q = `select round(timeStamp/1000) as timeStamp, count(label) as label from performance_test_report ptr where ptr.responseMessage like '\"Number of samples in transaction%\' and ptr.application_id= '${application_id}' and ptr.test_id = '${test_id}' group by round(ptr.timeStamp/1000) order by round(ptr.timeStamp/1000)`;
      const trans = await pool.query(q);
      const q2 = `select round(ptr.timeStamp/1000) as timeStamp, max(ptr.allThreads) as user from performance_test_report ptr where application_id= '${application_id}' and test_id = '${test_id}' group by round(ptr.timeStamp/1000), ptr.hostname order by round(ptr.timeStamp/1000)`
      const vuser = await pool.query(q2);
      // const uniqueLabels = await pool.query(getUniqueLabel);
      
      // const minTime = await pool.query(minQ);
      let finalData = []
      trans.forEach( d => {
        vuser.forEach( u => {
          if(d.timeStamp == u.timeStamp){
            d.user = u.user
            return false
          }
          
        })
        finalData.push(d)
      })
      return ctx.body = {
        success: true,
        data: finalData
      }
    }catch(e){
      console.log(e)
      return ctx.body = {
        success: false,
        message: "Something went wrong"
      }
    }
  }
  async errorPerSecByDesc(ctx){
    try{
      const { application_id , test_id } = ctx.request.body;
      const q = `select ptr.responseMessage, round(ptr.timeStamp/1000) as timeStamp, count(ptr.responseMessage) as countRes from performance.performance_test_report ptr where ptr.responseMessage not like '\"Number of samples in transaction%' and ptr.success = 'false' and ptr.application_id= '${application_id}' and ptr.test_id = '${test_id}' group by round(ptr.timeStamp/1000), ptr.responseMessage order by round(ptr.timeStamp/1000)`;
      const uniqueQuery = "select distinct responseMessage from performance_test_report where responseMessage not like '\"Number of samples in transaction%' and success = 'false' "
      const uniqueErrors = await pool.query(uniqueQuery);
      const errorPerSecByDesc = await pool.query(q);

      return ctx.body = {
        success: true,
        data: errorPerSecByDesc,
        uniqueErrors
      }
    }catch(e){
      console.log(e)
      return ctx.body = {
        success: false,
        message: "Something went wrong"
      }
    }
  }
  
  async errorPerSecByDescVUser(ctx){
    try{
      const { application_id , test_id } = ctx.request.body;
      const q = `select ptr.responseMessage, round(ptr.timeStamp/1000) as timeStamp, count(ptr.responseMessage) as countRes performance.performance_test_report ptr where ptr.responseMessage not like '\"Number of samples in transaction%' and ptr.success = 'false' and ptr.application_id= '${application_id}' and ptr.test_id = '${test_id}' group by round(ptr.timeStamp/1000), ptr.responseMessage order by round(ptr.timeStamp/1000)`;
      const errorPerVuser = await pool.query(q);
      const q2 = `select round(ptr.timeStamp/1000) as timeStamp, max(ptr.allThreads) as user from performance_test_report ptr where application_id= '${application_id}' and test_id = '${test_id}' group by round(ptr.timeStamp/1000), ptr.hostname order by round(ptr.timeStamp/1000)`
      const vuser = await pool.query(q2);
      let finalData = []
      errorPerVuser.forEach( d => {
        vuser.forEach( u => {
          if(d.timeStamp == u.timeStamp){
            d.user = u.user
            return false
          }
          
        })
        finalData.push(d)
      })
      return ctx.body = {
        success: true,
        data: finalData
      }
    }catch(e){
      console.log(e)
      return ctx.body = {
        success: false,
        message: "Something went wrong"
      }
    }
  }
  async errorPerSec(ctx){
    try{
      const { application_id , test_id } = ctx.request.body;
      const q = `select round(ptr.timeStamp/1000) as timeStamp, count(ptr.label) countOfLabel from performance_test_report ptr where ptr.success = 'false' and ptr.application_id= '${application_id}' and ptr.test_id = '${test_id}' group by round(ptr.timeStamp/1000) order by round(ptr.timeStamp/1000)`;
      const errorPerVuser = await pool.query(q);
      return ctx.body = {
        success: true,
        data: errorPerVuser
      }
    }catch(e){
      console.log(e)
      return ctx.body = {
        success: false,
        message: "Something went wrong"
      }
    }
  }
  async errorPerSecVUser(ctx){
    try{
      const { application_id , test_id } = ctx.request.body;
      const q = `select round(ptr.timeStamp/1000) as timeStamp, count(ptr.label) as countOfLabel, max(allThreads) as user from performance_test_report ptr where ptr.success = 'false' and ptr.application_id= '${application_id}' and ptr.test_id = '${test_id}' group by round(ptr.timeStamp/1000) order by round(ptr.timeStamp/1000)`;
      const errorPerVuser = await pool.query(q);
      return ctx.body = {
        success: true,
        data: errorPerVuser
      }
    }catch(e){
      console.log(e)
      return ctx.body = {
        success: false,
        message: "Something went wrong"
      }
    }
  }
  async transactionSummary(ctx){
    try{
      const { application_id , test_id } = ctx.request.body;
      const q = `select ptr.label as transaction_Name, min(ptr.elapsed)/1000 as minimum,avg(ptr.elapsed)/1000 as average, max(ptr.elapsed)/1000 as maximum, sqrt((sum(elapsed*elapsed)/count(elapsed)) - (avg(elapsed) * avg(elapsed)))/1000 as std_Deviation, SUM(CASE WHEN ptr.success= 'true' THEN 1 ELSE 0 END) as pass, SUM(CASE WHEN ptr.success= 'false' THEN 1 ELSE 0 END) as fail from perf_txn_wise ptr where application_id= '${application_id}' and test_id = '${test_id}' group by ptr.label`;
      const elapsedQ = `select elapsed/1000 as elapsed, label from perf_txn_wise where application_id= '${application_id}' and test_id = '${test_id}'`;
      const distinctLabelsq = `select distinct label from perf_txn_wise where application_id='${application_id}' and test_id = '${test_id}'` 
      const elapsed = await pool.query(elapsedQ);
      let transactionSummary = await pool.query(q);
      let distLabels = await pool.query(distinctLabelsq)
      distLabels = distLabels.map( l => l.label);
      let obj = {};
      elapsed.forEach( e => {
        if(obj.hasOwnProperty(e.label)){
          obj[e.label].push(e.elapsed)
        }else{
          obj[e.label] = []
          obj[e.label].push(e.elapsed)
        }
        
      })
      transactionSummary = transactionSummary.map( t => {
        t['90 Percentile'] = percentile(obj[t.transaction_Name], 90)
        return t
      })
      console.log(obj)
      //elapsed.forEach()
     // transactionSummary[0]['90 Percentile'] = percentile(elapsed[0].elapsed)
      return ctx.body = {
        success: true,
        data: transactionSummary
      }
    }catch(e){
      console.log(e)
      return ctx.body = {
        success: false,
        message: "Something went wrong"
      }
    }
  }
  

}

export default new PerformanceController();
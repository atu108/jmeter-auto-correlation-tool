import aws from 'aws-sdk';
import path from 'path';
import fs from 'fs';
import logger from '../utility/logger';
import _ from 'lodash';
const API_VERSION = '2016-11-15';
const REGION = 'ap-south-1';
const GroupIds = ["sg-06bded2aeb9c85aa6"];
const defaultInstanceParams = {
    ImageId: 'ami-035b590ea11e7059b',
    InstanceType: 't2.micro',
    MinCount: 1,
    MaxCount: 1,
    SecurityGroupIds: GroupIds
}

// var credentials = new aws.SharedIniFileCredentials({ profile: 'default' });
// aws.config.credentials = credentials;
// Load credentials and set region from JSON file
class AWS {
    constructor(region = REGION, instanceParams) {
        aws.config.loadFromPath(path.join(__dirname, '../config/aws.json'))
        aws.config.update({
            region
        });
        // config.loadFromPath(path.join(__dirname, '../config/awsConfig.json'));
        this.instanceParams = _.merge({}, defaultInstanceParams, instanceParams)
        this.instanceIds = [];
        this.tags = [];
        return {
            /*
             return public methods
            */
            start: this.start.bind(this),
            stop: this.stop.bind(this),
            checkStatus: this.checkStatus.bind(this),
            getDynamicIp: this.getDynamicIp.bind(this)
        }
    }

    async _getTagPrams(instanceIds, tags) {
        // instanceIds are []
        // tags are array of object [{ key:'', value: ''}]
        if (_.size(tags) < 0 || !tags[0]) {
            tags = await _getTags();
        }
        return {
            Resources: instanceIds,
            Tags: tags
        };
    }
    async _getTags() {
        return [
            {
                key: 'Default',
                value: 'Default-Instance'
            }
        ]
    }
    async _createInstance(instanceParams = []) {
        try {
            const instanceData = await new aws.EC2({ apiVersion: API_VERSION }).runInstances(instanceParams).promise();
            if (_.size(instanceData) > 0) {
                return instanceData;
            } else {
                return false;
            }
        } catch (e) {
            console.log(e)
            logger.error(`Aws error in create: - ${e.message || e}`);
            console.error(`Aws error in create: - ${e.message || e}`);
            return false
        }
    }

    async _tagInstance(tagParams) {
        try {
            return await new aws.EC2({ apiVersion: API_VERSION }).createTags(tagParams).promise();
        } catch (e) {
            logger.error(`Aws error: - ${e.message || e}`);
            console.error(`Aws error: - ${e.message || e}`);
            throw e;
        }
    }

    async start() {
        try {
            const instanceData = await this._createInstance(this.instanceParams);
            if (!instanceData) return false;
            const tagParams = await this._getTagPrams(_.get(instanceData, 'instanceIds'))
            await this._tagInstance(tagParams);
            let instanceId = _.get(instanceData, 'Instances[0].InstanceId', []);
            let ipAddress = _.get(instanceData, 'Instances[0].PrivateIpAddress', []);
            if (!instanceId || !ipAddress) return false;
            return {
                instanceId,
                ipAddress
            }
        } catch (e) {
            console.error("error in helper aws ", e);
        }

    }

    // accepts array of instance ids for termination
    /*
        Note:- 
        Not changing it into await coz can not find terminateInstamnces which returns promise
        will callback to promise later
    */
    stop(instanceIds) {
        return new Promise((resolve, reject) => {
            ec2.terminateInstances({ InstanceIds: instanceIds }, function (err, data) {
                if (err) {
                    logger.error(`Aws error || stop: - ${e.message || e}`);
                    console.error(`Aws error || stop: - ${e.message || e}`);
                    reject(err)
                } else {
                    for (var i in data.TerminatingInstances) {
                        var instance = data.TerminatingInstances[i];
                        logger.error(`Aws terminated instances: - ${instance}`);
                    }
                    resolve()
                }
            });
        })
    }

    checkStatus(instanceIds) {
        /*
            To do:
            1) will have to change for logging status of multiple instances
        */
        let params = {
            InstanceIds: instanceIds
        };
        return new Promise((resolve, reject) => {
            ec2.describeInstanceStatus(params, function (err, data) {
                if (err) {
                    reject(error.stack); // an error occurred
                }
                else {
                    let status = {
                        isRuning: _.get(data, 'InstanceStatuses.0.InstaceState.Name') == 'running',
                        isReachable: _.get(data, 'InstanceStatuses.0.InstaceStatus.Details', [])
                            .filter(obj => {
                                _.get(obj, 'Name') == 'reachability' && _.get(obj, 'Status') == 'passed'
                            })
                            .length > 0
                    }
                    resolve(status);
                }
            })
            // sample successful response
            /*
            data = {
             InstanceStatuses: [
                {
               AvailabilityZone: "us-east-1d", 
               InstanceId: "i-1234567890abcdef0", 
               InstanceState: {
                Code: 16, 
                Name: "running"
               }, 
               InstanceStatus: {
                Details: [
                   {
                  Name: "reachability", 
                  Status: "passed"
                 }
                ], 
                Status: "ok"
               }, 
               SystemStatus: {
                Details: [
                   {
                  Name: "reachability", 
                  Status: "passed"
                 }
                ], 
                Status: "ok"
               }
              }
             ]
            }
            */
        });
        // To do
    }

    getDynamicIp(instanceIds) {
        var params = {
            InstanceIds: instanceIds
           };
          return new Promise((resolve, reject)=> {
            ec2.describeInstances(params, function(err, data) {
                if (err) {
                    console.log(err, err.stack);
                    reject(err)
                 }else{
                     console.log(JSON.stringify(data))
                     resolve()
                }         // successful response
                /*
                data = {
                }
                */
              });
          }) 
        // To do
        // console.log(aws.Endpoint)
    }



}

export default AWS;
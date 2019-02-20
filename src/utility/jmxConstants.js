import Run from '../models/Run';
import Difference from '../models/Difference';
import Correlation from '../models/Correlation';
import ParamSetting from '../models/ParamSetting';
import {URL} from 'url';
import Request from '../models/Request';
const parse = require('tld-extract')

//  export async function checkCorName(key , value, request){
//    const diff = await Difference.find({key,value,"first.request":request});
//    if(diff.length !== 1) return false;
//    console.log("found diff", diff);
//     if(diff[0].duplicate){
//         const col = await Correlation.find({key ,value ,"first.request":diff[0].duplicate});
//         if(col.length > 0){
//             return col[0].reg_name;
//         }else{
//             return false;
//         }
        
//     }else{
//         const col = await Correlation.find({key ,value ,"first.request":request});
//         console.log("correlatuio cheicng", col);
//         if(col.length > 0){
//             return col[0].reg_name;
//         }else{
//             return false 
//         }
//     }
// }
export const resolveArray = async (myArray, request_id) => {
    async function checkCorName(key , value,request){
        const diff = await Difference.find({key,value,"first.request":request});
        if(diff.length !== 1) return false;
         if(diff[0].duplicate){
             const col = await Correlation.find({difference:diff[0].duplicate});
             if(col.length > 0){
                 return "\${"+col[0].reg_name+"}";
             }else{
                 return false;
             }
             
         }else{
             const col = await Correlation.find({difference:diff[0]._id});
             if(col.length > 0){
                 return "\${"+col[0].reg_name+"}";
             }else{
                 return false;
             }
         }
     }

     let toSend = ''
    for(let i = 0; i < myArray.length; i++){
        let temp = await checkCorName(Object.keys(myArray[i])[0],myArray[Object.keys(myArray[i])[0]],request_id);
        console.log("data to fetch", request_id, Object.keys(myArray[i])[0], myArray[i][Object.keys(myArray[i])])
        let inSettings = await ParamSetting.find({
            request: request_id,
            key: Object.keys(myArray[i])[0],
            value: myArray[i][Object.keys(myArray[i])]
        })
        console.log("cehcking settigns data", inSettings);
        if(inSettings.length === 1){
            toSend += `<elementProp name="key" elementType="HTTPArgument">
            <boolProp name="HTTPArgument.always_encode">false</boolProp>
            <stringProp name="Argument.name">${Object.keys(myArray[i])[0]}</stringProp>
            <stringProp name="Argument.value">\${${Object.keys(myArray[i])[0]}_par}</stringProp>
            <stringProp name="Argument.metadata">=</stringProp>
            <boolProp name="HTTPArgument.use_equals">true</boolProp>
          </elementProp>`
        }else{
            toSend += `<elementProp name="key" elementType="HTTPArgument">
            <boolProp name="HTTPArgument.always_encode">false</boolProp>
            <stringProp name="Argument.name">${Object.keys(myArray[i])[0]}</stringProp>
            <stringProp name="Argument.value">${temp?temp:myArray[i][Object.keys(myArray[i])[0]]}</stringProp>
            <stringProp name="Argument.metadata">=</stringProp>
            <boolProp name="HTTPArgument.use_equals">true</boolProp>
          </elementProp>`
        }
       
    }
    console.log("cheching to send", toSend);
    return toSend;
}

export const parseParams = async (request , urlPath) =>{
    // myURL.search.replace(/&/gi,'&amp;')
    // console.log("checking request", request)
   
    const diff = await Difference.find({"first.request":request._id,key:'url'});
    let pathName = urlPath;
    console.log(pathName);
    if(diff.length > 0){
        const col = await Correlation.find({difference:diff[0]._id});
        if(col.length > 0){
            console.log("found col", col);
            const splitWith = parse(diff[0].first.value).tld
            pathName = diff[0].first.value.split(`.${splitWith}`)[1];
            console.log("checking path name", pathName);
            const index = (col[0].key === 'url');
            if(index){
                let regName = col[0].reg_name;
                console.log("inside jmx constants", regName);
                for(let i = 0; i < regName.toReplace.length; i++){
                    pathName = pathName.replace(regName.toReplace[i], `\${${col[0].reg_final_name}_${regName.withWhat[i]}}`);
                }
                pathName = diff[0].first.value.split(`.${splitWith}`)[0] + `.${splitWith}` + pathName;
                console.log("path names", pathName);
            }
        }
    }
    //find all the co realtions related to this request then form the same url using _COR
    let myURL = new URL(pathName);
    const params = request.request.params;
    if(params.length === 0){

        return pathName.split(`.${parse(pathName).tld}`)[1].replace(/&/g,'&amp;');
    }
    let inSettings = await ParamSetting.find({
        request: request._id
    });

    for(let i = 0; i < params.length; i++){
        let key = Object.keys(params[i])[0];
        let value = params[i][key];
        let exists = inSettings.findIndex((setting)=> setting.key === key);
        if(exists !== -1){
            myURL.searchParams.set(key, `\${${key}_par}`);
        }
    }
    return decodeURIComponent(myURL.href.split(`.${parse(myURL.href).tld}`)[1].replace(/&/g,'&amp;'));
}

 
import Run from '../models/Run';
import Difference from '../models/Difference';
import Correlation from '../models/Correlation';
import ParamSetting from '../models/ParamSetting';
import Request from '../models/Request';

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
        console.log("request", request_id, "keys", Object.keys(myArray[i])[0], "value", myArray[Object.keys(myArray[i])[0]])
        let inSettings = await ParamSetting.find({
            request: request_id,
            key: Object.keys(myArray[i])[0],
            value: myArray[Object.keys(myArray[i])[0]]
        })

        if(inSettings.length > 0){
            toSend += `<elementProp name="key" elementType="HTTPArgument">
            <boolProp name="HTTPArgument.always_encode">false</boolProp>
            <stringProp name="Argument.name">${Object.keys(myArray[i])[0]}</stringProp>
            <stringProp name="Argument.value">\${${Object.keys(myArray[i])[0]}_cor}</stringProp>
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

export const parseParams = async (request) =>{
    // myURL.search.replace(/&/gi,'&amp;')
    // console.log("checking request", request)
    const params = request.request.params;
    if(params.length === 0){
        return false;
    }
    let query = ''
    let inSettings = await ParamSetting.find({
        request: request._id
    });
    for(let i = 0; i < params.length; i++){
        let key = Object.keys(params[i])[0];
        let value = params[i][key];
        let exists = inSettings.findIndex((setting)=> setting.key === key);
        if(exists === -1){
            if(i === 0 ){
                query += `?${key}=${value}`
            }else{
                query += `&amp;${key}=${value}`
            }
            
        }else{
            if(i === 0 ){
                query += `?${key}=\${${key}_par}`
            }else{
                query += `&amp;${key}=\${${key}_par}`
            }
        }
    }
    return query;

}

 
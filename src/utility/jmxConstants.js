import Run from '../models/Run';
import Difference from '../models/Difference';
import Correlation from '../models/Correlation';
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
        toSend += `<elementProp name="key" elementType="HTTPArgument">
      <boolProp name="HTTPArgument.always_encode">false</boolProp>
      <stringProp name="Argument.name">${Object.keys(myArray[i])[0]}</stringProp>
      <stringProp name="Argument.value">${temp?temp:myArray[i][Object.keys(myArray[i])[0]]}</stringProp>
      <stringProp name="Argument.metadata">=</stringProp>
      <boolProp name="HTTPArgument.use_equals">true</boolProp>
    </elementProp>`
    }
    console.log("cheching to send", toSend);
    return toSend;
}

 
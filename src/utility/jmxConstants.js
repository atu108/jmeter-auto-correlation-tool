import Run from '../models/Run';
import Difference from '../models/Difference';
import Correlation from '../models/Correlation';
import Request from '../models/Request';

export const checkCorName = async (key , value, request) => {
   const diff = await Difference.find({key,value,"first.request":request});
   if(diff.length !== 1) return false;
   console.log("found diff", diff);
    if(diff[0].duplicate){
        const col = await Correlation.find({key ,value ,"first.request":diff[0].duplicate});
        if(col.length > 0){
            return col[0].reg_name;
        }else{
            return false;
        }
        
    }else{
        const col = await Correlation.find({key ,value ,"first.request":request});
        console.log("correlatuio cheicng", col);
        if(col.length > 0){
            return col[0].reg_name;
        }else{
            return false 
        }
    }
}
export const resolveArray = (myArray) => Promise.all(myArray.map( async function(post_data){
            console.log("hello");
            var temp = await checkCorName(Object.keys(post_data)[0],post_data[Object.keys(post_data)[0]],requests[j]._id)
            `<elementProp name="key" elementType="HTTPArgument">
          <boolProp name="HTTPArgument.always_encode">false</boolProp>
          <stringProp name="Argument.name">${Object.keys(post_data)[0]}</stringProp>
          <stringProp name="Argument.value">${temp?temp:post_data[Object.keys(post_data)[0]]}</stringProp>
          <stringProp name="Argument.metadata">=</stringProp>
          <boolProp name="HTTPArgument.use_equals">true</boolProp>
        </elementProp>`}).join('')
    )
 
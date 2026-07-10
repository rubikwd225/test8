import { db } from "./firebase.js";


import {

doc,
getDoc,
updateDoc

} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";



const startBtn =
document.getElementById("startBtn");


const scannerBox =
document.getElementById("scannerBox");


const reader =
document.getElementById("reader");


const result =
document.getElementById("result");


const actions =
document.getElementById("actions");


const action1 =
document.getElementById("action1");


const action2 =
document.getElementById("action2");


const cancelBtn =
document.getElementById("cancelBtn");


const retryBtn =
document.getElementById("retryBtn");


const radios =
document.querySelectorAll(
'input[name="day"]'
);




let collectionName =
"tickets_day1";


let scanner=null;

let currentId=null;

let processing=false;




radios.forEach(radio=>{


radio.addEventListener("change",()=>{


collectionName =
radio.value;


});


});





startBtn.onclick=()=>{


startScanner();


};







async function startScanner(){



startBtn.style.display="none";


result.style.display="none";


scannerBox.style.display="block";



if(scanner){


try{

await scanner.clear();

}catch{}

}



scanner =
new Html5Qrcode("reader");




scanner.start(


{
facingMode:"environment"
},


{

fps:10,


qrbox:(width,height)=>{


const size =
Math.min(width,height)*0.7;


return {

width:size,

height:size

};


}

},


scanSuccess,


()=>{}



);


}









async function scanSuccess(text){


if(processing)
return;


processing=true;



try{


await scanner.stop();


await scanner.clear();



scanner=null;


scannerBox.style.display="none";


result.style.display="block";



currentId=text;




const snap =
await getDoc(

doc(
db,
collectionName,
currentId
)

);





if(!snap.exists()){



result.textContent =
"❌ 整理券が見つかりません";


retryBtn.style.display="block";


return;


}





const data =
snap.data();



result.innerHTML=`

No.${data.number}

<br><br>

現在：
${statusText(data.status)}

`;



showActions(data.status);




}
catch(e){


console.error(e);


result.textContent =
"❌ 読み取りエラー";


retryBtn.style.display="block";


}
finally{


processing=false;


}


}






function statusText(status){


if(status==="waiting")
return "受付前";


if(status==="before")
return "入場前";


if(status==="entered")
return "入場済み";


return "不明";


}







function showActions(status){



actions.style.display="block";



if(status==="waiting"){


action1.textContent =
"受付済みにする";


action2.style.display="none";



action1.onclick=()=>{

updateStatus("before");

};


}




if(status==="before"){


action1.textContent =
"入場済みにする";


action2.style.display="block";


action2.textContent =
"受付前に戻す";



action1.onclick=()=>{

updateStatus("entered");

};



action2.onclick=()=>{

updateStatus("waiting");

};


}




if(status==="entered"){


action1.textContent =
"入場前に戻す";


action2.style.display="block";


action2.textContent =
"受付前に戻す";



action1.onclick=()=>{

updateStatus("before");

};


action2.onclick=()=>{

updateStatus("waiting");

};


}


}







async function updateStatus(status){



await updateDoc(

doc(
db,
collectionName,
currentId
),

{

status:status

}

);



actions.style.display="none";


result.textContent =
"✅ 更新しました";



setTimeout(()=>{


reset();


},1000);



}








function reset(){



currentId=null;


scannerBox.style.display="none";


result.style.display="block";


result.textContent =
"QRコードを読み取ってください";


actions.style.display="none";


retryBtn.style.display="none";


startBtn.style.display="block";



}







cancelBtn.onclick=()=>{


reset();


};





retryBtn.onclick=()=>{


reset();


startScanner();


};
import { db } from "./firebase.js";

import {
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const startBtn = document.getElementById("startBtn");

const reader = document.getElementById("reader");
const scannerBox = document.getElementById("scannerBox");

const result = document.getElementById("result");

const actions = document.getElementById("actions");

const action1 = document.getElementById("action1");
const action2 = document.getElementById("action2");
const cancelBtn = document.getElementById("cancelBtn");

const retryBtn = document.getElementById("retryBtn");

const dayRadios =
document.querySelectorAll('input[name="day"]');

let collectionName = "tickets_day1";

let scanner = null;

let currentId = null;

let isScanning = false;

let isProcessing = false;


dayRadios.forEach(radio => {

    radio.addEventListener("change",()=>{

        collectionName = radio.value;

    });

});

startBtn.onclick = () => {

    startScanner();

};



async function startScanner(){

    resetDisplay();


    startBtn.style.display="none";

    scannerBox.style.display="block";


    if(scanner){

        try{

            await scanner.clear();

        }catch(e){}

    }



    scanner = new Html5Qrcode("reader");

    isScanning = true;



    scanner.start(

        {
            facingMode:"environment"
        },


        {

            fps:10,


            qrbox:(width,height)=>{

                const size =
                Math.min(width,height)*0.65;


                return {

                    width:size,

                    height:size

                };

            },


            aspectRatio:1.0

        },


        scanSuccess,


        ()=>{}

    )
    .catch(error=>{


        console.error(error);


        result.textContent =
        "❌ カメラを起動できません";


        retryBtn.style.display="block";


    });


}



// =======================
// QR読み取り成功
// =======================

async function scanSuccess(text){


    if(isProcessing)
        return;


    isProcessing=true;


    try{


        await stopScanner();


        currentId=text;



        const snap =
        await getDoc(
            doc(db,collectionName,currentId)
        );



        // -----------------------
        // 存在しない場合
        // -----------------------

        if(!snap.exists()){


            const otherCollection =
            collectionName==="tickets_day1"
            ?"tickets_day2"
            :"tickets_day1";



            const otherSnap =
            await getDoc(
                doc(db,otherCollection,currentId)
            );



            if(otherSnap.exists()){


                if(collectionName==="tickets_day1"){

                    result.textContent =
                    "⚠️ これは2日目の整理券です";

                }else{

                    result.textContent =
                    "⚠️ これは1日目の整理券です";

                }


            }else{


                result.textContent =
                "❌ 整理券が見つかりません";


            }



            retryBtn.style.display="block";

            return;

        }




        // -----------------------
        // チケット表示
        // -----------------------

        const data=snap.data();



        result.innerHTML=`

        No.
        <span>${data.number}</span>

        <br>

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


        isProcessing=false;


    }


}




// =======================
// 状態表示
// =======================

function statusText(status){


    switch(status){


        case "waiting":
            return "受付前";


        case "before":
            return "入場前";


        case "entered":
            return "入場済み";


        default:
            return "不明";


    }


}



// =======================
// ボタン表示
// =======================

function showActions(status){


    actions.style.display="block";


    action1.style.display="block";

    action2.style.display="block";



    switch(status){


        case "waiting":


            action1.textContent=
            "受付済みにする";


            action2.style.display="none";


            action1.onclick=()=>{

                updateStatus("before");

            };


            break;




        case "before":


            action1.textContent=
            "入場済みにする";


            action2.textContent=
            "受付前に戻す";



            action1.onclick=()=>{

                updateStatus("entered");

            };



            action2.onclick=()=>{

                updateStatus("waiting");

            };


            break;




        case "entered":


            action1.textContent=
            "入場前に戻す";


            action2.textContent=
            "受付前に戻す";



            action1.onclick=()=>{

                updateStatus("before");

            };



            action2.onclick=()=>{

                updateStatus("waiting");

            };


            break;


    }


}



// =======================
// 状態更新
// =======================

async function updateStatus(nextStatus){


    try{


        await updateDoc(

            doc(
                db,
                collectionName,
                currentId
            ),

            {

                status:nextStatus

            }

        );



        result.innerHTML=
        "✅ 更新しました";



        actions.style.display="none";



        setTimeout(()=>{

            reset();

        },1000);



    }
    catch(e){


        console.error(e);


        result.textContent=
        "❌ 更新失敗";


        retryBtn.style.display="block";


    }


}



// =======================
// カメラ停止
// =======================

async function stopScanner(){


    if(scanner && isScanning){


        try{

            await scanner.stop();

        }catch(e){}



        try{

            await scanner.clear();

        }catch(e){}



        isScanning=false;


    }



}



// =======================
// リセット
// =======================

async function reset(){


    await stopScanner();



    scanner=null;


    currentId=null;



    scannerBox.style.display="none";


    actions.style.display="none";


    retryBtn.style.display="none";


    startBtn.style.display="block";


    result.textContent=
    "QRコードを読み取ってください";


}



// =======================
// 表示だけリセット
// =======================

function resetDisplay(){


    actions.style.display="none";


    retryBtn.style.display="none";


    result.textContent=
    "QRコードを読み取ってください";


}



// =======================
// ボタン
// =======================

cancelBtn.onclick=()=>{

    reset();

};



retryBtn.onclick=()=>{


    reset();

    setTimeout(()=>{

        startScanner();

    },200);


};
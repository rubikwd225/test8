// =======================
// Firebase
// =======================

import { db } from "./firebase.js";

import {
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";



// =======================
// 要素取得
// =======================

const startBtn =
document.getElementById("startBtn");

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



// =======================
// 設定
// =======================

let collectionName =
"tickets_day1";

let scanner = null;

let currentId = null;

let isScanning = false;



// =======================
// 日付変更
// =======================

document
.querySelectorAll('input[name="day"]')
.forEach(radio => {


    radio.addEventListener(
        "change",
        ()=>{

            collectionName =
            radio.value;

        }
    );


});




// =======================
// スキャン開始
// =======================

startBtn.onclick = () => {

    startScanner();

};




// =======================
// QRスキャン
// =======================

async function startScanner(){


    startBtn.style.display =
    "none";


    actions.style.display =
    "none";


    retryBtn.style.display =
    "none";


    result.style.display =
    "none";


    reader.style.display =
    "block";



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

            qrbox:220
        },


        qrSuccess,


        ()=>{}

    );


}





// =======================
// QR成功
// =======================

async function qrSuccess(text){


    if(isScanning)
    return;


    isScanning=true;



    try{


        await scanner.stop();

        await scanner.clear();


        scanner=null;


        reader.style.display =
        "none";


        result.style.display =
        "block";



        currentId =
        text;



        const ref =
        doc(
            db,
            collectionName,
            currentId
        );



        const snap =
        await getDoc(ref);



        if(!snap.exists()){


            result.textContent =
            "❌ 整理券が見つかりません";


            retryBtn.style.display =
            "block";


            return;

        }



        const data =
        snap.data();



        result.innerHTML = `

        No.${data.number}

        <br><br>

        現在：
        ${convertStatus(data.status)}

        `;



        showActions(data.status);



    }
    catch(e){


        console.error(e);


        result.textContent =
        "❌ 読み取りエラー";


        retryBtn.style.display =
        "block";


    }
    finally{


        isScanning=false;


    }


}





// =======================
// 状態文字変換
// =======================

function convertStatus(status){


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


    actions.style.display =
    "block";



    // 完全リセット

    action1.style.display =
    "block";

    action2.style.display =
    "block";



    action1.textContent =
    "";

    action2.textContent =
    "";



    // 余白固定

    action1.style.marginBottom =
    "12px";

    action2.style.marginBottom =
    "12px";



    // イベント解除

    action1.onclick = null;

    action2.onclick = null;





    switch(status){



        // 受付前

        case "waiting":



            action1.textContent =
            "受付済みにする";



            action2.style.display =
            "none";



            action1.onclick = ()=>{


                updateStatus(
                    "before"
                );


            };


            break;







        // 入場前

        case "before":



            action1.textContent =
            "入場済みにする";



            action2.textContent =
            "受付前に戻す";



            action1.onclick = ()=>{


                updateStatus(
                    "entered"
                );


            };



            action2.onclick = ()=>{


                updateStatus(
                    "waiting"
                );


            };



            break;








        // 入場済み

        case "entered":



            action1.textContent =
            "入場前に戻す";



            action2.textContent =
            "受付前に戻す";



            action1.onclick = ()=>{


                updateStatus(
                    "before"
                );


            };



            action2.onclick = ()=>{


                updateStatus(
                    "waiting"
                );


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

                status:
                nextStatus

            }


        );



        actions.style.display =
        "none";



        result.innerHTML =
        "✅ 更新しました";



        retryBtn.style.display =
        "none";



        setTimeout(()=>{


            reset();


        },1000);




    }
    catch(e){



        console.error(e);



        result.innerHTML =
        "❌ 更新失敗";



        retryBtn.style.display =
        "block";


    }



}








// =======================
// リセット
// =======================

async function reset(){



    currentId =
    null;



    actions.style.display =
    "none";



    retryBtn.style.display =
    "none";



    result.style.display =
    "block";



    result.textContent =
    "QRコードを読み取ってください";



    startBtn.style.display =
    "block";



    reader.style.display =
    "none";



    if(scanner){


        try{

            await scanner.clear();

        }
        catch{}



        scanner=null;


    }


}








// =======================
// キャンセル
// =======================

cancelBtn.onclick = ()=>{


    reset();


};








// =======================
// もう一度スキャン
// =======================

retryBtn.onclick = ()=>{


    reset();


    setTimeout(()=>{


        startScanner();


    },100);



};

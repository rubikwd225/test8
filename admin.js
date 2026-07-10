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
// 要素
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
// 変数
// =======================

let collectionName =
"tickets_day1";


let scanner =
null;


let currentId =
null;


let scanning =
false;






// =======================
// 日付変更
// =======================

document
.querySelectorAll('input[name="day"]')
.forEach(input=>{


    input.addEventListener(
        "change",
        ()=>{

            collectionName =
            input.value;

        }
    );


});








// =======================
// スキャン開始
// =======================

startBtn.onclick = ()=>{


    startScanner();


};







async function startScanner(){



    if(scanning)
    return;



    scanning=true;



    startBtn.style.display =
    "none";


    result.style.display =
    "none";


    actions.style.display =
    "none";


    retryBtn.style.display =
    "none";



    // カメラ表示

    reader.style.visibility =
    "visible";


    reader.style.height =
    "340px";






    scanner =
    new Html5Qrcode("reader");





    try{


        await scanner.start(

            {
                facingMode:
                "environment"
            },


            {

                fps:10,

                qrbox:220

            },


            qrSuccess,


            ()=>{}


        );



    }
    catch(e){


        console.error(e);



        finishCamera();



        result.style.display =
        "block";


        result.textContent =
        "❌ カメラを起動できません";


        retryBtn.style.display =
        "block";


    }



}








// =======================
// QR成功
// =======================

async function qrSuccess(text){



    if(!scanning)
    return;



    scanning=false;




    try{


        await scanner.stop();


        await scanner.clear();



        scanner=null;




        finishCamera();




        result.style.display =
        "block";



        currentId =
        text;





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
        ${statusText(data.status)}

        `;





        showActions(data.status);



    }
    catch(e){


        console.error(e);


        finishCamera();


        result.style.display =
        "block";


        result.textContent =
        "❌ 読み取りエラー";


        retryBtn.style.display =
        "block";


    }


}






function finishCamera(){


    reader.style.visibility =
    "hidden";


    reader.style.height =
    "0";


}







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



    action1.onclick =
    null;


    action2.onclick =
    null;



    // 隙間固定

    action1.style.marginBottom =
    "12px";


    action2.style.marginBottom =
    "12px";





    switch(status){



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


    startBtn.style.display =
    "block";



    result.style.display =
    "block";


    result.textContent =
    "QRコードを読み取ってください";



    finishCamera();





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
// 再スキャン
// =======================

retryBtn.onclick = ()=>{


    reset();


    setTimeout(()=>{


        startScanner();


    },200);


};
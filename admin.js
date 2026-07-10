import { db } from "./firebase.js";

import {
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const reader = document.getElementById("reader");
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
let scanning = false;

dayRadios.forEach(radio=>{

    radio.addEventListener("change",()=>{

        collectionName = radio.value;

    });

});

startBtn.onclick = ()=>{

    startScanner();

};

async function startScanner(){

    if(scanning) return;

    scanning = true;

    reader.innerHTML = "";

    startBtn.style.display = "none";
    result.style.display = "none";
    actions.style.display = "none";
    retryBtn.style.display = "none";
    stopBtn.style.display = "block";

    const size = Math.min(window.innerWidth * 0.9,340);

    reader.style.width = size + "px";
    reader.style.height = size + "px";
    reader.style.visibility = "visible";

    scanner = new Html5Qrcode("reader");

    try{

        await scanner.start(

            {
                facingMode:"environment"
            },

            {

                fps:10,

                qrbox:(width,height)=>{

                    const box =
                    Math.floor(
                        Math.min(width,height)*0.65
                    );

                    return{

                        width:box,
                        height:box

                    };

                }

            },

            scanSuccess,

            ()=>{}

        );

    }
    catch(e){

        console.error(e);

        stopCamera();

        result.style.display = "block";
        result.textContent = "❌ カメラを起動できません";

        retryBtn.style.display = "block";

    }

}

async function scanSuccess(text){

    if(!scanning) return;

    scanning = false;

    try{

        await scanner.stop();
        await scanner.clear();

        scanner = null;

        stopCamera();

        result.style.display = "block";

        currentId = text;

        let snap = await getDoc(
            doc(db,collectionName,currentId)
        );

        if(!snap.exists()){

            const otherCollection =
            collectionName==="tickets_day1"
            ? "tickets_day2"
            : "tickets_day1";

            const otherSnap = await getDoc(
                doc(db,otherCollection,currentId)
            );

            if(otherSnap.exists()){

                result.textContent =
                collectionName==="tickets_day1"
                ? "⚠️これは2日目の整理券です"
                : "⚠️これは1日目の整理券です";

            }else{

                result.textContent =
                "❌整理券が見つかりません";

            }

            retryBtn.style.display = "block";

            return;

        }

        const data = snap.data();

        result.innerHTML = `
            No.<span>${data.number}</span><br><br>
            現在：${statusText(data.status)}
        `;

        showActions(data.status);

    }catch(e){

        console.error(e);

        stopCamera();

        result.style.display = "block";
        result.textContent = "❌ 読み取りエラー";

        retryBtn.style.display = "block";

    }

}
function stopCamera(){

    reader.innerHTML = "";

    reader.style.visibility = "hidden";

    reader.style.width = "0";

    reader.style.height = "0";

    stopBtn.style.display = "none";

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

function showActions(status){

    actions.style.display = "block";

    action1.style.display = "block";
    action2.style.display = "block";

    action1.textContent = "";
    action2.textContent = "";

    action1.onclick = null;
    action2.onclick = null;

    switch(status){

        case "waiting":

            action1.textContent = "受付済みにする";

            action2.style.display = "none";

            action1.onclick = ()=>{

                updateStatus("before");

            };

            break;

        case "before":

            action1.textContent = "入場済みにする";

            action2.textContent = "受付前に戻す";

            action1.onclick = ()=>{

                updateStatus("entered");

            };

            action2.onclick = ()=>{

                updateStatus("waiting");

            };

            break;

        case "entered":

            action1.textContent = "入場前に戻す";

            action2.textContent = "受付前に戻す";

            action1.onclick = ()=>{

                updateStatus("before");

            };

            action2.onclick = ()=>{

                updateStatus("waiting");

            };

            break;

    }

}
async function updateStatus(nextStatus){

    try{

        await updateDoc(

            doc(
                db,
                collectionName,
                currentId
            ),

            {
                status: nextStatus
            }

        );

        actions.style.display = "none";

        result.innerHTML = "✅ 更新しました";

        retryBtn.style.display = "none";

        setTimeout(()=>{

            reset();

        },1000);

    }
    catch(e){

        console.error(e);

        result.innerHTML = "❌ 更新に失敗しました";

        retryBtn.style.display = "block";

    }

}

async function reset(){

    currentId = null;

    scanning = false;

    if(scanner){

        try{
            await scanner.stop();
        }catch(e){}

        try{
            await scanner.clear();
        }catch(e){}

        scanner = null;

    }

    stopCamera();

    actions.style.display = "none";

    action1.style.display = "block";
    action2.style.display = "block";

    action1.textContent = "";
    action2.textContent = "";

    action1.onclick = null;
    action2.onclick = null;

    retryBtn.style.display = "none";

    startBtn.style.display = "block";

    result.style.display = "block";
    result.textContent = "QRコードを読み取ってください";

}

cancelBtn.onclick = ()=>{

    reset();

};

retryBtn.onclick = ()=>{

    reset();

    setTimeout(()=>{

        startScanner();

    },200);

};

stopBtn.onclick = async ()=>{

    scanning = false;

    if(scanner){

        try{
            await scanner.stop();
        }catch(e){}

        try{
            await scanner.clear();
        }catch(e){}

        scanner = null;

    }

    reset();

};
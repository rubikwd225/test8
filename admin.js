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

// =======================
// Variables
// =======================

// 前回選択した日を復元
let collectionName =
localStorage.getItem("selectedDay") ||
"tickets_day1";

let scanner = null;
let currentId = null;
let scanning = false;

// =======================
// Day Select
// =======================

dayRadios.forEach(radio=>{

    if(radio.value===collectionName){

        radio.checked=true;

    }

    radio.addEventListener("change",()=>{

        collectionName=radio.value;

        localStorage.setItem(
            "selectedDay",
            collectionName
        );

    });

});

// =======================
// Start
// =======================

startBtn.onclick=()=>{

    startScanner();

};

async function startScanner(){

    if(scanning)return;

    scanning=true;

    reader.innerHTML="";

    actions.style.display="none";
    retryBtn.style.display="none";

    result.style.display="none";

    startBtn.style.display="none";
    stopBtn.style.display="block";

    const size=Math.min(
        window.innerWidth*0.9,
        340
    );

    reader.style.display="block";
    reader.style.visibility="visible";
    reader.style.width=size+"px";
    reader.style.height=size+"px";

    scanner=new Html5Qrcode("reader");

    try{

        await scanner.start(

            {
                facingMode:"environment"
            },

            {

                fps:10,

                qrbox:(w,h)=>{

                    const s=Math.floor(
                        Math.min(w,h)*0.65
                    );

                    return{

                        width:s,
                        height:s

                    };

                }

            },

            scanSuccess,

            ()=>{}

        );

    }
    catch(e){

        console.error(e);

        scanning=false;

        await closeCamera();

        result.style.display="block";

        result.textContent=
        "❌ カメラを起動できません";

        retryBtn.style.display="block";

    }

}

async function closeCamera(){

    if(scanner){

        try{

            await scanner.stop();

        }catch{}

        try{

            await scanner.clear();

        }catch{}

        scanner=null;

    }

    reader.innerHTML="";

    reader.style.display="none";
    reader.style.visibility="hidden";
    reader.style.width="0";
    reader.style.height="0";

    stopBtn.style.display="none";

    scanning=false;

}

// =======================
// QR Success
// =======================

async function scanSuccess(text){

    if(!scanning) return;

    scanning = false;

    await closeCamera();

    result.style.display = "block";

    currentId = text;

    try{

        let snap = await getDoc(
            doc(
                db,
                collectionName,
                currentId
            )
        );

        // 選択した日のコレクションに無い
        if(!snap.exists()){

            const otherCollection =
                collectionName === "tickets_day1"
                ? "tickets_day2"
                : "tickets_day1";

            const otherSnap = await getDoc(
                doc(
                    db,
                    otherCollection,
                    currentId
                )
            );

            if(otherSnap.exists()){

                result.innerHTML =
                    collectionName === "tickets_day1"
                    ? "⚠️ このQRコードは<br><b>2日目</b>の整理券です"
                    : "⚠️ このQRコードは<br><b>1日目</b>の整理券です";

            }else{

                result.innerHTML =
                    "❌ 整理券が見つかりません";

            }

            retryBtn.style.display = "block";
            startBtn.style.display = "block";

            return;

        }

        const data = snap.data();

        result.innerHTML = `
            <div style="font-size:42px;font-weight:bold;">
                No.${data.number}
            </div>

            <br>

            現在：<b>${statusText(data.status)}</b>
        `;

        showActions(data.status);

    }
    catch(e){

        console.error(e);

        result.innerHTML =
            "❌ 読み取りエラー";

        retryBtn.style.display = "block";
        startBtn.style.display = "block";

    }

}

// =======================
// Status Text
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
// Action Buttons
// =======================

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

            action1.onclick = () => updateStatus("before");

            break;

        case "before":

            action1.textContent = "入場済みにする";
            action2.textContent = "受付前に戻す";

            action1.onclick = () => updateStatus("entered");
            action2.onclick = () => updateStatus("waiting");

            break;

        case "entered":

            action1.textContent = "入場前に戻す";
            action2.textContent = "受付前に戻す";

            action1.onclick = () => updateStatus("before");
            action2.onclick = () => updateStatus("waiting");

            break;

    }

}

// =======================
// Update Status
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
                status: nextStatus
            }
        );

        actions.style.display = "none";

        result.innerHTML =
            "✅ 更新しました";

        setTimeout(async()=>{

            await reset();

        },1000);

    }
    catch(e){

        console.error(e);

        result.innerHTML =
            "❌ 更新失敗";

        retryBtn.style.display = "block";

    }

}

// =======================
// Reset
// =======================

async function reset(){

    currentId = null;

    await closeCamera();

    actions.style.display = "none";

    action1.style.display = "block";
    action2.style.display = "block";

    action1.textContent = "";
    action2.textContent = "";

    action1.onclick = null;
    action2.onclick = null;

    retryBtn.style.display = "none";

    startBtn.style.display = "block";
    stopBtn.style.display = "none";

    result.style.display = "block";
    result.innerHTML =
        "QRコードを読み取ってください";

}

// =======================
// Buttons
// =======================

cancelBtn.onclick = async ()=>{

    await reset();

};

retryBtn.onclick = async ()=>{

    await reset();

    setTimeout(()=>{

        startScanner();

    },200);

};

stopBtn.onclick = async ()=>{

    await closeCamera();

    actions.style.display = "none";

    retryBtn.style.display = "none";

    startBtn.style.display = "block";

    result.style.display = "block";
    result.innerHTML =
        "QRコードを読み取ってください";

};
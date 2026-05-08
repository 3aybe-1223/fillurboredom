// script.js

const video = document.getElementById("video");
const canvas = document.getElementById("drawCanvas");
const ctx = canvas.getContext("2d");

const modeText = document.getElementById("modeText");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let lastX = null;
let lastY = null;

let brushColor = "#00ffee";
let brushSize = 5;

/* =========================
   Resize Canvas
========================= */

window.addEventListener("resize", ()=>{

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

});

/* =========================
   Camera Setup
========================= */

async function setupCamera(){

    const stream = await navigator.mediaDevices.getUserMedia({
        video:true,
        audio:false
    });

    video.srcObject = stream;
}

setupCamera();

/* =========================
   MediaPipe Hands
========================= */

const hands = new Hands({

    locateFile:(file)=>{
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }

});

hands.setOptions({

    maxNumHands:1,
    modelComplexity:1,

    minDetectionConfidence:0.7,
    minTrackingConfidence:0.7

});

/* =========================
   Hand Tracking
========================= */

hands.onResults((results)=>{

    if(results.multiHandLandmarks &&
       results.multiHandLandmarks.length > 0){

        const landmarks = results.multiHandLandmarks[0];

        /* =========================
           Finger Points
        ========================= */

        const thumbTip = landmarks[4];

        const indexTip = landmarks[8];
        const indexBase = landmarks[6];

        const middleTip = landmarks[12];
        const middleBase = landmarks[10];

        const ringTip = landmarks[16];
        const ringBase = landmarks[14];

        const pinkyTip = landmarks[20];
        const pinkyBase = landmarks[18];

        /* =========================
           Finger States
        ========================= */

        const indexUp = indexTip.y < indexBase.y;

        const middleUp = middleTip.y < middleBase.y;

        const ringUp = ringTip.y < ringBase.y;

        const pinkyUp = pinkyTip.y < pinkyBase.y;

        /* =========================
           Coordinates
        ========================= */

        const x = canvas.width - (indexTip.x * canvas.width);

        const y = indexTip.y * canvas.height;

        /* =========================
           GESTURES
        ========================= */

        // ☝ DRAW
        const drawGesture =
            indexUp &&
            !middleUp &&
            !ringUp &&
            !pinkyUp;

        // ✌ CLEAR
        const clearGesture =
            indexUp &&
            middleUp &&
            !ringUp &&
            !pinkyUp;

        // ✊ PAUSE
        const fistGesture =
            !indexUp &&
            !middleUp &&
            !ringUp &&
            !pinkyUp;

        // 🤟 BLUE MODE
        const blueGesture =
            indexUp &&
            !middleUp &&
            !ringUp &&
            pinkyUp;

        // ✋ RANDOM COLOR
        const openPalmGesture =
            indexUp &&
            middleUp &&
            ringUp &&
            pinkyUp;

        // 👍 PINK MODE
        const pinkGesture =
            thumbTip.y < landmarks[2].y &&
            !indexUp &&
            !middleUp &&
            !ringUp &&
            !pinkyUp;

        /* =========================
           PINK MODE
        ========================= */

        if(pinkGesture){

            brushColor = "#ff4fd8";

            modeText.innerText = "Mode: Pink 💖";

            lastX = null;
            lastY = null;

            return;
        }

        /* =========================
           BLUE MODE
        ========================= */

        if(blueGesture){

            brushColor = "#009dff";

            modeText.innerText = "Mode: Blue 💙";

            lastX = null;
            lastY = null;

            return;
        }

        /* =========================
           RANDOM COLOR
        ========================= */

        if(openPalmGesture){

            brushColor =
            `hsl(${Math.random()*360},100%,50%)`;

            modeText.innerText =
            "Mode: Random ✋";

            lastX = null;
            lastY = null;

            return;
        }

        /* =========================
           CLEAR CANVAS
        ========================= */

        if(clearGesture){

            ctx.clearRect(
                0,
                0,
                canvas.width,
                canvas.height
            );

            modeText.innerText =
            "Mode: Cleared ✨";

            lastX = null;
            lastY = null;

            return;
        }

        /* =========================
           PAUSE
        ========================= */

        if(fistGesture){

            modeText.innerText =
            "Mode: Paused ✊";

            lastX = null;
            lastY = null;

            return;
        }

        /* =========================
           DRAWING
        ========================= */

        if(drawGesture){

            modeText.innerText =
            "Mode: Drawing ☝";

            if(lastX !== null &&
               lastY !== null){

                ctx.beginPath();

                ctx.moveTo(lastX,lastY);

                ctx.lineTo(x,y);

                ctx.strokeStyle =
                brushColor;

                ctx.lineWidth =
                brushSize;

                ctx.lineCap =
                "round";

                ctx.lineJoin =
                "round";

                // Glow

                ctx.shadowColor =
                brushColor;

                ctx.shadowBlur = 20;

                ctx.stroke();
            }

            lastX = x;
            lastY = y;

            // Finger Dot

            ctx.beginPath();

            ctx.arc(
                x,
                y,
                5,
                0,
                Math.PI * 2
            );

            ctx.fillStyle =
            brushColor;

            ctx.fill();
        }

        else{

            lastX = null;
            lastY = null;
        }
    }

    else{

        lastX = null;
        lastY = null;
    }

});

/* =========================
   Start Camera
========================= */

const camera = new Camera(video, {

    onFrame: async ()=>{

        await hands.send({
            image:video
        });

    },

    width:1280,
    height:720

});

camera.start();
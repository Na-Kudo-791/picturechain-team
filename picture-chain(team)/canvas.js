const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
let drawing = false;
let isErasing = false;
let isFilling = false;

// DOM要素の取得
const colorPicker = document.getElementById('colorPicker');
const lineWidthInput = document.getElementById('lineWidth');
const clearBtn = document.getElementById('clearBtn');
const eraserBtn = document.getElementById('eraserBtn');
const drawBtn = document.getElementById('drawBtn');
const fillBtn = document.getElementById('fillBtn');
const undoBtn = document.getElementById('undoBtn');
const saveBtn = document.getElementById('saveBtn');
const min = document.getElementById("min");
const sec = document.getElementById("sec");

// 状態変数
// ★★★★★ ここを修正しました ★★★★★
// まず 'remainingTime' を試し、なければ 'timeLimit' から取得するように変更
let remainingTime = parseInt(localStorage.getItem('remainingTime')) || parseInt(localStorage.getItem('timeLimit')) || 0;
const undoStack = [];
let secret = localStorage.getItem('secretMode') === 'true';
let timer; // タイマーのIDを保持する変数

/*------------------ タイマー ------------------*/
function updateTimerDisplay() {
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  min.innerHTML = minutes < 10 ? '0' + minutes : minutes;
  sec.innerHTML = seconds < 10 ? '0' + seconds : seconds;
}

function countdown() {
  // 0秒になった瞬間に時間切れ処理をするため、チェックを <= 0 に変更
  if (remainingTime <= 0) {
    clearInterval(timer);
    alert("時間切れです！");
    window.location.href = 'result.html';
    return;
  }
  updateTimerDisplay();
  remainingTime--;

  // ここで残り時間をlocalStorageに保存し続ける
  localStorage.setItem('remainingTime', remainingTime);
}

// ページの読み込み時にタイマーを開始
function startTimer() {
    // 最初に表示を更新
    updateTimerDisplay();
    // 1秒ごとにカウントダウンを開始
    timer = setInterval(countdown, 1000);
}

startTimer();


// 目隠しモードの処理
if (secret) {
  const overlay = document.getElementById('blindOverlay');
  if (overlay) {
    overlay.style.display = 'block';
    console.log("目隠しモード：キャンバスが隠れています");
  }
}


/*------------------ 描画履歴 ------------------*/
function saveCanvasState() {
  undoStack.push(canvas.toDataURL());
  if (undoStack.length > 20) undoStack.shift(); // 最大20履歴まで
}

/*------------------ 描画処理 (変更なし) ------------------*/
canvas.addEventListener('mousedown', (e) => {
  if (isFilling) return;
  saveCanvasState();
  drawing = true;
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
});

canvas.addEventListener('mousemove', (e) => {
  if (drawing) {
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.strokeStyle = isErasing ? '#ffffff' : colorPicker.value;
    ctx.lineWidth = lineWidthInput.value;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
});

canvas.addEventListener('mouseup', () => { drawing = false; });
canvas.addEventListener('mouseleave', () => { drawing = false; });


/*------------------ クリック塗りつぶし (変更なし) ------------------*/
canvas.addEventListener('click', (e) => {
  if (!isFilling) return;
  saveCanvasState();
  const fillColor = hexToRGBA(colorPicker.value);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const startX = e.offsetX;
  const startY = e.offsetY;
  floodFill(imageData, startX, startY, fillColor);
  ctx.putImageData(imageData, 0, 0);
});

/*------------------ ボタン機能 (変更なし) ------------------*/
clearBtn.addEventListener('click', () => {
  saveCanvasState();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

eraserBtn.addEventListener('click', () => {
  isErasing = true; isFilling = false;
  eraserBtn.style.fontWeight = 'bold';
  drawBtn.style.fontWeight = 'normal';
  fillBtn.style.fontWeight = 'normal';
});

drawBtn.addEventListener('click', () => {
  isErasing = false; isFilling = false;
  drawBtn.style.fontWeight = 'bold';
  eraserBtn.style.fontWeight = 'normal';
  fillBtn.style.fontWeight = 'normal';
});

fillBtn.addEventListener('click', () => {
  isFilling = !isFilling;
  drawBtn.style.fontWeight = 'normal';
  eraserBtn.style.fontWeight = 'normal';
  fillBtn.style.fontWeight = isFilling ? 'bold' : 'normal';
});

undoBtn.addEventListener('click', () => {
  if (undoStack.length === 0) {
    alert("やり直せる操作がありません");
    return;
  }
  const imageDataUrl = undoStack.pop();
  const img = new Image();
  img.src = imageDataUrl;
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };
});

/*------------------ 保存処理 (変更なし) ------------------*/
saveBtn.addEventListener('click', () => {
  const imageData = canvas.toDataURL('image/png');

  fetch('/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageData })
  })
  .then(response => {
    if (response.ok) {
      window.location.href = 'input_word.html';
    } else {
      alert('アップロードに失敗しました。');
    }
  })
  .catch(error => {
    console.error('アップロードエラー:', error);
    alert('通信エラーが発生しました。');
  });
});

/*------------------ ヘルパー関数 (変更なしのため省略) ------------------*/
function hexToRGBA(hex) {
  const r = parseInt(hex.substr(1, 2), 16);
  const g = parseInt(hex.substr(3, 2), 16);
  const b = parseInt(hex.substr(5, 2), 16);
  return [r, g, b, 255];
}

function floodFill(imageData, x, y, fillColor) {
  const { data, width, height } = imageData;
  const startIdx = (y * width + x) * 4;
  const targetColor = data.slice(startIdx, startIdx + 4);
  if (targetColor.every((val, i) => val === fillColor[i])) return;
  const matchColor = (i) => targetColor.every((val, offset) => data[i + offset] === val);
  const setColor = (i) => fillColor.forEach((val, offset) => data[i + offset] = val);
  const stack = [startIdx];
  const visited = new Uint8Array(width * height);
  while (stack.length) {
    const idx = stack.pop();
    if (!matchColor(idx)) continue;
    const px = (idx / 4) % width;
    const py = Math.floor((idx / 4) / width);
    if (visited[py * width + px]) continue;
    setColor(idx);
    visited[py * width + px] = 1;
    [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(([dx, dy]) => {
      const nx = px + dx, ny = py + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = (ny * width + nx) * 4;
        if (matchColor(nIdx)) stack.push(nIdx);
      }
    });
  }
}

 window.addEventListener('DOMContentLoaded', () => {
    const nextCharText = document.getElementById("nextCharText");
    const nextChar = localStorage.getItem("lastChar");

    if (nextChar) {
        nextCharText.textContent = `次の文字は「${nextChar}」`;
    }
});
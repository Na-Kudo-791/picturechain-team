// DOMの読み込みが完了してからスクリプトを実行
window.addEventListener('DOMContentLoaded', () => {

    const drawingDisplay = document.getElementById('drawingDisplay');

    // サーバーに最新の画像データをリクエストする
    fetch('/api/get-latest-image')
      .then(response => {
        if (!response.ok) return null;
        return response.json();
      })
      .then(data => {
        // データがあれば画像を表示する
        if (data && data.image) {
          drawingDisplay.src = data.image;
          drawingDisplay.style.display = 'block'; // noneからblockに変更して表示
        }
      })
      .catch(error => {
        console.error('画像の取得中にエラーが発生しました:', error);
      });

      
    // DOM要素の取得
    const checkButton = document.getElementById("checkButton");
    const answerText = document.getElementById("answerText");
    const min = document.getElementById("min");
    const sec = document.getElementById("sec");

    // 状態変数
    let answerCount = 1;
    const answers = {};
    let timer; // タイマーのIDを保持する変数

    // ★★★★★ localStorageから残り時間を取得してタイマーを初期化 ★★★★★
    let remainingTime = parseInt(localStorage.getItem('remainingTime')) || 0;


    /*------------------ タイマー ------------------*/
    function updateTimerDisplay() {
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        min.innerHTML = minutes < 10 ? '0' + minutes : minutes;
        sec.innerHTML = seconds < 10 ? '0' + seconds : seconds;
    }

    function countdown() {
        if (remainingTime <= 0) {
            clearInterval(timer);
            alert("時間切れです！");
            window.location.href = 'result.html';
            return;
        }
        updateTimerDisplay();
        remainingTime--;

        // このページでも残り時間を保存し続ける
        localStorage.setItem('remainingTime', remainingTime);
    }
    
    // ページ読み込み時にタイマーを開始
    function startTimer() {
        updateTimerDisplay();
        timer = setInterval(countdown, 1000);
    }
    
    startTimer();


    /*------------------ 回答チェック処理 ------------------*/
    checkButton.addEventListener('click', () => {
        const text = answerText.value.trim();

        // ひらがなと伸ばし棒「ー」のみ許可（空文字NG）
        if (!text || !/^[ぁ-んー]+$/.test(text)) {
            alert("ひらがなのみが入力可能です");
            return;
        }

        // 入力を保存 (この部分は必要に応じて調整してください)
        answers["answer" + answerCount] = text;
        answerCount++;

        const lastChar = text.charAt(text.length - 1);
        if (lastChar === "ん") {
            // タイマーを止めてから画面遷移
            clearInterval(timer);
            window.location.href = "gameover.html";
        } else {
            // タイマーは次のページに引き継がれる
            window.location.href = "prediction.html";
        }
    });

});

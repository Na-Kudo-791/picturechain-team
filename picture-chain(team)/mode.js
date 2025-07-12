function confirmSettings() {
    const minutes = parseInt(document.getElementById('minutesInput').value) || 0;
    const seconds = parseInt(document.getElementById('secondsInput').value) || 0;
    const totalSeconds = minutes * 60 + seconds;
    const secretEnabled = document.getElementById('secret-toggle').checked;

    if (totalSeconds <= 0) {
        alert("1秒以上の時間を入力してください");
        return;
    }

    // localStorage に保存
    localStorage.setItem('timeLimit', totalSeconds);
    localStorage.setItem('secretMode', secretEnabled);

    // uploads の初期化リクエストを送ってから遷移
    fetch('/start', { method: 'POST' })
        .then(response => {
            if (!response.ok) {
                throw new Error('初期化リクエストに失敗しました');
            }
            // 成功したらゲーム画面に遷移
            window.location.href = 'canvas0.html';
        })
        .catch(error => {
            console.error('初期化エラー:', error);
            alert('ゲームの開始に失敗しました。ページをリロードして再試行してください。');
        });
}

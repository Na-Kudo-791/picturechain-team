window.addEventListener('DOMContentLoaded', () => {
  const gallery = document.getElementById('gallery');
  const imagePreview = document.getElementById('imagePreview');

  // 画像をクリックしたときに拡大表示する関数
  const showEnlargedImage = (src) => {
    // 既存の内容をクリア
    imagePreview.innerHTML = '';
    
    const enlargedImg = document.createElement('img');
    enlargedImg.src = src;
    imagePreview.appendChild(enlargedImg);
  };

  fetch('/images')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(files => {
      if (!files || files.length === 0) {
        gallery.innerHTML = '<p>画像がありません。</p>';
        return;
      }

      files.forEach(filename => {
        const img = document.createElement('img');
        const imagePath = `/uploads/${filename}`;
        img.src = imagePath;
        img.className = 'thumbnail';
        img.alt = filename; // alt属性を追加
        
        // 画像の読み込み失敗時の処理
        img.onerror = () => {
          console.error('画像の読み込みに失敗しました:', img.src);
          img.style.display = 'none'; // 失敗した画像は非表示にする
        };

        // サムネイル画像がクリックされた時のイベントリスナーを追加
        img.addEventListener('click', () => {
          showEnlargedImage(imagePath);
        });

        gallery.appendChild(img);
      });

      // 最初に一番最初の画像を拡大表示しておく
      if (files.length > 0) {
          showEnlargedImage(`/uploads/${files[0]}`);
      }
    })
    .catch(err => {
      console.error('画像の取得エラー:', err);
      gallery.innerHTML = '<p>画像の取得に失敗しました。</p>';
    });
});

// ボタンのイベントリスナー
document.getElementById('btnBack').addEventListener('click', () => {
  window.location.href = 'title.html';
});

document.getElementById('modeBack').addEventListener('click', () => {
  window.location.href = 'mode.html';
});

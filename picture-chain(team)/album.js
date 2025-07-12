// DOMの読み込みが完了してからスクリプトを実行
window.addEventListener('DOMContentLoaded', () => {
    const albumsContainer = document.getElementById('albums');
    const imagePreview = document.getElementById('imagePreview');
    const backBtn = document.getElementById('backBtn'); // ボタン要素を取得

    // 画像をクリックしたときに拡大表示する関数
    const showEnlargedImage = (src) => {
        imagePreview.innerHTML = ''; // 既存の内容をクリア
        const enlargedImg = document.createElement('img');
        enlargedImg.src = src;
        imagePreview.appendChild(enlargedImg);
    };

    // アルバムデータを非同期で読み込む関数
    async function loadAlbum() {
        try {
            // 1. uploadsフォルダの画像をbackupsへ移動
            const resArchive = await fetch('/archive-uploads', { method: 'POST' });
            if (!resArchive.ok) throw new Error('アーカイブに失敗しました');
            console.log('✅ uploadsフォルダの画像をbackupsに移動しました');

            // 2. backups内のアルバム情報を取得
            const resBackups = await fetch('/backup-images');
            if (!resBackups.ok) throw new Error('バックアップ画像の取得に失敗しました');
            const groups = await resBackups.json();
            
            albumsContainer.innerHTML = ''; // 表示をクリア

            const folders = Object.keys(groups).reverse(); // 新しいアルバムが上に来るように逆順に

            if (folders.length === 0) {
                albumsContainer.innerHTML = '<p>アルバムがありません。</p>';
                return;
            }

            // アルバムを一つずつ生成
            folders.forEach((folder) => {
                const albumDiv = document.createElement('div');
                albumDiv.className = 'album-group';

                const title = document.createElement('div');
                title.className = 'album-title';
                title.contentEditable = true; // タイトルを編集可能に
                title.textContent = `アルバム ${folder}`;
                albumDiv.appendChild(title);

                const imageListDiv = document.createElement('div');
                imageListDiv.className = 'image-list';

                // 各アルバム内の画像を生成
                groups[folder].forEach(filename => {
                    const img = document.createElement('img');
                    const imagePath = `/backups/${folder}/${filename}`;
                    img.src = imagePath;
                    img.className = 'thumbnail';

                    // サムネイルクリックで拡大表示
                    img.addEventListener('click', () => {
                        showEnlargedImage(imagePath);
                    });
                    
                    imageListDiv.appendChild(img);
                });

                albumDiv.appendChild(imageListDiv);
                albumsContainer.appendChild(albumDiv);
            });

            // 最初に一番新しいアルバムの一番最初の画像を拡大表示
            const firstAlbum = folders[0];
            if (firstAlbum && groups[firstAlbum].length > 0) {
                const firstImage = groups[firstAlbum][0];
                showEnlargedImage(`/backups/${firstAlbum}/${firstImage}`);
            }

        } catch (err) {
            console.error('エラー:', err);
            albumsContainer.innerHTML = `<p>アルバムの読み込みに失敗しました: ${err.message}</p>`;
        }
    }

    backBtn.addEventListener('click', () => {
        window.location.href = 'title.html';
    });

    // ページ読み込み時にアルバムを読み込む
    loadAlbum();
});

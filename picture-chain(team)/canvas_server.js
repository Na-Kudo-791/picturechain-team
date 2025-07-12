const express = require('express');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');

const app = express();
const PORT = process.env.PORT || 3000;

const uploadsDir = path.join(__dirname, 'uploads');
const backupsRoot = path.join(__dirname, 'backups');

// uploadsフォルダの存在確認と作成
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// JSONボディを扱う（画像送信のため）
app.use(express.json({ limit: '10mb' }));

// 静的ファイルを提供（css, js, html など）
app.use(express.static(__dirname));

// GET / → title.html を返す
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'title.html'));
});

// ゲーム開始API（uploadsをバックアップし新規作成）
app.post('/start', (req, res) => {
  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir).filter(file => path.extname(file).toLowerCase() === '.png');
    if (files.length > 0) {
      if (!fs.existsSync(backupsRoot)) {
        fs.mkdirSync(backupsRoot);
      }
      const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
      const backupDir = path.join(backupsRoot, timestamp);
      fs.mkdirSync(backupDir);

      for (const file of files) {
        const src = path.join(uploadsDir, file);
        const dest = path.join(backupDir, file);
        fs.renameSync(src, dest);
      }
      console.log(`📦 バックアップ完了: ${backupDir}`);
    } else {
      console.log('uploadsフォルダにPNGファイルがありません。バックアップスキップ。');
    }

    // uploadsフォルダは空でも削除して再作成（必要な場合のみ）
    fs.rmSync(uploadsDir, { recursive: true, force: true });
    fs.mkdirSync(uploadsDir);
    console.log('📁 uploads フォルダを再作成しました');
  } else {
    // uploadsフォルダが存在しない場合は作成だけ
    fs.mkdirSync(uploadsDir);
    console.log('📁 uploads フォルダを作成しました');
  }

  res.status(200).send('ゲームを開始しました。uploadsを初期化し、必要に応じてバックアップしました。');
});

// 画像一覧取得API（uploadsフォルダ内）
app.get('/images', (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      console.error('画像一覧読み込みエラー:', err);
      return res.status(500).json({ error: '画像一覧の読み込みに失敗しました。' });
    }
    const pngFiles = files.filter(file => path.extname(file).toLowerCase() === '.png');
    res.json(pngFiles);
  });
});

// 画像アップロードAPI
app.post('/upload', (req, res) => {
  const { image } = req.body;
  if (!image || !image.startsWith('data:image/png;base64,')) {
    return res.status(400).send('無効な画像データです。');
  }
  const base64Data = image.replace(/^data:image\/png;base64,/, '');
  const filename = `drawing_${Date.now()}.png`;
  const filepath = path.join(uploadsDir, filename);

  fs.writeFile(filepath, base64Data, 'base64', err => {
    if (err) {
      console.error('保存エラー:', err);
      return res.status(500).send('保存失敗');
    }
    console.log(`✅ 保存成功: ${filename}`);
    res.status(200).send('アップロード成功');
  });
});

app.get('/api/get-latest-image', (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      console.error('最新画像の読み込みエラー:', err);
      return res.status(500).json({ error: '画像の読み込みに失敗しました。' });
    }

    // .pngファイルのみをフィルタリング
    const pngFiles = files.filter(file => path.extname(file).toLowerCase() === '.png');

    // 画像が1枚もなければ、404エラーを返す
    if (pngFiles.length === 0) {
      return res.status(404).json({ message: '画像が見つかりません。' });
    }

    // ファイル名でソートして最新のファイルを取得（ファイル名が drawing_タイムスタンプ.png のため）
    pngFiles.sort();
    const latestFile = pngFiles[pngFiles.length - 1];
    const latestFilePath = path.join(uploadsDir, latestFile);

    // 最新の画像ファイルを読み込む
    fs.readFile(latestFilePath, (err, data) => {
      if (err) {
        console.error('最新画像のファイル読み込みエラー:', err);
        return res.status(500).json({ error: 'ファイルの読み込みに失敗しました。' });
      }

      // Base64形式に変換して、クライアントが要求するJSON形式で返す
      const base64Image = `data:image/png;base64,${data.toString('base64')}`;
      res.json({ image: base64Image });
    });
  });
});

// uploadsフォルダを静的配信
app.use('/uploads', express.static(uploadsDir));

// バックアップ画像一覧取得API
app.get('/backup-images', (req, res) => {
  const result = {};

  if (!fs.existsSync(backupsRoot)) {
    return res.json(result);
  }

  const folders = fs.readdirSync(backupsRoot, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const folder of folders) {
    const folderPath = path.join(backupsRoot, folder);
    const files = fs.readdirSync(folderPath)
      .filter(file => path.extname(file).toLowerCase() === '.png');
    if (files.length > 0) {  // 空フォルダは結果に含めない
      result[folder] = files;
    }
  }

  res.json(result);
});

// uploads → backups に移動するAPI（手動バックアップ用）
app.post('/archive-uploads', (req, res) => {
  try {
    if (!fs.existsSync(uploadsDir)) {
      return res.status(200).send('uploadsフォルダがありません。');
    }

    const files = fs.readdirSync(uploadsDir).filter(file => path.extname(file).toLowerCase() === '.png');

    if (files.length === 0) {
      return res.status(200).send('uploadsフォルダに画像がありません。');
    }

    if (!fs.existsSync(backupsRoot)) {
      fs.mkdirSync(backupsRoot);
    }

    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    const backupDir = path.join(backupsRoot, timestamp);
    fs.mkdirSync(backupDir);

    for (const file of files) {
      const src = path.join(uploadsDir, file);
      const dest = path.join(backupDir, file);
      fs.renameSync(src, dest);
    }

    console.log(`📦 バックアップ完了: ${backupDir}`);

    res.status(200).send('uploadsフォルダの画像をバックアップしました。');
  } catch (err) {
    console.error('バックアップ処理でエラー:', err);
    res.status(500).send('バックアップに失敗しました。');
  }
});

// backups フォルダを静的配信
app.use('/backups', express.static(backupsRoot));

// サーバー起動
app.listen(PORT, () => {
  console.log(`✅ サーバー起動: http://localhost:${PORT}`);
});

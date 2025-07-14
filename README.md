# 🎨 絵しりとり（制作中）

![badge](https://img.shields.io/badge/Node.js-%23339933?style=for-the-badge&logo=node.js&logoColor=white)
![badge](https://img.shields.io/badge/HTML5-%23E34F26?style=for-the-badge&logo=html5&logoColor=white)
![badge](https://img.shields.io/badge/CSS3-%231572B6?style=for-the-badge&logo=css3&logoColor=white)
![badge](https://img.shields.io/badge/JavaScript-%23F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

## 📝 概要

「絵しりとり」は、プレイヤーが交互に絵を描いて言葉をつなげていく、対戦型のしりとりゲームです。Node.jsとHTML5 Canvasを使い、複数人で遊べるよう設計されています。

### 🔁 ゲームの流れ
1. タイトル画面  
2. ルール説明画面  
3. モード選択画面（時間制限モード・目隠しモードなど）  
4. ゲームプレイ画面（キャンバス機能：ペン、消しゴム、塗りつぶし、クリア）  
5. プレイヤー①：お題をひらがなで入力  
6. プレイヤー②：絵を見て予想してひらがなで入力  
7. 上記を時間内でループ  
8. リザルト画面で全ての絵を表示  

📷 アルバム機能も搭載し、過去のプレイ記録を振り返ることができます。

---

## ⚙️ 使用技術

- Node.js  
- Express  
- date-fns  
- JavaScript / HTML5 / CSS3  
- HTML5 Canvas API

---

## 🚀 セットアップ方法

```bash
# 必要なパッケージをインストール
npm install express
npm install date-fns

# サーバー起動
node canvas_server.js

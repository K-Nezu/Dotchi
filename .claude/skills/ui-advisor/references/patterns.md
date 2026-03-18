# UIコンポーネント パターン集

Apple風ミニマルデザインの具体的なTailwindパターン。

## 目次
1. [ナビゲーション](#ナビゲーション)
2. [カード](#カード)
3. [フォーム](#フォーム)
4. [モーダル/ダイアログ](#モーダル)
5. [リスト](#リスト)
6. [空状態](#空状態)
7. [タブ](#タブ)
8. [トースト/通知](#トースト)

---

## ナビゲーション

### ヘッダー（推奨パターン）
```html
<header class="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
  <div class="max-w-2xl mx-auto flex items-center justify-between px-6 py-4">
    <span class="text-lg font-semibold tracking-tight">Logo</span>
    <nav class="flex items-center gap-6 text-sm text-gray-500">
      <a class="hover:text-gray-900 transition-colors">Link</a>
    </nav>
  </div>
</header>
```

ポイント:
- `bg-white/80 backdrop-blur-xl` でスクロール時にコンテンツが透ける
- `border-gray-100` で境界線はほぼ見えない程度
- `tracking-tight` でロゴの文字詰め

### ボトムナビ（モバイル）
```html
<nav class="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 pb-safe">
  <div class="flex justify-around py-2">
    <button class="flex flex-col items-center gap-1 px-3 py-2 text-gray-400">
      <IconHome class="w-5 h-5" />
      <span class="text-[10px]">ホーム</span>
    </button>
  </div>
</nav>
```

---

## カード

### 標準カード
```html
<div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
  <h3 class="text-base font-semibold text-gray-900">タイトル</h3>
  <p class="mt-2 text-sm text-gray-500 leading-relaxed">説明文</p>
</div>
```

### インタラクティブカード（クリック可能）
```html
<button class="w-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-left
  hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all duration-200">
  ...
</button>
```

### 画像カード
```html
<div class="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
  <div class="aspect-video relative">
    <img class="object-cover w-full h-full" />
  </div>
  <div class="p-6">
    <h3 class="font-semibold">タイトル</h3>
  </div>
</div>
```

---

## フォーム

### テキスト入力
```html
<div>
  <label class="block text-sm font-medium text-gray-700 mb-2">ラベル</label>
  <input class="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm
    placeholder:text-gray-400
    focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
    transition-all" />
</div>
```

### テキストエリア
```html
<textarea class="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none
  placeholder:text-gray-400
  focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
  transition-all" rows="4" />
```

### セレクト／トグル
```html
<div class="flex bg-gray-100 rounded-full p-1">
  <button class="flex-1 py-2 px-4 rounded-full text-sm font-medium
    bg-white text-gray-900 shadow-sm">選択中</button>
  <button class="flex-1 py-2 px-4 rounded-full text-sm font-medium
    text-gray-500 hover:text-gray-700">未選択</button>
</div>
```

---

## モーダル

```html
<!-- オーバーレイ -->
<div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
<!-- ダイアログ -->
<div class="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50
  bg-white rounded-3xl p-8 shadow-xl max-w-md mx-auto">
  <h2 class="text-xl font-semibold">タイトル</h2>
  <p class="mt-3 text-sm text-gray-500">説明</p>
  <div class="mt-8 flex gap-3">
    <button class="flex-1 py-3 rounded-full border border-gray-200 text-sm font-medium
      hover:bg-gray-50 transition-colors">キャンセル</button>
    <button class="flex-1 py-3 rounded-full bg-blue-500 text-white text-sm font-medium
      hover:bg-blue-600 transition-colors">確認</button>
  </div>
</div>
```

---

## リスト

```html
<ul class="divide-y divide-gray-100">
  <li class="flex items-center gap-4 py-4 px-2">
    <div class="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0" />
    <div class="flex-1 min-w-0">
      <p class="text-sm font-medium text-gray-900 truncate">タイトル</p>
      <p class="text-xs text-gray-500">サブテキスト</p>
    </div>
    <span class="text-xs text-gray-400">3分前</span>
  </li>
</ul>
```

---

## 空状態

```html
<div class="flex flex-col items-center justify-center py-20 text-center">
  <div class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
    <IconPlus class="w-6 h-6 text-gray-400" />
  </div>
  <p class="text-base font-medium text-gray-900">まだ何もありません</p>
  <p class="mt-1 text-sm text-gray-500">最初のアイテムを追加しましょう</p>
  <button class="mt-6 px-6 py-3 rounded-full bg-blue-500 text-white text-sm font-medium
    hover:bg-blue-600 transition-colors">追加する</button>
</div>
```

---

## タブ

```html
<div class="flex gap-1 border-b border-gray-100">
  <button class="px-4 py-3 text-sm font-medium text-blue-500 border-b-2 border-blue-500">
    アクティブ
  </button>
  <button class="px-4 py-3 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors">
    非アクティブ
  </button>
</div>
```

---

## トースト

```html
<div class="fixed bottom-6 inset-x-0 flex justify-center z-50 pointer-events-none">
  <div class="bg-gray-900 text-white text-sm font-medium px-6 py-3 rounded-full shadow-lg
    pointer-events-auto animate-fade-in-up">
    保存しました
  </div>
</div>
```

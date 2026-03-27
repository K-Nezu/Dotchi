const ANIMALS: { name: string; emoji: string }[] = [
  { name: "うさぎ", emoji: "🐰" },
  { name: "カメ", emoji: "🐢" },
  { name: "パンダ", emoji: "🐼" },
  { name: "ペンギン", emoji: "🐧" },
  { name: "コアラ", emoji: "🐨" },
  { name: "キツネ", emoji: "🦊" },
  { name: "タヌキ", emoji: "🦝" },
  { name: "ネコ", emoji: "🐱" },
  { name: "イヌ", emoji: "🐶" },
  { name: "ハリネズミ", emoji: "🦔" },
  { name: "フクロウ", emoji: "🦉" },
  { name: "カワウソ", emoji: "🦦" },
  { name: "リス", emoji: "🐿️" },
  { name: "ヒヨコ", emoji: "🐥" },
  { name: "クマ", emoji: "🐻" },
  { name: "シカ", emoji: "🦌" },
  { name: "イルカ", emoji: "🐬" },
  { name: "ラッコ", emoji: "🦦" },
  { name: "アヒル", emoji: "🦆" },
  { name: "モモンガ", emoji: "🐿️" },
  { name: "ハムスター", emoji: "🐹" },
  { name: "カピバラ", emoji: "🦫" },
  { name: "アルパカ", emoji: "🦙" },
  { name: "レッサーパンダ", emoji: "🐾" },
];

const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#F7DC6F",
  "#BB8FCE",
  "#85C1E9",
  "#F0B27A",
  "#82E0AA",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getAnonymousName(postId: string): string {
  const index = hashString(postId) % ANIMALS.length;
  return `${ANIMALS[index].name}さん`;
}

export function getAnonymousEmoji(postId: string): string {
  const index = hashString(postId) % ANIMALS.length;
  return ANIMALS[index].emoji;
}

export function getAvatarColor(postId: string): string {
  const index = hashString(postId + "color") % COLORS.length;
  return COLORS[index];
}

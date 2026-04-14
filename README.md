# BrightWay CV Review — Deploy lên Vercel

## Cấu trúc
```
brightway-vercel/
├── api/
│   └── analyze.js        ← Backend gọi Gemini 2.5 Flash (no thinking)
├── public/
│   └── cv-review.html    ← Frontend
├── package.json
└── README.md
```

## Bước 1 — Lấy Gemini API key
Vào https://aistudio.google.com/apikey → Create API key → copy lại.

## Bước 2 — Push lên GitHub
```bash
cd brightway-vercel
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

## Bước 3 — Import vào Vercel
1. Vào https://vercel.com/new
2. Chọn repo vừa push → **Import**
3. Framework Preset: **Other** (giữ nguyên mặc định)
4. Trước khi bấm Deploy, mở **Environment Variables**:
   - Name: `GEMINI_API_KEY`
   - Value: dán key vừa lấy ở Bước 1
5. Bấm **Deploy**.

## Bước 4 — Truy cập
Sau khi deploy xong, Vercel cho bạn URL kiểu `https://brightway-xxx.vercel.app`.
Mở: `https://brightway-xxx.vercel.app/cv-review.html`

## Test nhanh backend
```bash
curl -X POST https://brightway-xxx.vercel.app/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Trả về JSON {\"ok\":true}"}'
```

## Cách đổi model / bật lại thinking
Trong `cv-review.html`, sửa body fetch:
```js
body: JSON.stringify({
  prompt,
  model: 'gemini-2.5-flash',   // hoặc 'gemini-2.5-pro'
  thinkingBudget: 0             // 0 = tắt; -1 = dynamic; >0 = số token suy nghĩ
})
```

## Chạy local (tùy chọn)
```bash
npm i -g vercel
vercel dev
```
Vercel CLI sẽ hỏi key → dán vào, rồi mở http://localhost:3000/cv-review.html

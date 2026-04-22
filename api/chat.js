/**
 * Vercel Serverless Function: POST /api/chat
 * ─────────────────────────────────────────────
 * File này phải nằm trong thư mục /api để Vercel tự nhận diện.
 */

import Anthropic from '@anthropic-ai/sdk';

// ══ Ép dùng Node runtime để req.body được parse tự động ══
export const config = {
  runtime: 'nodejs',
};

// ══ ANTHROPIC CLIENT ══
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ══ SYSTEM PROMPT ══
const SYSTEM_PROMPT = `Bạn là **trợ lý AI của BrightWay** — một người anh/chị mentor đồng hành cùng học sinh THPT Việt Nam trên hành trình tìm học bổng và chọn ngành đại học.

## 🎯 VAI TRÒ & NHIỆM VỤ
- Tư vấn học bổng, trường đại học, ngành học tại Việt Nam
- Hướng dẫn săn học bổng: bài luận, hoạt động ngoại khóa, IELTS/TOEFL, ĐGNL
- Giải thích cách dùng công cụ tra cứu trên website BrightWay
- Hỗ trợ 8 nhóm ngành: CNTT, Y tế, Truyền thông, Tài chính, Sư phạm, Môi trường & Bền vững, AI & Robotics, Biotech
- Dựa vào **CONTEXT** được cung cấp để trả lời cụ thể, chính xác

## 💬 PHONG CÁCH GIAO TIẾP
- **Xưng hô**: "mình" - "bạn" (như anh/chị lớn hơn vài tuổi, không kẻ cả)
- **Giọng điệu**: ấm áp, kiên nhẫn, khích lệ — như một mentor thực sự quan tâm
- **Ngôn ngữ**: Tiếng Việt tự nhiên, tránh cứng nhắc hay "AI-ish"
- Có thể dùng từ gần gũi: "nha", "nhé", "được không bạn" — nhưng tiết chế, không sến
- **KHÔNG** dùng emoji tràn lan (chỉ 1-2 emoji/câu trả lời nếu thực sự phù hợp, hoặc không dùng)

## 🛡️ 4 QUY TẮC CỐT LÕI (BẮT BUỘC TUÂN THỦ)

### 1. KHÔNG BỊA SỐ LIỆU — tuyệt đối
- Điểm chuẩn, GPA tối thiểu, học phí, tỷ lệ học bổng, deadline... **chỉ nói khi có trong CONTEXT**
- Nếu CONTEXT không có → nói thẳng: *"Số liệu cụ thể mình không có sẵn, bạn check website chính thức của trường nhé — thường là [tên trường].edu.vn"*
- Không dùng ngôn ngữ mơ hồ kiểu "khoảng 24-26 điểm" nếu không có nguồn
- Không phỏng đoán deadline, năm học, điều kiện xét tuyển

### 2. BÁM SÁT CONTEXT & PHẠM VI
- Ưu tiên TUYỆT ĐỐI thông tin từ CONTEXT khi có
- Câu hỏi ngoài phạm vi học bổng/đại học/định hướng nghề: trả lời ngắn (1-2 câu) rồi dẫn về chủ đề chính
- Ví dụ: *"Câu này hơi ngoài chuyên môn của mình, nhưng nếu bạn đang phân vân chọn ngành thì mình giúp được đó — bạn muốn khám phá hướng nào?"*
- KHÔNG tự sáng tạo thông tin về trường/ngành không có trong CONTEXT

### 3. LUÔN HƯỚNG VỀ CÔNG CỤ TRÊN WEB
Khi học sinh hỏi "trường nào phù hợp với em", "em nên chọn ngành gì", "làm sao biết em đủ điều kiện"... → **hướng dẫn họ dùng tool trên website**:
1. Kéo xuống section **"Ngành học phổ biến"** → click ngành quan tâm
2. Trang tự cuộn đến **"Công cụ tra cứu học bổng"**
3. Điền **GPA, điểm THPT, ĐGNL, IELTS** vào "Thông tin hồ sơ học sinh"
4. Chọn **khu vực đang sống** để ưu tiên trường gần
5. Bấm các nút **Giải thưởng, Ngoại khóa, Portfolio, Bài luận** nếu có
6. Làm **trắc nghiệm Holland RIASEC** để match tính cách với ngành
7. Hệ thống chia kết quả: ✅ **Phù hợp** (≥50% tiêu chí) và ⚠️ **Chưa đạt đủ**

### 4. AN TOÀN TÂM LÝ — rất quan trọng
Học sinh THPT thường áp lực về tương lai. Hãy:
- **Lắng nghe trước, tư vấn sau** — nếu bạn ấy lo lắng, thừa nhận cảm xúc trước ("Mình hiểu cảm giác đó, chọn ngành đúng là áp lực thật sự...")
- **Không so sánh** với bạn bè cùng trang lứa, không nói "bạn phải cố hơn"
- **Không phán xét** lựa chọn (dù là chọn nghề "ít hot" hay gap year)
- **Không gieo FOMO** kiểu "không nộp ngay sẽ hết cơ hội"
- Nếu phát hiện dấu hiệu **căng thẳng nặng** (mất ngủ kéo dài, tuyệt vọng, ý nghĩ tiêu cực): nhẹ nhàng khuyên chia sẻ với người thân/thầy cô, hoặc gọi **Tổng đài 111** (bảo vệ trẻ em) / **1900 599 958** (Ngày mai - sức khỏe tâm thần)
- Luôn để lại cảm giác: **"Có nhiều con đường, mình cùng tìm con đường hợp với bạn"**

## 📐 ĐỊNH DẠNG TRẢ LỜI

**Độ dài**: 3-6 câu cho câu thường, dài hơn nếu liệt kê trường/bước làm

**Cấu trúc gợi ý**:
- Câu hỏi đơn giản → trả lời thẳng, không cần heading
- Câu hỏi phức tạp (so sánh trường, hướng dẫn quy trình) → dùng:
  - **Heading** ngắn (in đậm) để chia ý: \`**Điểm mạnh:**\`, \`**Lưu ý:**\`
  - **Bullet** (\`-\` hoặc \`•\`) khi liệt kê từ 3 mục trở lên
  - **Bold** cho: tên trường, số liệu quan trọng, deadline, từ khóa chính

**Khi gợi ý trường từ CONTEXT** — format như sau:
\`\`\`
**[Tên trường]** — [Ngành]
- GPA yêu cầu: [số]
- Học bổng: [mức/loại]
- Điểm nổi bật: [1 câu ngắn]
\`\`\`

## ❓ GỢI Ý FOLLOW-UP
**Kết mỗi câu trả lời** bằng 1 gợi ý câu hỏi tiếp theo (trừ khi học sinh vừa chào tạm biệt hoặc đang tâm sự cảm xúc — lúc đó ưu tiên sự ấm áp).

Format: xuống 1 dòng trống, rồi:
> 💡 *Bạn có muốn mình [gợi ý hành động cụ thể] không?*

Ví dụ:
- *"Bạn muốn mình so sánh 2 trường này chi tiết hơn không?"*
- *"Mình có thể hướng dẫn bạn cách viết mở bài luận xin học bổng — bạn quan tâm không?"*
- *"Bạn thử làm trắc nghiệm Holland RIASEC trên web trước rồi mình giúp phân tích kết quả nhé?"*

## ✅ CHECKLIST TRƯỚC KHI GỬI CÂU TRẢ LỜI
1. Có số liệu nào mình đang **đoán** không? → Xóa, thay bằng "bạn check website chính thức"
2. Có nằm trong phạm vi học bổng/ngành/trường không? → Nếu không, dẫn về đúng chủ đề
3. Giọng văn có **ấm áp** không? Có đang vô tình **gây áp lực** không?
4. Đã có **follow-up** ở cuối chưa (trừ trường hợp đặc biệt)?`;

// ══ RATE LIMIT đơn giản trong memory (có dọn rác để không rò rỉ giữa các request cùng instance) ══
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQ   = 15;

function checkRateLimit(ip){
  const now = Date.now();

  // Dọn rác: xoá các entry đã hết hạn để Map không phình to giữa các invocation
  if (rateLimitMap.size > 500){
    for (const [key, val] of rateLimitMap){
      if (val.resetAt < now) rateLimitMap.delete(key);
    }
  }

  const entry = rateLimitMap.get(ip);
  if (!entry || entry.resetAt < now){
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= RATE_LIMIT_MAX_REQ;
}

// ══ HANDLER chính ══
export default async function handler(req, res){
  // CORS headers
  const allowed = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');

  // ✨ CHỐNG CACHE — quan trọng nhất: Vercel/CDN/browser không được cache response này
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Preflight
  if (req.method === 'OPTIONS'){
    return res.status(204).end();
  }
  if (req.method !== 'POST'){
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limit theo IP
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
             req.headers['x-real-ip'] || 'unknown';
  if (!checkRateLimit(ip)){
    return res.status(429).json({ error: 'Bạn gửi quá nhanh, thử lại sau ít giây.' });
  }

  try {
    // ✨ Parse body thủ công nếu req.body chưa có (phòng trường hợp Vercel không auto-parse)
    let body = req.body;
    if (!body || typeof body === 'string'){
      if (typeof body === 'string'){
        try { body = JSON.parse(body); } catch { body = {}; }
      } else {
        // Stream → đọc raw
        body = await new Promise((resolve, reject) => {
          let data = '';
          req.on('data', chunk => { data += chunk; });
          req.on('end', () => {
            try { resolve(data ? JSON.parse(data) : {}); }
            catch (e) { reject(e); }
          });
          req.on('error', reject);
        });
      }
    }

    const { messages, context, currentTab } = body || {};

    // Validate
    if (!Array.isArray(messages) || messages.length === 0){
      return res.status(400).json({ error: 'Thiếu messages trong request' });
    }
    if (messages.length > 20){
      return res.status(400).json({ error: 'Quá nhiều tin nhắn, hãy tạo phiên mới' });
    }
    const invalidMsg = messages.some(m =>
      !m || typeof m.content !== 'string' ||
      (m.role !== 'user' && m.role !== 'assistant') ||
      m.content.length > 4000
    );
    if (invalidMsg){
      return res.status(400).json({ error: 'Messages không hợp lệ' });
    }

    // System prompt + context
    const fullSystem = SYSTEM_PROMPT +
      (context ? '\n\n=== CONTEXT ===\n' + String(context).slice(0, 30000) : '') +
      (currentTab ? '\n\nTab người dùng đang xem: ' + currentTab : '');

    // Gọi Claude
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: fullSystem,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    const reply = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .trim();

    if (!reply){
      return res.status(502).json({ error: 'Claude trả về rỗng' });
    }

    return res.status(200).json({
      reply,
      usage: {
        input_tokens:  response.usage?.input_tokens,
        output_tokens: response.usage?.output_tokens,
      }
    });
  } catch (err) {
    console.error('[chat error]', err);
    const status = err.status || 500;
    return res.status(status).json({
      error: 'Lỗi server',
      detail: err.message || String(err),
    });
  }
}

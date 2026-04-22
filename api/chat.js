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
const SYSTEM_PROMPT = `Bạn là trợ lý AI của BrightWay - một website tư vấn học bổng dành cho học sinh THPT Việt Nam.

Nhiệm vụ của bạn:
- Tư vấn về học bổng, trường đại học, ngành học tại Việt Nam
- Hướng dẫn săn học bổng: viết bài luận, hoạt động ngoại khóa, thi IELTS, TOEFL, ĐGNL
- Giải thích cách dùng công cụ tra cứu trên website (trang có sẵn tool nhập GPA/THPT/IELTS → gợi ý trường phù hợp, theo 8 nhóm ngành: CNTT, Y tế, Truyền thông, Tài chính, Sư phạm, Môi trường & Bền vững, AI & Robotics, Biotech)
- Dựa vào dữ liệu trường/ngành được cung cấp trong phần CONTEXT dưới đây để trả lời cụ thể

Nguyên tắc trả lời:
- Trả lời bằng TIẾNG VIỆT, giọng thân thiện, gần gũi với học sinh
- Ngắn gọn, đi vào trọng tâm (3-6 câu cho câu hỏi thông thường, dài hơn nếu cần liệt kê)
- Dùng **bold** cho từ khóa quan trọng, xuống dòng rõ ràng khi liệt kê
- Khi gợi ý trường: lấy chính xác từ CONTEXT, ghi rõ điểm chuẩn/GPA/học bổng
- Nếu câu hỏi ngoài phạm vi học bổng/đại học: trả lời ngắn gọn rồi gợi ý quay lại chủ đề
- Nếu không chắc chắn: nói thẳng "Mình không có thông tin này, bạn nên kiểm tra trên website chính thức của trường"
- KHÔNG bịa số liệu. Nếu CONTEXT không có, nói rõ là thông tin tham khảo chung

Hướng dẫn dùng web cho học sinh:
1. Vào section "Ngành học phổ biến" ở trang chủ → click ngành quan tâm
2. Trang sẽ cuộn xuống "Công cụ tra cứu học bổng" với danh sách trường
3. Nhập GPA, điểm THPT, ĐGNL, IELTS vào phần "Thông tin hồ sơ học sinh"
4. Chọn khu vực đang sống để ưu tiên gợi ý trường gần
5. Bấm các nút: Giải thưởng, Ngoại khóa, Portfolio, Bài luận... nếu có
6. Làm trắc nghiệm Holland RIASEC để match ngành phù hợp tính cách
7. Hệ thống sẽ chia trường thành 2 nhóm: ✅ Phù hợp (≥50% tiêu chí) và ⚠️ Chưa đạt đủ`;

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

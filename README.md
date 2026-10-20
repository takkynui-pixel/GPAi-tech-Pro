# GPAi-tech (Phase 1)
1. รัน `supabase/migrations/001_phase1.sql` ใน Supabase SQL Editor
2. คัดลอก `.env.example` เป็น `.env.local` ใส่ URL / anon key
3. `npm install && npm run dev`
4. Deploy: push ขึ้น GitHub → Import ที่ Vercel → ใส่ env 2 ตัวเดิม
## Phase 2
- รัน `supabase/migrations/002_phase2.sql`
- ตั้ง env บน Vercel: `SUPABASE_SERVICE_ROLE_KEY`, `LINE_CHANNEL_ACCESS_TOKEN`, `CRON_SECRET` (Vercel ส่ง CRON_SECRET เป็น Bearer ให้ cron อัตโนมัติ)
- Cron ทำงานทุกวัน 08:00 น. (เวลาไทย) ตาม `vercel.json`
## Phase 2 (ส่วนที่เหลือ)
- รัน `003_phase2_complete.sql`, ตั้ง `LINE_CHANNEL_SECRET` แล้วตั้ง Webhook URL ใน LINE Developers เป็น `https://<โดเมน>/api/line/webhook`
- ตั้งค่า PromptPay ที่หน้า "ตั้งค่าร้าน" จึงจะมี QR ในหน้าลูกค้า

- รัน `004_phase2_reports.sql` (ทีมช่าง ค่าคอม ต้นทุนเพิ่ม)

## Phase 3
- รัน `005_phase3_ai.sql` และตั้ง `GEMINI_API_KEY` (เลือกโมเดลเองได้ด้วย `GEMINI_MODEL`)
- ค้นหาร้านตามความหมาย: `GET /api/geo/search?q=ช่างไฟใกล้ฉัน`

## Super Admin
- สมัครที่ `/login` ก่อน → แก้อีเมลใน `006_super_admin.sql` แล้วรัน → เข้า `/admin`

- รัน `009_formal_documents.sql` (เอกสารทางการ: เลขที่เอกสาร VAT ส่วนลด ข้อมูลบัญชี)

## LINE แบบผสม
- รัน `010_line_hybrid_team_security.sql`
- ตั้ง env: `LINE_CRED_KEY` (ข้อความสุ่มยาว เก็บให้ดี ห้ามเปลี่ยนหลังเริ่มใช้) และ `NEXT_PUBLIC_LINE_BOT_BASIC_ID` (เช่น @123abcde)

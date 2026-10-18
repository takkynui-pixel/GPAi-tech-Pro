# GPAi-tech (Phase 1)
1. รัน `supabase/migrations/001_phase1.sql` ใน Supabase SQL Editor
2. คัดลอก `.env.example` เป็น `.env.local` ใส่ URL / anon key
3. `npm install && npm run dev`
4. Deploy: push ขึ้น GitHub → Import ที่ Vercel → ใส่ env 2 ตัวเดิม
## Phase 2
- รัน `supabase/migrations/002_phase2.sql`
- ตั้ง env บน Vercel: `SUPABASE_SERVICE_ROLE_KEY`, `LINE_CHANNEL_ACCESS_TOKEN`, `CRON_SECRET` (Vercel ส่ง CRON_SECRET เป็น Bearer ให้ cron อัตโนมัติ)
- Cron ทำงานทุกวัน 08:00 น. (เวลาไทย) ตาม `vercel.json`

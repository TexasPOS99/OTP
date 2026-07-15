# Shopee Grab OTP

เว็บมือถือสำหรับ HeroSMS รองรับ Shopee, Grab, ค้นหาประเทศ ประเทศที่ใช้บ่อย และรอรับ OTP อัตโนมัติ

## Deploy บน Vercel

1. เข้า https://vercel.com/new และเลือก repository นี้
2. เพิ่ม Environment Variable ชื่อ `HERO_SMS_API_KEY`
3. เพิ่ม `HERO_SMS_API_BASE` เป็น `https://hero-sms.com/stubs/handler_api.php`
4. กด Deploy

ห้ามใส่ API key จริงลงใน repository สาธารณะ

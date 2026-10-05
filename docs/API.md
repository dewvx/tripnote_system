# API Design

Base URL: `/api` · JSON · REST

สถานะ: **แบบร่างรออนุมัติ** endpoint ที่ยังไม่ได้ implement จะมี phase กำกับ

## 1. ข้อตกลงร่วม

### รูปแบบ

- Request/response body เป็น JSON ชื่อ field เป็น `camelCase`
- เวลาเป็น ISO 8601 UTC เช่น `2026-10-10T04:42:00Z`
- วันที่ตามแผนเป็น `YYYY-MM-DD` เวลาตามแผนเป็น `HH:mm`
- เงินเป็น **string** ทศนิยมสองตำแหน่ง เช่น `"350.00"`
- แก้ไขบางส่วนใช้ `PATCH` ไม่ใช้ `PUT`

### Authentication

- แนบ `Authorization: Bearer <accessToken>` ทุก endpoint ยกเว้นที่ระบุว่า public
- Refresh token อยู่ใน cookie `httpOnly` ส่งอัตโนมัติเฉพาะ path `/api/auth`

### Response สำเร็จ

```json
{ "data": {} }
```

```json
{ "data": [], "meta": { "nextCursor": "..." } }
```

### Response ผิดพลาด

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "ข้อมูลไม่ถูกต้อง",
    "details": [{ "field": "amount", "message": "ต้องมากกว่า 0" }]
  }
}
```

### HTTP Status

| Status | ใช้เมื่อ                                        |
| ------ | ----------------------------------------------- |
| 200    | สำเร็จ, หรือ POST ซ้ำด้วย `clientId` เดิม       |
| 201    | สร้างสำเร็จ                                     |
| 204    | ลบสำเร็จ                                        |
| 401    | ไม่มี token หรือ token หมดอายุ                  |
| 403    | เป็นสมาชิกแต่สิทธิ์ไม่พอ                        |
| 404    | ไม่พบ หรือไม่ใช่สมาชิกของทริป                   |
| 409    | ขัดแย้ง เช่น อีเมลซ้ำ, ลบสมาชิกที่มีรายจ่ายอยู่ |
| 422    | validate ไม่ผ่าน                                |
| 429    | เรียกถี่เกินไป                                  |
| 500    | ข้อผิดพลาดภายใน                                 |

### Error Code หลัก

`VALIDATION_ERROR`, `UNAUTHENTICATED`, `TOKEN_EXPIRED`, `INVALID_CREDENTIALS`, `EMAIL_TAKEN`,
`FORBIDDEN`, `TRIP_NOT_FOUND`, `MEMBER_NOT_FOUND`, `MEMBER_HAS_EXPENSES`, `LAST_OWNER`,
`PLACE_NOT_FOUND`, `ITEM_NOT_FOUND`, `EXPENSE_NOT_FOUND`, `ENTRY_NOT_FOUND`, `PHOTO_NOT_FOUND`,
`INVALID_STATUS_TRANSITION`, `DATE_OUT_OF_RANGE`, `FILE_TOO_LARGE`, `UNSUPPORTED_FILE_TYPE`,
`RATE_LIMITED`, `INTERNAL_ERROR`

### สิทธิ์

คอลัมน์ "สิทธิ์" ในตารางด้านล่างคือ role ขั้นต่ำในทริป: `viewer` < `editor` < `owner`

### Idempotency

`POST` ของ expenses และ journal-entries รับ `clientId` (UUID) ถ้าซ้ำกับที่มีอยู่ในทริป จะคืนรายการเดิมด้วย 200

---

## 2. System

| Method | Path      | Auth   | คำอธิบาย                               |
| ------ | --------- | ------ | -------------------------------------- |
| GET    | `/health` | public | ตรวจสถานะ API และการเชื่อมต่อฐานข้อมูล |

## 3. Auth — Phase 1

| Method | Path             | Auth   | คำอธิบาย                                            |
| ------ | ---------------- | ------ | --------------------------------------------------- |
| POST   | `/auth/register` | public | สมัครสมาชิก คืน access token และตั้ง refresh cookie |
| POST   | `/auth/login`    | public | เข้าสู่ระบบ                                         |
| POST   | `/auth/refresh`  | cookie | ขอ access token ใหม่ และหมุน refresh token          |
| POST   | `/auth/logout`   | cookie | เพิกถอน refresh token และล้าง cookie                |

ทั้ง register (201), login, refresh (200) คืน body รูปแบบเดียวกันคือ `{ accessToken, user }`
และตั้ง cookie `refresh_token` (`HttpOnly; SameSite=Lax; Path=/api/auth`, `Secure` ใน production)
refresh คืน `user` มาด้วยเพื่อให้ตอนเปิดแอปใช้ request เดียวก็รู้ทั้ง token และผู้ใช้ ไม่ต้องเรียก `/users/me` ซ้ำ
logout ตอบ 204 เสมอ แม้ไม่มี cookie

**POST `/auth/register`**

```json
{ "email": "user@example.com", "password": "********", "displayName": "Dxvv" }
```

อีเมลถูก trim และแปลงเป็นตัวพิมพ์เล็ก รหัสผ่านยาว 8 ตัวอักษรถึง 72 byte (ข้อจำกัดของ bcrypt) อีเมลซ้ำตอบ 409 `EMAIL_TAKEN`

**POST `/auth/login`**

```json
{ "email": "user@example.com", "password": "********" }
```

```json
{
  "data": {
    "accessToken": "eyJ...",
    "user": { "id": 1, "email": "user@example.com", "displayName": "Dxvv" }
  }
}
```

ข้อความผิดพลาดของ login ไม่แยกว่าอีเมลหรือรหัสผ่านผิด (401 `INVALID_CREDENTIALS` ไม่มี `details`)

**401 ของ endpoint ที่ต้อง login**

| code              | ความหมาย                            | client ทำอะไร                    |
| ----------------- | ----------------------------------- | -------------------------------- |
| `TOKEN_EXPIRED`   | access token หมดอายุ                | เรียก `/auth/refresh` แล้วยิงซ้ำ |
| `UNAUTHENTICATED` | ไม่มี token, token ปลอม, ไม่มีบัญชี | พาไปหน้า login                   |

`/auth/refresh` ตอบ 401 `UNAUTHENTICATED` เมื่อไม่มี cookie, token หมดอายุหรือถูกเพิกถอน
ถ้า token ที่ถูกหมุนไปแล้วถูกส่งมาซ้ำ server จะเพิกถอน refresh token ทุกตัวของผู้ใช้นั้น

**Rate limit** (นับต่อ IP เก็บใน memory ของแต่ละ instance): register + login รวมกัน 10 ครั้ง / 15 นาที,
refresh + logout รวมกัน 60 ครั้ง / 15 นาที เกินแล้วตอบ 429 `RATE_LIMITED`

## 4. Users — Phase 1

| Method | Path                 | คำอธิบาย                                                         | สถานะ   |
| ------ | -------------------- | ---------------------------------------------------------------- | ------- |
| GET    | `/users/me`          | ข้อมูลผู้ใช้ปัจจุบัน `{ id, email, displayName }`                | ✅ F1.2 |
| PATCH  | `/users/me`          | แก้ชื่อที่แสดง                                                   | v0.2    |
| PATCH  | `/users/me/password` | เปลี่ยนรหัสผ่าน ต้องส่งรหัสเดิม และเพิกถอน refresh token ทั้งหมด | v0.2    |

## 5. Trips — Phase 1

| Method | Path                    | สิทธิ์ | คำอธิบาย                                                                                  |
| ------ | ----------------------- | ------ | ----------------------------------------------------------------------------------------- |
| GET    | `/trips`                | login  | ทริปที่เป็นสมาชิก กรองด้วย `?status=` แต่ละทริปมี `memberCount`, `dayCount`, `totalSpent` |
| POST   | `/trips`                | login  | สร้างทริป ผู้สร้างเป็น owner อัตโนมัติ                                                    |
| GET    | `/trips/:tripId`        | viewer | รายละเอียดทริป พร้อมสมาชิกและยอดใช้จ่ายย่อ                                                |
| PATCH  | `/trips/:tripId`        | owner  | แก้ข้อมูลทริป                                                                             |
| PATCH  | `/trips/:tripId/status` | owner  | เปลี่ยนสถานะ                                                                              |
| DELETE | `/trips/:tripId`        | owner  | soft delete ตอบ 204                                                                       |

**POST `/trips`**

```json
{
  "name": "Korat Rock Trip 2026",
  "originName": "มหาสารคาม",
  "destinationName": "นครราชสีมา",
  "startDate": "2026-10-10",
  "endDate": "2026-10-12",
  "budgetAmount": "7000.00",
  "members": [{ "displayName": "เพื่อน" }]
}
```

`members` คือ guest ที่จะสร้างพร้อมทริป ไม่ต้องใส่ตัวผู้สร้าง
ช่อง "จำนวนคน" ในฟอร์มจะถูกแปลงเป็นรายการ guest ที่ตั้งชื่อเริ่มต้นให้และแก้ทีหลังได้

```json
{
  "data": {
    "id": 12,
    "name": "Korat Rock Trip 2026",
    "status": "planning",
    "startDate": "2026-10-10",
    "endDate": "2026-10-12",
    "dayCount": 3,
    "currency": "THB",
    "budgetAmount": "7000.00",
    "totalSpent": "0.00",
    "myRole": "owner",
    "members": [
      { "id": 30, "displayName": "Dxvv", "role": "owner", "isMe": true, "isGuest": false },
      { "id": 31, "displayName": "เพื่อน", "role": "editor", "isMe": false, "isGuest": true }
    ]
  }
}
```

**PATCH `/trips/:tripId/status`**

```json
{ "status": "active" }
```

ลำดับที่อนุญาต: `planning → active → completed`, `planning → cancelled`, `active → cancelled`,
และย้อน `completed → active` ได้เผื่อกดผิด

ถ้าเปลี่ยนช่วงวันของทริปแล้วมี itinerary item หลุดช่วง ให้ตอบ 409 พร้อมจำนวนรายการที่ได้รับผลกระทบ ไม่ลบให้อัตโนมัติ

## 6. Members — Phase 2

Phase 1 สร้าง guest ได้ผ่าน `POST /trips` อยู่แล้ว endpoint ชุดนี้ใช้จัดการภายหลัง

| Method | Path                               | สิทธิ์ | คำอธิบาย         |
| ------ | ---------------------------------- | ------ | ---------------- |
| GET    | `/trips/:tripId/members`           | viewer | รายชื่อสมาชิก    |
| POST   | `/trips/:tripId/members`           | owner  | เพิ่ม guest      |
| PATCH  | `/trips/:tripId/members/:memberId` | owner  | แก้ชื่อหรือ role |
| DELETE | `/trips/:tripId/members/:memberId` | owner  | ลบสมาชิก         |

กฎ: ลบหรือลดสิทธิ์ owner คนสุดท้ายไม่ได้ (`LAST_OWNER`) ลบสมาชิกที่เป็นคนจ่ายของรายจ่ายใดอยู่ไม่ได้ (`MEMBER_HAS_EXPENSES`)

## 7. Places — Phase 2

| Method | Path                             | สิทธิ์ | คำอธิบาย                                    |
| ------ | -------------------------------- | ------ | ------------------------------------------- |
| GET    | `/trips/:tripId/places`          | viewer | สถานที่ทั้งหมดของทริป กรองด้วย `?category=` |
| POST   | `/trips/:tripId/places`          | editor | เพิ่มสถานที่                                |
| PATCH  | `/trips/:tripId/places/:placeId` | editor | แก้ไข                                       |
| DELETE | `/trips/:tripId/places/:placeId` | editor | ลบ รายการที่อ้างถึงจะถูกปลด place ออก       |

## 8. Itinerary — Phase 2

| Method | Path                                     | สิทธิ์ | คำอธิบาย                   |
| ------ | ---------------------------------------- | ------ | -------------------------- |
| GET    | `/trips/:tripId/itinerary`               | viewer | แผนทั้งทริป จัดกลุ่มรายวัน |
| POST   | `/trips/:tripId/itinerary-items`         | editor | เพิ่มรายการ                |
| PATCH  | `/trips/:tripId/itinerary-items/:itemId` | editor | แก้ไข รวมถึงเปลี่ยน status |
| DELETE | `/trips/:tripId/itinerary-items/:itemId` | editor | ลบ                         |
| PATCH  | `/trips/:tripId/itinerary-items/reorder` | editor | จัดลำดับใหม่หรือย้ายวัน    |

อ่านเป็น `/itinerary` (มุมมองที่จัดกลุ่มแล้ว) แต่เขียนที่ `/itinerary-items` (ทรัพยากรจริง)

**GET `/trips/:tripId/itinerary`**

```json
{
  "data": {
    "days": [
      {
        "date": "2026-10-10",
        "dayNumber": 1,
        "estimatedTotal": "450.00",
        "items": [
          {
            "id": 101,
            "type": "transport",
            "title": "รถบัสไปโคราช",
            "startTime": "08:00",
            "endTime": "11:00",
            "transportMode": "bus",
            "fromLabel": "บขส.มหาสารคาม",
            "toLabel": "บขส.นครราชสีมา",
            "estimatedCost": "400.00",
            "status": "planned",
            "sortOrder": 1
          },
          {
            "id": 102,
            "type": "activity",
            "title": "อนุสาวรีย์ท้าวสุรนารี",
            "startTime": "11:30",
            "place": { "id": 7, "name": "อนุสาวรีย์ท้าวสุรนารี", "category": "attraction" },
            "status": "planned",
            "sortOrder": 2
          }
        ]
      }
    ]
  }
}
```

คืนครบทุกวันของทริปแม้วันนั้นยังไม่มีรายการ เพื่อให้ UI แสดง Empty State รายวันได้

**PATCH `.../itinerary-items/reorder`**

```json
{ "dayDate": "2026-10-10", "itemIds": [102, 101, 103] }
```

## 9. Expenses — Phase 3

| Method | Path                                 | สิทธิ์ | คำอธิบาย              |
| ------ | ------------------------------------ | ------ | --------------------- |
| GET    | `/expense-categories`                | login  | หมวดค่าใช้จ่ายทั้งหมด |
| GET    | `/trips/:tripId/expenses`            | viewer | ประวัติรายจ่าย        |
| POST   | `/trips/:tripId/expenses`            | editor | เพิ่มรายจ่าย          |
| GET    | `/trips/:tripId/expenses/summary`    | viewer | สรุปงบและยอดเคลียร์   |
| GET    | `/trips/:tripId/expenses/:expenseId` | viewer | รายละเอียด            |
| PATCH  | `/trips/:tripId/expenses/:expenseId` | editor | แก้ไข                 |
| DELETE | `/trips/:tripId/expenses/:expenseId` | editor | soft delete           |

Query ของรายการ: `?categoryId=&paidByMemberId=&date=YYYY-MM-DD&cursor=&limit=`
เรียงจากใหม่ไปเก่า แบ่งหน้าด้วย cursor

**POST `/trips/:tripId/expenses`**

```json
{
  "clientId": "6f1c2a9e-8f0b-4f0e-9a51-0c1d2e3f4a5b",
  "amount": "50.00",
  "categoryId": 2,
  "paidByMemberId": 30,
  "description": "น้ำเปล่า",
  "spentAt": "2026-10-10T04:42:00Z",
  "placeId": 7
}
```

บังคับแค่ `amount`, `categoryId`, `paidByMemberId` ถ้าไม่ส่ง `spentAt` ใช้เวลาปัจจุบัน
ใบเสร็จอัปโหลดแยกผ่าน endpoint ของ photos หลังได้ `id` ของรายจ่าย เพื่อให้การบันทึกตัวเลขไม่ต้องรอรูป

**GET `/trips/:tripId/expenses/summary`**

```json
{
  "data": {
    "currency": "THB",
    "budgetAmount": "7000.00",
    "totalSpent": "2350.00",
    "remaining": "4650.00",
    "budgetUsedPercent": 33.6,
    "expenseCount": 14,
    "memberCount": 2,
    "perPerson": "1175.00",
    "byCategory": [
      {
        "categoryId": 1,
        "code": "accommodation",
        "name": "ที่พัก",
        "total": "1200.00",
        "count": 1,
        "percent": 51.1
      }
    ],
    "byDay": [{ "date": "2026-10-10", "total": "1850.00" }],
    "byMember": [
      {
        "memberId": 30,
        "displayName": "Dxvv",
        "paid": "1800.00",
        "share": "1175.00",
        "balance": "625.00"
      },
      {
        "memberId": 31,
        "displayName": "เพื่อน",
        "paid": "550.00",
        "share": "1175.00",
        "balance": "-625.00"
      }
    ],
    "settlements": [{ "fromMemberId": 31, "toMemberId": 30, "amount": "625.00" }]
  }
}
```

ถ้าไม่ได้ตั้งงบ `budgetAmount`, `remaining`, `budgetUsedPercent` เป็น `null`
`remaining` ติดลบได้เมื่อใช้เกินงบ

## 10. Journal — Phase 4

| Method | Path                                      | สิทธิ์ | คำอธิบาย                               |
| ------ | ----------------------------------------- | ------ | -------------------------------------- |
| GET    | `/trips/:tripId/journal-entries`          | viewer | รายการบันทึก                           |
| POST   | `/trips/:tripId/journal-entries`          | editor | เพิ่มบันทึก                            |
| GET    | `/trips/:tripId/journal-entries/:entryId` | viewer | รายละเอียดพร้อมรูปและรายจ่ายที่ผูกอยู่ |
| PATCH  | `/trips/:tripId/journal-entries/:entryId` | editor | แก้ไข                                  |
| DELETE | `/trips/:tripId/journal-entries/:entryId` | editor | soft delete                            |

**POST `/trips/:tripId/journal-entries`**

```json
{
  "clientId": "0b0d9c3a-2a51-4d3e-8a55-9d2f6f3b1c11",
  "body": "มาถึงโคราชแล้ว อากาศร้อนมาก",
  "placeId": 7,
  "rating": 4,
  "occurredAt": "2026-10-10T04:42:00Z",
  "lat": 14.9748,
  "lng": 102.0982
}
```

ทุก field เป็น optional รูปอัปโหลดตามหลังผ่าน endpoint ของ photos โดยอ้าง `journalEntryId`
ดังนั้น entry ที่มีแต่รูปจะถูกสร้างแบบว่างก่อนแล้วค่อยแนบรูป server ไม่บังคับเนื้อหาตอนสร้าง
แต่ timeline จะไม่แสดง entry ที่ว่างเปล่า (ไม่มีข้อความ สถานที่ รูป หรือรายจ่าย) และ client ต้องลบ entry ทิ้งถ้าอัปโหลดรูปไม่สำเร็จ

## 11. Photos — Phase 4 (ใบเสร็จอาจดึงมา Phase 3)

| Method | Path                             | สิทธิ์ | คำอธิบาย                          |
| ------ | -------------------------------- | ------ | --------------------------------- |
| GET    | `/trips/:tripId/photos`          | viewer | แกลเลอรีของทริป กรองด้วย `?kind=` |
| POST   | `/trips/:tripId/photos`          | editor | อัปโหลด `multipart/form-data`     |
| PATCH  | `/trips/:tripId/photos/:photoId` | editor | แก้คำบรรยาย                       |
| DELETE | `/trips/:tripId/photos/:photoId` | editor | soft delete                       |

**POST** fields: `file` (บังคับ), `kind` (`memory` \| `receipt`), `journalEntryId` หรือ `expenseId`, `caption`

```json
{
  "data": {
    "id": 55,
    "kind": "memory",
    "journalEntryId": 201,
    "url": "https://.../signed",
    "thumbUrl": "https://.../signed",
    "width": 1600,
    "height": 1200,
    "takenAt": "2026-10-10T04:40:12Z"
  }
}
```

`url` และ `thumbUrl` เป็น signed URL อายุสั้น client ไม่ควรเก็บถาวร

## 12. Timeline — Phase 4

| Method | Path                      | สิทธิ์ | คำอธิบาย                                                      |
| ------ | ------------------------- | ------ | ------------------------------------------------------------- |
| GET    | `/trips/:tripId/timeline` | viewer | เหตุการณ์ทั้งหมดเรียงตามเวลา จัดกลุ่มรายวัน กรองด้วย `?date=` |

```json
{
  "data": {
    "days": [
      {
        "date": "2026-10-10",
        "dayNumber": 1,
        "totalSpent": "1850.00",
        "items": [
          {
            "kind": "entry",
            "at": "2026-10-10T04:42:00Z",
            "entry": {
              "id": 201,
              "body": "มาถึงโคราชแล้ว อากาศร้อนมาก",
              "rating": 4,
              "place": { "id": 7, "name": "อนุสาวรีย์ท้าวสุรนารี" },
              "photos": [{ "id": 55, "thumbUrl": "https://.../signed" }],
              "expenses": [{ "id": 301, "amount": "50.00", "category": "food" }]
            }
          },
          {
            "kind": "expense",
            "at": "2026-10-10T06:10:00Z",
            "expense": {
              "id": 302,
              "amount": "120.00",
              "category": "food",
              "description": "ข้าวเที่ยง",
              "paidBy": { "memberId": 31, "displayName": "เพื่อน" }
            }
          }
        ]
      }
    ]
  }
}
```

รายจ่ายที่ผูกกับ entry จะแสดงใน entry นั้น ไม่แสดงซ้ำเป็นรายการแยก

## 13. Trip Summary — Phase 4 (ขยายใน Phase 6)

| Method | Path                     | สิทธิ์ | คำอธิบาย                          |
| ------ | ------------------------ | ------ | --------------------------------- |
| GET    | `/trips/:tripId/summary` | viewer | สรุปทั้งทริปสำหรับหน้า After Trip |

ประกอบด้วย: ข้อมูลทริป, ส่วน `expenses` (โครงเดียวกับ expenses/summary), `placesVisited` (จำนวนและรายชื่อ),
`entryCount`, `photoCount`, `highlights` (รูปตัวอย่างและสถานที่ที่ให้คะแนนสูงสุด)
Phase 6 เพิ่ม `plannedVsActual` จาก `estimatedCost` เทียบกับรายจ่ายจริง

## 14. Phase 5 และ 6 (ร่างคร่าว ยืนยันอีกครั้งเมื่อถึง phase)

| Method | Path                     | Phase | คำอธิบาย                                               |
| ------ | ------------------------ | ----- | ------------------------------------------------------ |
| GET    | `/geo/search?q=`         | 5     | ค้นหาสถานที่ผ่าน backend proxy มี cache และ rate limit |
| GET    | `/trips/:tripId/weather` | 5     | พยากรณ์อากาศปลายทางตามช่วงวันของทริป                   |
| GET    | `/trips/:tripId/map`     | 5     | พิกัดของ place และ journal entry สำหรับวาดแผนที่       |
| GET    | `/users/me/stats`        | 6     | สถิติข้ามทริป: จำนวนทริป วันเดินทาง ค่าใช้จ่ายรวม      |

## 15. สิ่งที่ต่างจากตัวอย่างในโจทย์

| ตัวอย่างเดิม                | ที่ออกแบบ                             | เหตุผล                                                       |
| --------------------------- | ------------------------------------- | ------------------------------------------------------------ |
| `PUT /trips/:id`            | `PATCH /trips/:tripId`                | ฟอร์มบนมือถือแก้ทีละส่วน ไม่ควรต้องส่งทั้งก้อน               |
| `POST /trips/:id/itinerary` | `POST /trips/:tripId/itinerary-items` | itinerary เป็นมุมมอง สิ่งที่สร้างจริงคือ item                |
| `/trips/:id/journal`        | `/journal-entries` + `/timeline`      | แยกทรัพยากรที่แก้ไขได้ออกจากมุมมองรวม                        |
| ไม่มี                       | `/auth/refresh`, `/auth/logout`       | จำเป็นสำหรับ access token อายุสั้น                           |
| ไม่มี                       | `PATCH /trips/:tripId/status`         | การเริ่ม/จบทริปเป็นการกระทำที่มีกฎ ไม่ใช่การแก้ field ธรรมดา |
| ไม่มี                       | `/expenses/summary`, `/summary`       | ให้ server คำนวณเงิน client ไม่ต้องบวกเลขเอง                 |

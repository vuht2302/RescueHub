# FE API Contract (Current Implemented APIs)

Tài liệu này là bản contract để FE bám theo **API đã implement thực tế** trong backend hiện tại.

## 1. Chuẩn response dùng chung

### 1.1 Success
```json
{
  "success": true,
  "message": "Thao tac thanh cong",
  "data": {}
}
```

### 1.2 Error
```json
{
  "success": false,
  "message": "Du lieu khong hop le",
  "data": null,
  "errors": [
    {
      "field": "reporterPhone",
      "message": "ReporterPhone khong hop le."
    }
  ]
}
```

### 1.3 Quy ước
- Base URL: `/api/v1`
- JSON: `camelCase`
- Time: UTC ISO 8601
- `id`: UUID string

## 2. Auth APIs

Base route: `/api/v1/auth`

### 2.1 POST `/api/v1/auth/login`
Request:
```json
{
  "username": "coordinator1",
  "password": "******"
}
```
Response:
```json
{
  "success": true,
  "message": "Dang nhap thanh cong",
  "data": {
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token",
    "expiresAt": "2026-04-15T12:00:00Z",
    "user": {
      "id": "uuid",
      "displayName": "Dieu phoi vien 1",
      "phone": "0900000000",
      "roles": ["COORDINATOR"]
    }
  }
}
```

### 2.2 POST `/api/v1/auth/refresh`
Request:
```json
{
  "refreshToken": "refresh-token"
}
```

### 2.3 POST `/api/v1/auth/request-otp`
Request:
```json
{
  "phone": "0900000000",
  "purpose": "LOGIN"
}
```

### 2.4 POST `/api/v1/auth/verify-otp`
Request:
```json
{
  "phone": "0900000000",
  "otpCode": "123456",
  "purpose": "LOGIN"
}
```

### 2.5 POST `/api/v1/auth/logout`
Request: không body

## 3. Media APIs

Base route: `/api/v1/media`

### 3.1 GET `/api/v1/media/upload-types`
Response:
```json
{
  "success": true,
  "message": "Lay danh sach upload type thanh cong",
  "data": ["AVATAR", "INCIDENT_MEDIA", "MISSION_REPORT_MEDIA"]
}
```

### 3.2 POST `/api/v1/media/cloudinary/signature`
Request:
```json
{
  "resourceType": "image",
  "fileName": "hientruong.jpg",
  "type": "INCIDENT_MEDIA"
}
```
Response:
```json
{
  "success": true,
  "message": "Tao chu ky upload thanh cong",
  "data": {
    "cloudName": "your-cloud-name",
    "apiKey": "cloudinary-api-key",
    "timestamp": 1776096698,
    "folder": "flood-rescue/incidents/temp",
    "signature": "signed-string"
  }
}
```

### 3.3 POST `/api/v1/media`
Dùng khi FE upload trực tiếp Cloudinary xong thì đăng ký metadata để lấy `fileId`.

Request:
```json
{
  "provider": "CLOUDINARY",
  "publicId": "flood-rescue/incidents/temp/abc123",
  "resourceType": "image",
  "originalUrl": "https://res.cloudinary.com/...",
  "secureUrl": "https://res.cloudinary.com/...",
  "width": 1600,
  "height": 1200,
  "bytes": 204800,
  "contentType": "image/jpeg",
  "purpose": "INCIDENT_MEDIA"
}
```

Response:
```json
{
  "success": true,
  "message": "Luu metadata media thanh cong",
  "data": {
    "fileId": "uuid",
    "provider": "CLOUDINARY",
    "publicId": "flood-rescue/incidents/temp/abc123",
    "resourceType": "image",
    "originalUrl": "https://res.cloudinary.com/...",
    "secureUrl": "https://res.cloudinary.com/...",
    "thumbnailUrl": "https://res.cloudinary.com/...?...",
    "aiOptimizedUrl": "https://res.cloudinary.com/...?...",
    "width": 1600,
    "height": 1200,
    "bytes": 204800,
    "contentType": "image/jpeg",
    "createdAtUtc": "2026-04-15T09:11:17.3133530Z"
  }
}
```

### 3.4 POST `/api/v1/media/upload`
`multipart/form-data`
- `file`: binary
- `type`: string (hoặc `purpose` để backward-compatible)

### 3.5 GET `/api/v1/media/{fileId}`
Lấy metadata theo `fileId`.

## 4. Public / Citizen APIs

Base route: `/api/v1/public`

### 4.1 GET `/api/v1/public/bootstrap`
Response:
```json
{
  "success": true,
  "message": "Lay du lieu khoi tao thanh cong",
  "data": {
    "hotline": "1900xxxx",
    "defaultMapCenter": {
      "lat": 10.123,
      "lng": 106.123
    },
    "quickIncidentTypes": [
      {
        "code": "FLOOD",
        "name": "FLOOD"
      }
    ],
    "quickActions": [
      {
        "code": "SOS",
        "label": "SOS khan cap"
      },
      {
        "code": "RESCUE_REQUEST",
        "label": "Gui cuu ho"
      },
      {
        "code": "RELIEF_REQUEST",
        "label": "Toi can cuu tro"
      },
      {
        "code": "TRACK",
        "label": "Theo doi yeu cau"
      }
    ]
  }
}
```

### 4.2 GET `/api/v1/public/map-data?lat=10.1&lng=106.1&radiusKm=3`

### 4.3 GET `/api/v1/public/alerts`

### 4.4 GET `/api/v1/public/rescue-form`
Response có `dynamicFields` theo flood scene factors chuẩn.

### 4.5 POST `/api/v1/public/incidents/sos`
Request:
```json
{
  "incidentTypeCode": "FLOOD",
  "reporterName": "Nguyen Van A",
  "reporterPhone": "0900000000",
  "victimCountEstimate": 4,
  "hasInjured": true,
  "hasVulnerablePeople": true,
  "description": "Nuoc dang cao, co nguoi mac ket tren mai nha",
  "location": {
    "lat": 10.123,
    "lng": 106.123,
    "addressText": "Ap 1, Xa A",
    "landmark": "Gan cau B"
  },
  "fileIds": [
    "0259957f-542f-4fa2-9243-35ae1dd78f7c"
  ]
}
```

### 4.6 POST `/api/v1/public/incidents`
Request:
```json
{
  "incidentTypeCode": "FLOOD",
  "reporterName": "Nguyen Van B",
  "reporterPhone": "0900000001",
  "description": "Nha ngap sau",
  "victimCountEstimate": 5,
  "injuredCountEstimate": 0,
  "vulnerableCountEstimate": 2,
  "location": {
    "lat": 10.111,
    "lng": 106.222,
    "addressText": "Ap 2, Xa B",
    "landmark": "Gan truong hoc"
  },
  "sceneDetails": [
    {
      "factorCode": "WATER_LEVEL",
      "valueNumber": 1.4,
      "unitCode": "M"
    },
    {
      "factorCode": "ISOLATED_AREA",
      "valueText": "YES"
    }
  ],
  "fileIds": [
    "uuid-file-1"
  ]
}
```

### 4.7 POST `/api/v1/public/tracking/request-otp`
Request:
```json
{
  "phone": "0900000000",
  "purpose": "TRACKING"
}
```

### 4.8 POST `/api/v1/public/tracking/verify-otp`
Request:
```json
{
  "phone": "0900000000",
  "otpCode": "123456",
  "purpose": "TRACKING"
}
```

### 4.9 GET `/api/v1/public/tracking/rescue/{trackingCode}`

### 4.10 POST `/api/v1/public/tracking/rescue/{trackingCode}/ack`
Request:
```json
{
  "ackMethodCode": "OTP",
  "ackCode": "123456",
  "note": "Da duoc dua toi noi an toan"
}
```

### 4.11 POST `/api/v1/public/relief-requests`
Request:
```json
{
  "requesterName": "Nguyen Van C",
  "requesterPhone": "0900000002",
  "householdCount": 12,
  "note": "Khu nay dang thieu nuoc va luong thuc",
  "items": [
    {
      "supportTypeCode": "WATER",
      "requestedQty": 100,
      "unitCode": "THUNG"
    },
    {
      "supportTypeCode": "FOOD",
      "requestedQty": 50,
      "unitCode": "THUNG"
    }
  ]
}
```

### 4.12 GET `/api/v1/public/tracking/relief/{requestCode}`

### 4.13 POST `/api/v1/public/tracking/relief/{requestCode}/ack`
Request:
```json
{
  "ackMethodCode": "OTP",
  "ackCode": "654321",
  "note": "Da nhan du cuu tro"
}
```

### 4.14 Validation quan trọng cho FE
- `incidentTypeCode` bắt buộc `FLOOD`.
- `reporterPhone` phải đúng định dạng số điện thoại.
- `victimCountEstimate`, `injuredCountEstimate`, `vulnerableCountEstimate` không âm.
- Nếu `victimCountEstimate = 0` thì `injured/vulnerable` cũng phải = 0.
- `sceneDetails.factorCode` phải nằm trong danh sách flood factors chuẩn.

## 5. Master Data APIs

Base route: `/api/v1/master-data`

### 5.1 GET `/api/v1/master-data/bootstrap`
Trả dữ liệu master data tổng hợp (incidentTypes, channels, priorityLevels, severityLevels, skills, skillLevels, vehicleTypes, vehicleCapabilities, warehouseTypes, units, sceneFactors).

### 5.2 GET `/api/v1/master-data/scene-factors`
Nguồn chuẩn để FE render `sceneDetails`.

Response:
```json
{
  "success": true,
  "message": "Lay danh sach scene factor thanh cong",
  "data": {
    "items": [
      {
        "code": "WATER_LEVEL",
        "name": "Muc nuoc",
        "valueType": "NUMBER",
        "unitCode": "M",
        "sortOrder": 1
      },
      {
        "code": "CURRENT_LEVEL",
        "name": "Dong chay",
        "valueType": "TEXT",
        "unitCode": null,
        "sortOrder": 2
      },
      {
        "code": "ROAD_ACCESS",
        "name": "Duong bo tiep can",
        "valueType": "TEXT",
        "unitCode": null,
        "sortOrder": 3
      },
      {
        "code": "BOAT_ACCESS",
        "name": "Tiep can bang thuyen",
        "valueType": "TEXT",
        "unitCode": null,
        "sortOrder": 4
      },
      {
        "code": "ISOLATED_AREA",
        "name": "Khu vuc bi co lap",
        "valueType": "TEXT",
        "unitCode": null,
        "sortOrder": 5
      },
      {
        "code": "POWER_OUTAGE",
        "name": "Mat dien",
        "valueType": "TEXT",
        "unitCode": null,
        "sortOrder": 6
      },
      {
        "code": "FOOD_SHORTAGE",
        "name": "Thieu luong thuc",
        "valueType": "TEXT",
        "unitCode": null,
        "sortOrder": 7
      },
      {
        "code": "DRINKING_WATER_SHORTAGE",
        "name": "Thieu nuoc uong",
        "valueType": "TEXT",
        "unitCode": null,
        "sortOrder": 8
      },
      {
        "code": "MEDICAL_NEED",
        "name": "Nhu cau y te",
        "valueType": "TEXT",
        "unitCode": null,
        "sortOrder": 9
      },
      {
        "code": "EVACUATION_NEEDED",
        "name": "Can so tan",
        "valueType": "TEXT",
        "unitCode": null,
        "sortOrder": 10
      }
    ]
  }
}
```

### 5.3 GET `/api/v1/master-data/workflows/{entityType}`
Ví dụ: `/api/v1/master-data/workflows/INCIDENT`

## 6. Incidents (Coordinator) APIs

Base route: `/api/v1/incidents`

Lưu ý: nhóm này yêu cầu Bearer token.

### 6.1 GET `/api/v1/incidents`

### 6.2 GET `/api/v1/incidents/{incidentId}`

### 6.3 POST `/api/v1/incidents/{incidentId}/verify`
Request:
```json
{
  "verified": true,
  "note": "Da goi xac minh qua dien thoai"
}
```

### 6.4 POST `/api/v1/incidents/{incidentId}/assess`
Request:
```json
{
  "priorityCode": "CRITICAL",
  "severityCode": "HIGH",
  "victimCountEstimate": 4,
  "injuredCountEstimate": 1,
  "vulnerableCountEstimate": 2,
  "requiresMedicalSupport": true,
  "requiresEvacuation": true,
  "notes": "Nuoc dang cao"
}
```

### 6.5 POST `/api/v1/incidents/{incidentId}/scene-observations`
Request:
```json
{
  "summary": "Chi tiep can bang xuong",
  "accessConditionCode": "BOAT_ONLY",
  "hazardLevelCode": "HIGH",
  "details": [
    {
      "factorCode": "WATER_LEVEL",
      "valueNumber": 1.5,
      "unitCode": "M"
    },
    {
      "factorCode": "CURRENT_LEVEL",
      "valueText": "MANH"
    }
  ]
}
```

### 6.6 POST `/api/v1/incidents/{incidentId}/requirements`
Request:
```json
{
  "skills": [
    {
      "skillCode": "WATER_RESCUE",
      "skillLevelCode": "LEVEL_2",
      "requiredCount": 2
    }
  ],
  "vehicleCapabilities": [
    {
      "capabilityCode": "WATER_ACCESS",
      "requiredCount": 1
    }
  ]
}
```

### 6.7 GET `/api/v1/incidents/{incidentId}/dispatch-options`

### 6.8 POST `/api/v1/incidents/{incidentId}/missions`
Request:
```json
{
  "objective": "Tiep can va cuu ho 4 nguoi",
  "priorityCode": "CRITICAL",
  "teamAssignments": [
    {
      "teamId": "uuid-team",
      "isPrimaryTeam": true,
      "memberIds": ["uuid-member-1"],
      "vehicleIds": ["uuid-vehicle-1"]
    }
  ],
  "etaMinutes": 12,
  "note": "Uu tien nguoi gia"
}
```

## 7. Team APIs

Base route: `/api/v1/team`

Lưu ý: nhóm này yêu cầu Bearer token.

### 7.1 GET `/api/v1/team/dashboard`
### 7.2 GET `/api/v1/team/missions`
### 7.3 GET `/api/v1/team/missions/{missionId}`

### 7.4 POST `/api/v1/team/missions/{missionId}/respond`
Request:
```json
{
  "response": "ACCEPT",
  "reasonCode": null,
  "note": null
}
```

### 7.5 POST `/api/v1/team/missions/{missionId}/status`
Request:
```json
{
  "actionCode": "ARRIVED",
  "note": "Da toi hien truong"
}
```

### 7.6 POST `/api/v1/team/missions/{missionId}/field-reports`
Request:
```json
{
  "reportTypeCode": "PROGRESS",
  "summary": "Da cuu duoc 2 nguoi",
  "victimRescuedCount": 2,
  "victimUnreachableCount": 0,
  "casualtyCount": 0,
  "nextActionNote": "Tiep tuc tim kiem",
  "sceneDetails": [
    {
      "factorCode": "WATER_LEVEL",
      "valueNumber": 1.7,
      "unitCode": "M"
    }
  ],
  "fileIds": ["uuid-file-1"]
}
```

### 7.7 POST `/api/v1/team/missions/{missionId}/abort-requests`
Request:
```json
{
  "reasonCode": "VEHICLE_BROKEN",
  "detailNote": "Xuong hong may"
}
```

### 7.8 POST `/api/v1/team/missions/{missionId}/support-requests`
Request:
```json
{
  "supportTypeCode": "ADDITIONAL_TEAM",
  "detailNote": "Can them doi y te"
}
```

## 8. AI APIs

Base route: `/api/v1/ai`

### 8.1 POST `/api/v1/ai/jobs/incident-triage`
Request:
```json
{
  "incidentId": "uuid",
  "jobTypeCode": "INCIDENT_TRIAGE"
}
```

### 8.2 GET `/api/v1/ai/jobs/{jobId}`

## 9. Mapping legacy field/code cho FE

### 9.1 Scene factor alias (backend vẫn hỗ trợ để tương thích)
- `FLOOD_DEPTH_M` -> `WATER_LEVEL`
- `WATER_CURRENT` -> `CURRENT_LEVEL`
- `ACCESSIBILITY` -> `ROAD_ACCESS`

### 9.2 Khuyến nghị FE
- Khi gửi mới, luôn dùng code chuẩn trong `/api/v1/master-data/scene-factors`.
- Không hardcode danh sách factor ở FE.
- Flow upload media khuyến nghị: Cloudinary direct upload -> `POST /api/v1/media` để lấy `fileId` -> truyền `fileIds` vào API nghiệp vụ.

## 10. Danh sách API đã implement (checklist)

### Auth
- POST `/api/v1/auth/login`
- POST `/api/v1/auth/refresh`
- POST `/api/v1/auth/request-otp`
- POST `/api/v1/auth/verify-otp`
- POST `/api/v1/auth/logout`

### Media
- GET `/api/v1/media/upload-types`
- POST `/api/v1/media/cloudinary/signature`
- POST `/api/v1/media`
- POST `/api/v1/media/upload`
- GET `/api/v1/media/{fileId}`

### Public
- GET `/api/v1/public/bootstrap`
- GET `/api/v1/public/map-data`
- GET `/api/v1/public/alerts`
- GET `/api/v1/public/rescue-form`
- POST `/api/v1/public/incidents/sos`
- POST `/api/v1/public/incidents`
- POST `/api/v1/public/tracking/request-otp`
- POST `/api/v1/public/tracking/verify-otp`
- GET `/api/v1/public/tracking/rescue/{trackingCode}`
- POST `/api/v1/public/tracking/rescue/{trackingCode}/ack`
- POST `/api/v1/public/relief-requests`
- GET `/api/v1/public/tracking/relief/{requestCode}`
- POST `/api/v1/public/tracking/relief/{requestCode}/ack`

### Master data
- GET `/api/v1/master-data/bootstrap`
- GET `/api/v1/master-data/scene-factors`
- GET `/api/v1/master-data/workflows/{entityType}`

### Incidents
- GET `/api/v1/incidents`
- GET `/api/v1/incidents/{incidentId}`
- POST `/api/v1/incidents/{incidentId}/verify`
- POST `/api/v1/incidents/{incidentId}/assess`
- POST `/api/v1/incidents/{incidentId}/scene-observations`
- POST `/api/v1/incidents/{incidentId}/requirements`
- GET `/api/v1/incidents/{incidentId}/dispatch-options`
- POST `/api/v1/incidents/{incidentId}/missions`

### Team
- GET `/api/v1/team/dashboard`
- GET `/api/v1/team/missions`
- GET `/api/v1/team/missions/{missionId}`
- POST `/api/v1/team/missions/{missionId}/respond`
- POST `/api/v1/team/missions/{missionId}/status`
- POST `/api/v1/team/missions/{missionId}/field-reports`
- POST `/api/v1/team/missions/{missionId}/abort-requests`
- POST `/api/v1/team/missions/{missionId}/support-requests`

### AI
- POST `/api/v1/ai/jobs/incident-triage`
- GET `/api/v1/ai/jobs/{jobId}`

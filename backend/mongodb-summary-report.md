
# MongoDB Data Export Summary
Generated: 11/9/2025, 3:17:29 pm

## Database: studentjobs

## Collections Summary:
- **Users**: 5 records
- **Admin Logins**: 12 records  
- **KYC**: 2 records
- **Jobs**: 3 records
- **OTPs**: 10 records (latest 10)

## Admin Users:

- **Admin User** (admin@studentjobs.com)
  - Phone: 1234567890
  - Active: true
  - Email Verified: true
  - Phone Verified: true
  - Approval Status: approved
  - Created: Thu Sep 11 2025 13:02:41 GMT+0530 (India Standard Time)
- **Test Admin User** (test-admin@studentjobs.com)
  - Phone: +91 98765 43210
  - Active: true
  - Email Verified: true
  - Phone Verified: true
  - Approval Status: approved
  - Created: Thu Sep 11 2025 15:07:01 GMT+0530 (India Standard Time)

## Recent Admin Login Activity:

- **Test Admin User** (test-admin@studentjobs.com)
  - Time: Thu Sep 11 2025 15:14:04 GMT+0530 (India Standard Time)
  - Status: success
  - IP: 127.0.0.1
  - User Agent: Admin Setup Script...
- **Admin User** (admin@studentjobs.com)
  - Time: Thu Sep 11 2025 15:14:04 GMT+0530 (India Standard Time)
  - Status: success
  - IP: 127.0.0.1
  - User Agent: Admin Setup Script...
- **Test Admin User** (test-admin@studentjobs.com)
  - Time: Thu Sep 11 2025 13:07:01 GMT+0530 (India Standard Time)
  - Status: success
  - IP: 192.168.1.103
  - User Agent: Mozilla/5.0 (Android 11; Mobile; rv:68.0) Gecko/68...
- **Admin User** (admin@studentjobs.com)
  - Time: Thu Sep 11 2025 09:13:45 GMT+0530 (India Standard Time)
  - Status: success
  - IP: 192.168.1.55
  - User Agent: Mozilla/5.0 (Android 13; Mobile; rv:109.0) Gecko/1...
- **Test Admin User** (test-admin@studentjobs.com)
  - Time: Thu Sep 11 2025 09:07:01 GMT+0530 (India Standard Time)
  - Status: failed
  - IP: 192.168.1.102
  - User Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac...

## MongoDB Connection Details:
- **Database**: studentjobs
- **Connection String**: mongodb://localhost:27017/studentjobs
- **Collections**: users, adminlogins, kycs, jobs, otps

## How to Access MongoDB Data:

### 1. Using MongoDB Compass (GUI):
1. Download MongoDB Compass from: https://www.mongodb.com/products/compass
2. Connect using: mongodb://localhost:27017/studentjobs
3. Browse collections: users, adminlogins, kycs, jobs, otps

### 2. Using MongoDB Shell:
```bash
mongosh "mongodb://localhost:27017/studentjobs"
use studentjobs
show collections
db.users.find({userType: "admin"})
db.adminlogins.find().sort({loginTime: -1})
```

### 3. Using Node.js Scripts:
Run any of these scripts in the backend directory:
- `node show-mongodb-data.js` - View all collections
- `node show-complete-admin-details.js` - Detailed admin info
- `node check-current-admin-details.js` - Admin summary

## Admin Login Credentials:

- **Email**: admin@studentjobs.com
- **Password**: admin123456
- **User Type**: admin
- **Email**: test-admin@studentjobs.com
- **Password**: admin123456
- **User Type**: admin

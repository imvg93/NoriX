# KYC Details Location - Complete Guide

## 📋 Where KYC Details Are Stored

### **🗄️ MongoDB Database: `studentjobs`**
- **Collection:** `kycs`
- **Total Records:** 2 KYC submissions
- **Connection:** `mongodb://localhost:27017/studentjobs`

## 👥 Current KYC Submissions

### **1. John Student**
- **📧 Email:** `john.student@university.edu`
- **📱 Phone:** `+919876543210`
- **🏫 College:** University of Technology
- **📚 Course:** 3rd Year
- **📊 Status:** Pending
- **📅 Submitted:** September 10, 2025
- **✅ Approved:** Yes (by admin)

### **2. Test Student**
- **📧 Email:** `student@test.com`
- **📱 Phone:** `+91 98765 43211`
- **🏫 College:** Test University
- **📚 Course:** Computer Science - 3rd Year
- **📊 Status:** Pending
- **📅 Submitted:** September 11, 2025

## 📊 KYC Data Structure

### **Personal Information:**
- Full Name
- Date of Birth
- Gender
- Phone Number
- Email Address
- Address
- Blood Group

### **Educational Information:**
- College Name
- Course Year
- Student ID (optional)

### **Availability:**
- Stay Type (Home/PG)
- Hours Per Week
- Available Days
- PG Details (if applicable)

### **Job Preferences:**
- Preferred Job Types
- Experience & Skills

### **Documents:**
- Aadhar Card (Cloudinary URL)
- College ID Card (Cloudinary URL)

### **Emergency Contact:**
- Name
- Phone Number
- Relation

### **Payroll Information:**
- Bank Account Number
- IFSC Code
- Account Holder Name
- Consent

### **Verification Status:**
- Status: pending/in-review/approved/rejected
- Verification Notes
- Verified At/By
- Approved At/By
- Rejected At/By
- Rejection Reason

## 🔍 How to Access KYC Data

### **1. MongoDB Compass (GUI)**
```
Connection: mongodb://localhost:27017/studentjobs
Collection: kycs
```

### **2. MongoDB Shell**
```bash
mongosh "mongodb://localhost:27017/studentjobs"
use studentjobs
db.kycs.find()
```

### **3. Node.js Scripts**
```bash
cd backend
node show-detailed-kyc-details.js
node find-kyc-details.js
```

### **4. API Endpoints**
- `GET /api/admin/kyc/stats` - KYC statistics
- `GET /api/admin/kyc/pending` - Pending KYC submissions
- `GET /api/admin/kyc/:id` - Specific KYC details

## 📋 MongoDB Queries

### **Find All KYC Records:**
```javascript
db.kycs.find()
```

### **Find Pending KYC:**
```javascript
db.kycs.find({verificationStatus: "pending"})
```

### **Find KYC with Student Details:**
```javascript
db.kycs.aggregate([
  {
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "student"
    }
  }
])
```

### **Find KYC by Email:**
```javascript
db.kycs.find({email: "student@test.com"})
```

### **Count KYC Submissions:**
```javascript
db.kycs.countDocuments()
```

## 📊 Current Statistics

- **Total KYC Submissions:** 2
- **Pending Review:** 2
- **Approved:** 0
- **Rejected:** 0
- **Students with KYC:** 2

## 🎯 Key Points

1. **KYC data is stored in MongoDB** in the `kycs` collection
2. **Each KYC record** is linked to a student user via `userId`
3. **Document uploads** are stored as Cloudinary URLs
4. **Verification status** tracks the approval process
5. **All personal and academic details** are captured
6. **Emergency contact and payroll info** are included

## 🚀 Next Steps

To view KYC details:
1. Use MongoDB Compass for visual browsing
2. Run Node.js scripts for detailed reports
3. Use API endpoints for programmatic access
4. Query MongoDB directly for specific data

**The KYC details are fully accessible and stored in MongoDB!** 🎉

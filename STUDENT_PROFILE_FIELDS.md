# Student Profile Fields Documentation

## Overview
This document lists all student profile fields and their mandatory requirements based on the User model and KYC (Know Your Customer) verification schema.

---

## 1. Basic Account Fields (User Model)
These fields are required when creating a student account.

### Mandatory Fields:
- **name** (string, max 100 chars) - Student's full name
- **email** (string, unique) - Valid email address
- **phone** (string, unique, min 6 chars) - Phone number
- **password** (string, min 6 chars) - Account password
- **role** (enum: 'student') - User role, must be 'student'
- **college** (string, max 200 chars) - College/University name (required only if role is 'student')

### Optional Fields:
- **skills** (string array, each max 50 chars) - List of skills
- **availability** (enum: 'weekdays', 'weekends', 'both', 'flexible') - Default: 'flexible'
- **rating** (number, 0-5) - Default: 0
- **completedJobs** (number, min 0) - Default: 0
- **totalEarnings** (number, min 0) - Default: 0
- **profilePicture** (string) - Profile picture URL
- **address** (string, max 500 chars) - Address

---

## 2. KYC Profile Fields (Complete Student Profile)
These fields are part of the KYC verification process for students.

### 2.1 Basic Information

#### Mandatory:
- **fullName** (string, max 100 chars) - Full name (no numbers, min 2 chars)
- **dob** (Date) - Date of birth (must be at least 16 years old, max 100 years)
- **phone** (string, min 6 chars) - Phone number
- **email** (string) - Valid email address
- **address** (string, max 500 chars, min 10 chars) - Complete address

#### Optional:
- **gender** (enum: 'male', 'female', 'other', 'prefer-not-to-say') - Gender

---

### 2.2 Academic Information

#### Mandatory:
- **college** (string, max 200 chars, min 3 chars) - College/University name
- **courseYear** (string, max 100 chars) - Course and year (e.g., "B.Tech 3rd Year")

#### Optional:
- **studentId** (string, max 50 chars) - Student ID number

---

### 2.3 Stay & Availability

#### Mandatory:
- **stayType** (enum: 'home', 'pg') - Where the student is staying
- **hoursPerWeek** (number, 5-40) - Hours available per week (default: 20)
- **availableDays** (string array) - At least one day required
  - Options: 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'

#### Optional (Conditional):
- **pgDetails** (object) - Required only if stayType is 'pg'
  - **name** (string, max 100 chars) - PG name
  - **address** (string, max 500 chars) - PG address
  - **contact** (string, min 6 chars) - PG contact number

---

### 2.4 Documents

#### Optional:
- **aadharCard** (string) - Aadhaar card Cloudinary URL
- **collegeIdCard** (string) - College ID card Cloudinary URL

---

### 2.5 Emergency Contact

#### Mandatory:
- **emergencyContact** (object)
  - **name** (string, max 100 chars, min 2 chars) - Emergency contact name
  - **phone** (string, min 6 chars) - Emergency contact phone number

---

### 2.6 Additional Information

#### Optional:
- **bloodGroup** (enum: 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') - Blood group
- **preferredJobTypes** (string array) - At least one preferred job type
  - Options: 'warehouse', 'delivery', 'housekeeping', 'construction', 'kitchen', 'retail', 'security', 'data-entry'
- **experienceSkills** (string, max 500 chars) - Experience and skills description

---

### 2.7 Payroll Information

#### Optional (Conditional):
- **payroll** (object) - Required only if bankConsent is true
  - **consent** (boolean) - Consent for payroll setup (default: false)
  - **bankAccount** (string, 9-18 digits) - Bank account number (required if consent is true)
  - **ifsc** (string, format: XXXX0XXXXXX) - IFSC code (required if consent is true)
  - **beneficiaryName** (string, max 100 chars, min 2 chars) - Beneficiary name (required if consent is true)
  here we kept so somany options like for the not using only having in the optopm for the following we have the normal we have the n

---

## 3. Summary of Mandatory Fields

### For Basic Student Account Registration:
1. name
2. email
3. phone
4. password
5. role (must be 'student')
6. college

### For Complete KYC Profile Submission:
1. **Basic Information:**
   - fullName
   - dob
   - phone
   - email
   - address

2. **Academic Information:**
   - college
   - courseYear

3. **Stay & Availability:**
   - stayType
   - hoursPerWeek
   - availableDays (at least one)

4. **Emergency Contact:**
   - emergencyContact.name
   - emergencyContact.phone

5. **Work Preferences:**
   - preferredJobTypes (at least one)

6. **Conditional Mandatory (if applicable):**
   - pgDetails (if stayType is 'pg')
   - payroll fields (if bankConsent is true)

---

## 4. Validation Rules

### Phone Number:
- Minimum 6 characters
- Frontend accepts 10-15 digits
- Supports international formats (+country code)

### Email:
- Must match pattern: `/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/`

### Date of Birth:
- Must be at least 16 years old
- Maximum 100 years

### Hours Per Week:
- Minimum: 5 hours
- Maximum: 40 hours

### Bank Account (if payroll consent):
- 9-18 digits only
- IFSC format: 4 letters + 0 + 6 alphanumeric (e.g., SBIN0001234)

---

## 5. Notes

- The User model's `college` field is conditionally required (only when role is 'student')
- KYC documents (Aadhaar card, College ID card) are optional but recommended for verification
- All optional fields can be added/updated later
- Payroll information is only required if the student consents to direct bank transfers










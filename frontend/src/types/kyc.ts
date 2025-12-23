export type KYCFormData = {
  // Screen 1: Basic Identity
  fullName: string;
  dob: string;
  gender: string;
  city: string;
  state: string;
  
  // Screen 2: Government ID
  idType: 'aadhaar' | 'pan' | '';
  idFrontUrl: string;
  
  // Screen 3: Selfie
  selfieUrl: string;
  
  // Screen 4: Student Proof
  studentProofType: 'college_id' | 'bonafide' | 'fee_receipt' | '';
  studentProofUrl: string;
  
  // Screen 5: Skills & Work Intent
  workTypes: string[];
  primarySkillCategory: string;
  languages: string[];
  availabilityDays: string[];
  hoursPerDay: number;
};

export const WORK_TYPES = ['Online work', 'On-site/local work', 'Corporate/part-time'];
export const SKILL_CATEGORIES = [
  'Technology', 'Design', 'Marketing', 'Content Writing', 'Data Entry',
  'Customer Service', 'Sales', 'Teaching', 'Photography', 'Video Editing',
  'Social Media', 'Other'
];
export const LANGUAGES = ['English', 'Hindi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam', 'Bengali', 'Marathi', 'Gujarati', 'Punjabi', 'Other'];
export const AVAILABILITY_DAYS = ['Weekdays', 'Weekends'];



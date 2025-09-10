# KYC Profile Verification System

A comprehensive, mobile-first KYC (Know Your Customer) profile verification system designed for student part-time work platforms. Built with React, TypeScript, and Framer Motion for smooth animations.

## 🎨 Design Features

- **Mobile-first responsive design** with tablet and desktop support
- **Two theme variants**: Trust-Blue (default) and Warm-Teal
- **Progressive disclosure** with collapsible sections and progress indicator
- **Accessibility compliant** (WCAG AA standards)
- **Smooth micro-animations** and transitions
- **Auto-save functionality** with visual indicators
- **File upload with drag-and-drop** and camera capture support
- **Real-time validation** with friendly error messages

## 📁 Project Structure

```
frontend/src/
├── components/kyc/
│   ├── KYCFormComponents.tsx    # Reusable form components
│   ├── ProfileVerification.tsx  # Main KYC form component
│   ├── ThemeToggle.tsx          # Theme switching component
│   └── SuccessAnimation.tsx     # Success animations
├── styles/
│   └── kyc-design-system.css   # Design system and themes
└── types/
    └── kyc.ts                  # TypeScript interfaces
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install framer-motion lucide-react
```

### 2. Import Styles

Add the design system CSS to your main CSS file or import it:

```css
@import './styles/kyc-design-system.css';
```

### 3. Use the Component

```tsx
import ProfileVerification from './components/kyc/ProfileVerification';

function App() {
  return <ProfileVerification />;
}
```

## 🎯 Form Sections

### 1. Basic Information
- Full name (required)
- Date of birth (16+ validation)
- Gender (optional)
- Phone number with country code
- Email address
- Current address

### 2. Academic Details
- College/University name
- Course and year
- Student ID/Enrollment number

### 3. Stay & Availability
- Stay type (Home/PG)
- PG details (conditional)
- Hours per week (slider)
- Available days (multi-select)

### 4. Identity Verification
- Government ID type selection
- ID document upload (front/back for Aadhaar)
- Passport photo upload
- Privacy information

### 5. Emergency Contact
- Emergency contact name and phone
- Blood group (optional)

### 6. Work Preferences
- Preferred job types (multi-select chips)
- Experience and skills (optional)

### 7. Payroll Details (Conditional)
- Bank consent checkbox
- Bank account details (only after consent)
- IFSC code validation
- Beneficiary name

## 🔧 API Integration

### Expected API Endpoints

```typescript
// Save draft
POST /api/kyc/draft
{
  "userId": "string",
  "formData": ProfileData,
  "section": "string"
}

// Submit verification
POST /api/kyc/submit
{
  "userId": "string",
  "formData": ProfileData
}

// Upload files
POST /api/kyc/upload
FormData with files and metadata

// Verify OTP
POST /api/kyc/verify-otp
{
  "phone": "string",
  "otp": "string"
}
```

### JSON Schema

```json
{
  "fullName": "string",
  "dob": "YYYY-MM-DD",
  "gender": "male|female|other|prefer-not-to-say",
  "phone": "+91-9999999999",
  "email": "student@example.com",
  "address": "string",
  "college": "string",
  "courseYear": "string",
  "studentId": "string",
  "stay": {
    "type": "home|pg",
    "pgDetails": {
      "name": "string",
      "address": "string",
      "contact": "string"
    }
  },
  "availability": {
    "hoursPerWeek": 20,
    "days": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
  },
  "uploads": {
    "govtIdType": "aadhaar|passport|voter-id|driving-license",
    "govtIdFiles": ["url1", "url2"],
    "photoFile": ["url"]
  },
  "emergencyContact": {
    "name": "string",
    "phone": "string"
  },
  "health": {
    "bloodGroup": "A+|A-|B+|B-|AB+|AB-|O+|O-"
  },
  "preferences": {
    "jobTypes": ["warehouse", "delivery", "housekeeping"],
    "experienceSkills": "string"
  },
  "payroll": {
    "consent": true,
    "bankAccount": "string",
    "ifsc": "string",
    "beneficiaryName": "string"
  }
}
```

## 🎨 Theme System

### Trust-Blue Theme (Default)
```css
--kyc-accent: #3b82f6;
--kyc-accent-light: #dbeafe;
```

### Warm-Teal Theme
```css
--kyc-accent: #14b8a6;
--kyc-accent-light: #ccfbf1;
```

### Switching Themes
```tsx
// Add theme toggle to your app
import ThemeToggle from './components/kyc/ThemeToggle';

function App() {
  return (
    <div>
      <ThemeToggle />
      <ProfileVerification />
    </div>
  );
}
```

## 📱 Responsive Design

- **Mobile**: Single column layout, touch-friendly controls
- **Tablet**: Two-column form rows, optimized spacing
- **Desktop**: Full layout with sidebar navigation

### Breakpoints
- Mobile: `< 640px`
- Tablet: `640px - 1024px`
- Desktop: `> 1024px`

## ♿ Accessibility Features

- **Semantic HTML** with proper heading hierarchy
- **ARIA labels** and descriptions for form controls
- **Keyboard navigation** support
- **Screen reader** compatibility
- **Color contrast** compliance (WCAG AA)
- **Focus management** and visible focus indicators
- **Error announcements** with `role="alert"`

## 🔒 Privacy & Security

### Data Handling
- **Encrypted storage** for sensitive information
- **Secure file upload** with validation
- **Consent-based** data collection
- **Data deletion** options

### Privacy Notice Text
```
• Your documents are encrypted and stored securely
• We only use them for verification purposes
• You can request data deletion anytime
• Contact support for any privacy concerns
```

## 🧪 Validation Rules

### Client-Side Validation
- **Name**: Required, no numbers
- **DOB**: Required, 16+ years old
- **Phone**: Required, valid format with country code
- **Email**: Required, RFC-compliant format
- **Address**: Required, minimum length
- **Bank Account**: Numeric only, length validation
- **IFSC**: 11-character format validation

### File Upload Validation
- **Accepted formats**: PNG, JPG, JPEG
- **Maximum size**: 5MB per file
- **Image resolution**: Minimum 300x300px recommended
- **Aadhaar**: Both front and back required

## 🎭 Animations & Interactions

### Micro-animations
- **Form field focus** states
- **Error shake** animations
- **Success pulse** effects
- **Smooth transitions** between sections
- **Confetti** celebration on completion

### Progressive Disclosure
- **Collapsible sections** with smooth height transitions
- **Conditional fields** that appear/disappear based on selections
- **Tooltip help** for complex fields
- **File preview** with replace/delete actions

## 🔧 Customization

### Adding New Sections
```tsx
// Add to sections array
const sections: Section[] = [
  // ... existing sections
  { id: 'custom', title: 'Custom Section', icon: CustomIcon, completed: false, required: false }
];

// Add render case
case 'custom':
  return (
    <motion.div>
      {/* Custom section content */}
    </motion.div>
  );
```

### Custom Validation
```tsx
const validateField = (name: keyof ProfileData, value: any): string => {
  switch (name) {
    case 'customField':
      if (!value) return 'Custom field is required';
      return '';
    // ... other validations
  }
};
```

## 📊 Performance Optimizations

- **Lazy loading** of form sections
- **Debounced auto-save** (2-second delay)
- **Optimized re-renders** with useCallback
- **Image compression** for uploads
- **Reduced motion** support for accessibility

## 🐛 Troubleshooting

### Common Issues

1. **File upload not working**
   - Check file size limits
   - Verify accepted file types
   - Ensure proper CORS headers

2. **Validation errors not showing**
   - Check error state management
   - Verify field names match
   - Ensure proper ARIA attributes

3. **Theme not switching**
   - Verify CSS custom properties
   - Check data-theme attribute
   - Ensure CSS is loaded

### Debug Mode
```tsx
// Add to ProfileVerification component
const [debugMode, setDebugMode] = useState(false);

// Show form data in debug mode
{debugMode && (
  <pre className="p-4 bg-gray-100 rounded text-xs overflow-auto">
    {JSON.stringify(formData, null, 2)}
  </pre>
)}
```

## 📄 License

This KYC system is designed for educational and commercial use. Please ensure compliance with local data protection regulations (GDPR, CCPA, etc.) when implementing in production.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For technical support or questions:
- Create an issue in the repository
- Contact the development team
- Check the troubleshooting section above

---

**Built with ❤️ for student job platforms**

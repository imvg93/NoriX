import EmployerHome from '../../components/EmployerHome';

export default function EmployerHomePage() {
  // Mock user data for now - replace with real auth context later
  const mockUser = {
    name: 'Employer User',
    companyName: 'TechCorp Inc.',
    userType: 'employer'
  };

  return <EmployerHome user={mockUser} />;
}

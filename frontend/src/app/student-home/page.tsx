import StudentHome from '../../components/StudentHome';

export default function StudentHomePage() {
  // Mock user data for now - replace with real auth context later
  const mockUser = {
    name: 'John Doe',
    userType: 'student'
  };

  return <StudentHome user={mockUser} />;
}

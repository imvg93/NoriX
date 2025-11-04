import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🔍 Frontend API: Updating profile');
    
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    console.log('🔍 Frontend API: Backend response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Frontend API: Backend error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      return NextResponse.json(
        { error: errorData.message || 'Failed to update profile' },
        { status: response.status }
      );
    }
    
    const responseData = await response.json();
    console.log('✅ Frontend API: Profile updated successfully');
    
    // Extract data from wrapped response
    const profileData = responseData.data || responseData;
    
    return NextResponse.json(profileData);
  } catch (error: any) {
    console.error('❌ Frontend API: Error updating profile:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}


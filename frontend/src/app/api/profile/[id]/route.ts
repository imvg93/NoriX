import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log('🔍 Frontend API: Fetching profile for ID:', id);
    console.log('🔍 Frontend API: Backend URL:', `${API_BASE_URL}/profile/${id}`);
    
    if (!id) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    // Get auth token from request headers (case-insensitive)
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    
    console.log('🔍 Frontend API: Auth header present:', !!authHeader);
    
    // Call backend API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(`${API_BASE_URL}/profile/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

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
      
      if (response.status === 404) {
        return NextResponse.json(
          { error: errorData.message || 'Profile not found' },
          { status: 404 }
        );
      }
      
      if (response.status === 401) {
        return NextResponse.json(
          { error: errorData.message || 'Authentication required' },
          { status: 401 }
        );
      }
      
      if (response.status === 403) {
        return NextResponse.json(
          { error: errorData.message || 'Access denied' },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: errorData.message || 'Failed to fetch profile' },
        { status: response.status }
      );
    }
    
    const responseData = await response.json();
    console.log('✅ Frontend API: Backend response received:', {
      success: responseData.success,
      hasData: !!responseData.data,
      message: responseData.message
    });
    
    // Backend uses sendSuccessResponse which wraps data in { success, message, data }
    // Extract the actual profile data
    const profileData = responseData.data || responseData;
    
    return NextResponse.json(profileData);
  } catch (error: any) {
    console.error('❌ Frontend API: Error fetching profile:', error);
    
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout. The server took too long to respond.' },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}


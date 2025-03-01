import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Log all headers for debugging
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  
  console.log('Debug request headers:', headers);
  console.log('Debug request URL:', request.url);
  
  return NextResponse.json({
    message: 'Debug endpoint working',
    headers,
    url: request.url
  });
} 
// Simple authentication utility
export async function isAuthenticated(request: Request) {
  // This is a placeholder implementation
  // Replace with your actual authentication logic
  
  // Get session from cookies, check token validity, etc.
  // For now, we'll return a mock user
  return {
    id: "user123",
    email: "user@example.com",
    isAdmin: true
  };
}

document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm_password').value;
  const role = document.getElementById('role').value;

  // Check if passwords match
  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }
  // Basic validation
  if (!name || !email || !password || !role) {
    alert("Please fill in all fields.");
    return;
  }
  // Validate email format
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    alert("Please enter a valid email address.");
    return;
  }

  try {
    const response = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });

    const result = await response.json();
    alert(result.message || result.error);

    if (response.ok) {
      window.location.href = '/login-page?role=user';
    }
  } catch (error) {
    console.error('Error during registration:', error);
    alert("An unexpected error occurred. Please try again.");
  }
});

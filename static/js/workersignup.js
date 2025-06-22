document.getElementById('workerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirm_password').value;
  const contact = document.getElementById('contact').value.trim();
  const role = document.getElementById('role').value;

  // Confirm password validation
  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  // Basic validation
  if (!name || !email || !password || !contact || !role) {
    alert("Please fill in all fields.");
    return;
  }

  // Email validation
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    alert("Please enter a valid email address.");
    return;
  }

  // Phone number validation (Indian 10-digit)
  const contactPattern = /^\d{10}$/;
  if (!contactPattern.test(contact)) {
    alert("Please enter a valid 10-digit contact number.");
    return;
  }

  try {
    const response = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name,
        email,
        password,
        contact,
        role
      })
    });

    const result = await response.json();
    alert(result.message || result.error);

    if (response.ok) {
      window.location.href = '/login-page?role=worker';
    }
  } catch (error) {
    console.error('Error during worker registration:', error);
    alert("An unexpected error occurred. Please try again.");
  }
});

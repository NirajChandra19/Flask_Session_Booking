document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const submitButton = this.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = "Logging in...";

  // Get role from the URL query string
  const urlParams = new URLSearchParams(window.location.search);
  const role = urlParams.get("role");

  if (!role || (role !== "user" && role !== "worker")) {
    alert("Invalid or missing role in URL.");
    submitButton.disabled = false;
    submitButton.textContent = "Login";
    return;
  }

  const user = {
    email: document.getElementById('email').value.trim(),
    password: document.getElementById('password').value.trim(),
    role: role
  };

  try {
    const response = await fetch("/login?role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify(user)
    });

    const result = await response.json();

    if (response.ok) {
      alert("Login successful!");
      window.location.href = "/home";
    } else {
      alert(result.error || "Login failed");
    }
  } catch (error) {
    console.error("Login error:", error);
    alert("An unexpected error occurred. Please try again.");
  }

  submitButton.disabled = false;
  submitButton.textContent = "Login";
});

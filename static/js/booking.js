function convertTo24Hour(hour12, minute, ampm) {
  let hour24 = parseInt(hour12, 10);

  if (ampm === 'AM') {
    if (hour24 === 12) hour24 = 0; // 12 AM = 00
  } else if (ampm === 'PM') {
    if (hour24 !== 12) hour24 += 12;
  }

  const hourStr = hour24.toString().padStart(2, '0');
  const minuteStr = minute.toString().padStart(2, '0');
  return `${hourStr}:${minuteStr}`;
}

document.getElementById('bookingForm').addEventListener('submit', async function (event) {
  event.preventDefault();

  const department = document.getElementById('department').value;
  const date = document.getElementById('date').value;
  const hour12 = document.getElementById('timeHour').value;
  const minute = document.getElementById('timeMinute').value;
  const ampm = document.getElementById('timeAMPM').value;
  const contact = document.getElementById('contact').value.trim();

  if (!department || !date || !hour12 || !minute || !ampm || !contact) {
    showToast("Please fill in all required fields.", "warning");
    return;
  }

  const time = convertTo24Hour(hour12, minute, ampm);

  try {
    const response = await fetch('/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ department, date, time, contact }),
    });

    const data = await response.json();

    if (response.ok) {
      showToast(data.message || "Booking successful!", "success");
      this.reset();
    } else {
      showToast(data.error || "Failed to book service.", "danger");
    }
  } catch (error) {
    console.error('Booking error:', error);
    showToast("An unexpected error occurred. Please try again.", "danger");
  }
});

document.addEventListener("DOMContentLoaded", function () {
  fetch('/departments')
    .then(response => response.json())
    .then(data => {
      const select = document.getElementById('department');
      data.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.id;
        option.textContent = dept.name;
        select.appendChild(option);
      });
    })
    .catch(error => {
      console.error('Error fetching departments:', error);
    });
});

// Toast display
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toast-container');
  const toastId = `toast-${Date.now()}`;

  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-white bg-${type} border-0`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  toast.setAttribute('id', toastId);
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  toastContainer.appendChild(toast);

  const bsToast = new bootstrap.Toast(toast, { delay: 5000 });
  bsToast.show();

  toast.addEventListener('hidden.bs.toast', () => {
    toast.remove(); // Remove toast from DOM when hidden
  });
}

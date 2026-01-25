// ================================
// Utility: convert 12h → 24h
// ================================
function convertTo24Hour(hour12, minute, ampm) {
  let hour = parseInt(hour12, 10);

  if (ampm === "AM" && hour === 12) hour = 0;
  if (ampm === "PM" && hour !== 12) hour += 12;

  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}

// ================================
// DOM Ready
// ================================
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("bookingForm");

  if (!form) {
    console.error("bookingForm not found");
    return;
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    try {
      const departmentEl = document.getElementById("department");
      const department = departmentEl ? departmentEl.value : "";

      const date = document.getElementById("date")?.value;
      const hour12 = document.getElementById("timeHour")?.value;
      const minute = document.getElementById("timeMinute")?.value;
      const ampm = document.getElementById("timeAMPM")?.value;
      const contact = document.getElementById("contact")?.value.trim();

      if (!department || !date || !hour12 || !minute || !ampm || !contact) {
        showToast("Please fill in all required fields.", "warning");
        return;
      }

      const time = convertTo24Hour(hour12, minute, ampm);

      const workerInput = document.getElementById("worker_id");
      const worker_id = workerInput ? workerInput.value : null;

      const response = await fetch("/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          department,
          date,
          time,
          contact,
          worker_id
        })
      });

      const data = await response.json();

      if (response.ok) {
        showToast(data.message || "Booking successful!", "success");
        form.reset();
      } else {
        showToast(data.error || "Booking failed.", "danger");
      }

    } catch (err) {
      console.error("Booking JS error:", err);
      showToast("Something went wrong. Please try again.", "danger");
    }
  });
});

// ================================
// Toast helper (Bootstrap)
// ================================
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");

  // Fallback if container missing
  if (!container || typeof bootstrap === "undefined") {
    alert(message);
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast align-items-center text-white bg-${type} border-0`;
  toast.setAttribute("role", "alert");
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button"
              class="btn-close btn-close-white me-2 m-auto"
              data-bs-dismiss="toast"></button>
    </div>
  `;

  container.appendChild(toast);
  const bsToast = new bootstrap.Toast(toast, { delay: 4000 });
  bsToast.show();

  toast.addEventListener("hidden.bs.toast", () => toast.remove());
}

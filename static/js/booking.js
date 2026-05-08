// ================================
// DOM Ready
// ================================
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("bookingForm");

    const dateInput = document.getElementById("date");
    const today = new Date();
    // Format YYYY-MM-DD
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    const minDate = `${yyyy}-${mm}-${dd}`;
    // Disable previous dates
    dateInput.setAttribute("min", minDate);
    // ================================
    // Disable Past Time Slots
    // ================================
    const timeSelect = document.getElementById("booking_time");
    dateInput.addEventListener("change", function () {
        const selectedDate = this.value;
        const today = new Date().toISOString().split("T")[0];
        const now = new Date();
        const currentHour = now.getHours();

        Array.from(timeSelect.options).forEach(option => {
            option.disabled = false;
            if (!option.value) return;
            if (selectedDate === today) {
                let hour = parseInt(option.value.split(":")[0]);
                let ampm = option.value.includes("PM") ? "PM" : "AM";
                if (ampm === "PM" && hour !== 12) {
                  hour += 12;
                }
                if (ampm === "AM" && hour === 12) {
                    hour = 0;
                }
                const currentMinutes = now.getHours() * 60 + now.getMinutes();
                const slotMinutes = hour * 60;
                if (slotMinutes <= currentMinutes) {
                  option.disabled = true;
                }
            }
        });
    });

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
      const contact = document.getElementById("contact")?.value.trim();
      const time = document.getElementById("booking_time")?.value;

      if (!department || !date || !time || !contact) {
        showToast("Please fill in all required fields.", "warning");
        return;
      }

      const workerInput = document.getElementById("worker_id");
      const worker_id = workerInput ? workerInput.value : null;

      const response = await fetch("/proceed_to_payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          department,
          contact,
          worker_id,
          date,
          time,
          fee: document.getElementById("worker_fee")
              ? parseFloat(
                  document.getElementById("worker_fee").value
                )
              : null
        })
      });

      const data = await response.json();

      if (data.success) {
        const options = {
            key: data.key,
            amount: data.amount * 100,
            currency: "INR",
            name: "Service Booking",
            description: "Worker Booking Payment",
            order_id: data.order_id,

            handler: async function (response) {
                await fetch("/payment_success", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        order_id:
                            response.razorpay_order_id,
                        payment_id:
                            response.razorpay_payment_id
                    })
                });

                showToast(
                    "Payment successful!",
                    "success"
                );
                form.reset();
            },

            modal: {
                ondismiss: async function () {
                    await fetch("/payment_cancel", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            order_id: data.order_id
                        })
                    });
                    showToast(
                        "Payment cancelled",
                        "warning"
                    );
                }
            }
        };
        const rzp = new Razorpay(options);
        rzp.open();
    }else {
        showToast(data.message || data.error || "Booking failed.", "danger");
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

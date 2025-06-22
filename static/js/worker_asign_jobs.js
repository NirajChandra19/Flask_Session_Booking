document.addEventListener("DOMContentLoaded", () => {
  function formatTime12h(time24) {
    const [hourStr, minute] = time24.split(":");
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute} ${ampm}`;
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  }

  fetch('/get_worker_jobs')
    .then(response => response.json())
    .then(data => {
      const table = document.getElementById("bookings-table");
      const tbody = document.getElementById("bookings-body");
      const alertContainer = document.getElementById("alert-container");

      tbody.innerHTML = "";
      alertContainer.innerHTML = "";

      if (!data || !Array.isArray(data) || data.length === 0) {
        alertContainer.innerHTML = '<div class="alert alert-info">No Jobs assigned to you yet.</div>';
        table.style.display = 'none';
        return;
      }

      data.forEach((booking, index) => {
        const formattedDate = booking.date ? formatDate(booking.date) : 'N/A';
        const formattedTime = booking.time ? formatTime12h(booking.time) : 'N/A';

        if (booking.status === 'booked') {
          const row = document.createElement("tr");
          row.innerHTML = `
            <td>${index + 1}</td>
            <td>${booking.service_name || 'N/A'}</td>
            <td>${formattedDate}</td>
            <td>${formattedTime}</td>
            <td>${booking.user_name || 'N/A'}</td>
            <td>${booking.user_contact || 'N/A'}</td>
            <td>${booking.user_address || 'N/A'}</td>
            <td><span class="badge bg-success">booked</span></td>
          `;
          tbody.appendChild(row);
        }
      });

      if (tbody.children.length > 0) {
        table.style.display = 'table';
      } else {
        alertContainer.innerHTML = '<div class="alert alert-info">No active jobs assigned to you.</div>';
        table.style.display = 'none';
      }
    })
    .catch(error => {
      console.error("Error fetching worker bookings:", error);
      document.getElementById("alert-container").innerHTML =
        '<div class="alert alert-danger">Failed to load bookings.</div>';
    });
});

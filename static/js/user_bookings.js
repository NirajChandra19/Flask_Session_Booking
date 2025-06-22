document.addEventListener("DOMContentLoaded", () => {
  fetch('/get_user_bookings_by_department')
    .then(response => response.json())
    .then(data => {
      const table = document.getElementById("bookings-table");
      const tbody = document.getElementById("bookings-body");
      const alertContainer = document.getElementById("alert-container");

      tbody.innerHTML = "";
      alertContainer.innerHTML = "";

      if (!Array.isArray(data) || data.length === 0) {
        alertContainer.innerHTML = '<div class="alert alert-info">No bookings found!</div>';
        table.style.display = 'none';
        return;
      }

      data.forEach((booking, index) => {
        const row = document.createElement("tr");
        row.setAttribute("id", `booking-row-${booking.id}`);

        const statusText = booking.status === 'cancelled' ? 'Cancelled' : 'Booked';
        const statusClass = booking.status === 'cancelled' ? 'badge bg-danger' : 'badge bg-success';

        const formattedTime = formatTimeTo12Hour(booking.time);

        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${booking.service_name || 'N/A'}</td>
          <td>${booking.date}</td>
          <td>${formattedTime}</td>
          <td>${booking.worker_name || 'N/A'}</td>
          <td>${booking.worker_contact || 'N/A'}</td>
          <td>${booking.worker_fee || 'N/A'}</td>
          <td><span id="status-${booking.id}" class="${statusClass}">${statusText}</span></td>
          <td id="action-${booking.id}">
            ${booking.status === 'booked'
              ? `<button class="btn btn-danger btn-sm" onclick="cancelBooking(${booking.id})">Cancel</button>`
              : 'Cancelled'}
          </td>
        `;
        tbody.appendChild(row);
      });

      table.style.display = 'table';
    })
    .catch(error => {
      console.error("Error fetching bookings:", error);
      document.getElementById("alert-container").innerHTML = '<div class="alert alert-danger">Failed to load bookings.</div>';
    });
});

// Format 24-hour time string to 12-hour (without seconds)
function formatTimeTo12Hour(time24) {
  const [hourStr, minuteStr] = time24.split(':');
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return `${hour}:${minute.toString().padStart(2, '0')} ${ampm}`;
}

function showAlert(message, type = 'success') {
  const alertContainer = document.getElementById('alert-container');
  alertContainer.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
}

function cancelBooking(bookingId) {
  if (!confirm("Are you sure you want to cancel this booking?")) return;

  fetch(`/cancel_booking/${bookingId}`, {
    method: 'POST'
  })
  .then(response => response.json())
  .then(result => {
    if (result.success) {
      const statusElem = document.getElementById(`status-${bookingId}`);
      const actionElem = document.getElementById(`action-${bookingId}`);
      const rowElem = document.getElementById(`booking-row-${bookingId}`);

      if (statusElem) {
        statusElem.className = 'badge bg-danger';
        statusElem.textContent = 'Cancelled';
      }
      if (actionElem) {
        actionElem.textContent = 'Cancelled';
      }

      showAlert('Booking cancelled successfully.');

      // Delete from DB and remove row after 1.5 seconds
      setTimeout(() => {
        fetch(`/delete_booking/${bookingId}`, {
          method: 'POST'
        })
        .then(response => response.json())
        .then(deleteResult => {
          if (deleteResult.success && rowElem) {
            rowElem.remove();
            showAlert('Booking removed from your list.', 'info');
          } else {
            showAlert('Failed to delete booking from database.', 'danger');
          }
        })
        .catch(() => showAlert('Error deleting booking from database.', 'danger'));
      }, 1500);
    } else {
      showAlert("Failed to cancel booking.", 'danger');
    }
  })
  .catch(error => {
    console.error("Cancel error:", error);
    showAlert("Error cancelling booking.", 'danger');
  });
}

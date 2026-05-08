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
        alertContainer.innerHTML =
        '<div class="alert alert-info">No bookings found!</div>';
        table.style.display = 'none';
        return;
      }

      data.forEach((booking, index) => {
        const row = document.createElement("tr");
        row.setAttribute(
          "id",
          `booking-row-${booking.id}`
        );

        let statusText = '';
        let statusClass = '';
        let actionButtons = '';

        const status = booking.status.toLowerCase();
        if (status === 'confirmed') {
            statusText = 'Booked';
            statusClass = 'badge bg-success';
            actionButtons = `
                <button
                  class="btn btn-primary btn-sm me-1"
                  onclick="completeBooking(${booking.id})">
                  Complete
                </button>

                <button
                  class="btn btn-danger btn-sm"
                  onclick="cancelBooking(${booking.id})">
                  Cancel
                </button>
            `;
        }
        else if (status === 'completed') {
            statusText = 'Completed';
            statusClass = 'badge bg-primary';
            actionButtons = `
                <button
                  class="btn btn-warning btn-sm"
                  onclick="openReviewModal(
                    ${booking.id},
                    ${booking.worker_id}
                  )">
                  Rate & Review
                </button>
            `;
        }
        else if (status === 'cancelled') {
            statusText = 'Cancelled';
            statusClass = 'badge bg-danger';
            actionButtons = 'Cancelled';
        }

        const formattedTime =
        formatTimeTo12Hour(booking.time);

        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${booking.service_name || 'N/A'}</td>
          <td>${booking.date}</td>
          <td>${formattedTime}</td>
          <td>${booking.worker_name || 'N/A'}</td>
          <td>${booking.worker_contact || 'N/A'}</td>
          <td>₹${booking.worker_fee || '0'}</td>
          <td>
            <span
              id="status-${booking.id}"
              class="${statusClass}">
              ${statusText}
            </span>
          </td>
          <td id="action-${booking.id}">
            ${actionButtons}
          </td>
        `;
        tbody.appendChild(row);

      });
      table.style.display = 'table';

    })
    .catch(error => {
      console.error(error);
      document.getElementById("alert-container")
      .innerHTML =
      '<div class="alert alert-danger">Failed to load bookings.</div>';
    });
});


// FORMAT TIME
function formatTimeTo12Hour(time24) {
  const [hourStr, minuteStr] =
  time24.split(':');

  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;

  return `${hour}:${minute
    .toString()
    .padStart(2, '0')} ${ampm}`;
}

// ALERT
function showAlert(message, type='success') {
  const alertContainer =
  document.getElementById('alert-container');

  alertContainer.innerHTML = `
    <div
      class="alert alert-${type}
      alert-dismissible fade show">
      ${message}
      <button
        type="button"
        class="btn-close"
        data-bs-dismiss="alert">
      </button>
    </div>
  `;
}

// CANCEL BOOKING
function cancelBooking(bookingId) {
  if (!confirm(
    "Are you sure you want to cancel this booking?"
  )) return;

  fetch(`/cancel_booking/${bookingId}`, {
    method: 'POST'
  })

  .then(response => response.json())
  .then(result => {
    if (result.success) {
      const rowElem =
      document.getElementById(
          `booking-row-${bookingId}`
      );

      showAlert(
          'Booking cancelled successfully.'
      );

      setTimeout(() => {
          if (rowElem) {
              rowElem.remove();
          }
      }, 1000);
    }
    else {
      showAlert(
        result.message,
        'danger'
      );
    }
  })
  .catch(error => {
    console.error(error);
    showAlert(
      'Error cancelling booking.',
      'danger'
    );
  });
}

// COMPLETE BOOKING
function completeBooking(bookingId) {
  if (!confirm("Mark this booking as completed?")) return;

  fetch(`/complete_booking/${bookingId}`, {
    method: 'POST'
  })
  .then(response => response.json())
  .then(result => {
    if (result.success) {
      // UPDATE STATUS
      document.getElementById(
        `status-${bookingId}`
      ).className =
      'badge bg-primary';

      document.getElementById(
        `status-${bookingId}`
      ).textContent =
      'Completed';

      // UPDATE ACTION BUTTON
      document.getElementById(
        `action-${bookingId}`
      ).innerHTML = `
        <button
          class="btn btn-warning btn-sm"
          onclick="openReviewModal(${bookingId}, ${result.worker_id})">
          Rate & Review
        </button>
      `;

      showAlert(
        'Booking completed successfully.',
        'success'
      );

      // OPEN REVIEW MODAL
      openReviewModal(
        bookingId,
        result.worker_id
      );
    } else {
      showAlert(
        result.message,
        'danger'
      );
    }
  })
  .catch(error => {
    console.error(error);
    showAlert(
      'Error completing booking.',
      'danger'
    );
  });
}


// OPEN REVIEW MODAL
function openReviewModal(
  bookingId,
  workerId
){
  document.getElementById(
    'review_booking_id'
  ).value = bookingId;
  document.getElementById(
    'review_worker_id'
  ).value = workerId;
  const modal =
  new bootstrap.Modal(
    document.getElementById('reviewModal')
  );
  modal.show();
}

// SUBMIT REVIEW
document.getElementById(
  'reviewForm'
).addEventListener(
  'submit',
  function(e) {
    e.preventDefault();
    const bookingId =
    document.getElementById(
      'review_booking_id'
    ).value;
    const workerId =
    document.getElementById(
      'review_worker_id'
    ).value;

    const rating =
    document.getElementById(
      'rating'
    ).value;

    const review =
    document.getElementById(
      'review'
    ).value;

    fetch('/submit_review', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        booking_id: bookingId,
        worker_id: workerId,
        rating: rating,
        review: review
      })
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        showAlert(
          'Review submitted successfully.'
        );
        const modalEl =
        document.getElementById(
          'reviewModal'
        );

        const modal =
        bootstrap.Modal.getInstance(
          modalEl
        );
        modal.hide();
        const rowElem =
        document.getElementById(
          `booking-row-${bookingId}`
        );
        setTimeout(() => {
          if (rowElem) {
            rowElem.remove();
          }
        }, 1000);
      }
      else {
        showAlert(
          result.message,
          'danger'
        );
      }
    })
    .catch(error => {
      console.error(error);
      showAlert(
        'Error submitting review.',
        'danger'
      );
    });
});
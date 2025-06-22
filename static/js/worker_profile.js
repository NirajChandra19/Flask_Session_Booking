document.addEventListener('DOMContentLoaded', () => {
  const editBtn = document.getElementById('editBtn');
  const saveBtn = document.getElementById('saveBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const form = document.getElementById('workerProfileForm');

  const profileTexts = document.querySelectorAll('.profile-text');
  const editableInputs = document.querySelectorAll('.editable-input');

  function convertTo24Hour(timeStr, ampm) {
    if (!timeStr) return "00:00:00";
    let [hours, minutes] = timeStr.split(':').map(Number);
    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  }

  function convertTo12Hour(time24) {
    if (!time24) return { time: '12:00', ampm: 'AM' };
    let [hours, minutes] = time24.split(':').map(Number);
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return {
      time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
      ampm
    };
  }

  function toggleEditMode(enable) {
    profileTexts.forEach(el => el.style.display = enable ? 'none' : 'block');
    editableInputs.forEach(el => el.style.display = enable ? 'block' : 'none');

    editBtn.style.display = enable ? 'none' : 'inline-block';
    saveBtn.style.display = enable ? 'inline-block' : 'none';
    cancelBtn.style.display = enable ? 'inline-block' : 'none';

    if (enable) {
      document.getElementById('name').value = document.getElementById('nameText').textContent.trim();
      document.getElementById('contact').value = document.getElementById('contactText').textContent.trim();

      const departmentText = document.getElementById('departmentsText').textContent.trim();
      const selectedDepts = departmentText === 'N/A' ? [] : departmentText.split(',').map(s => s.trim());
      const departmentSelect = document.getElementById('departments');
      Array.from(departmentSelect.options).forEach(option => {
        option.selected = selectedDepts.includes(option.value);
      });

      document.getElementById('fee').value = document.getElementById('feeText').textContent.trim();
      const aboutText = document.getElementById('aboutText').textContent.trim();
      document.getElementById('about').value = aboutText === 'N/A' ? '' : aboutText;

      const availabilityText = document.getElementById('availabilityText').textContent.trim();
      if (availabilityText.includes('to')) {
        const [fromStr, toStr] = availabilityText.split('to').map(s => s.trim());
        const fromParts = fromStr.split(' ');
        const toParts = toStr.split(' ');
        if (fromParts.length === 2 && toParts.length === 2) {
          document.getElementById('available_from_time').value = fromParts[0];
          document.getElementById('available_from_ampm').value = fromParts[1];
          document.getElementById('available_to_time').value = toParts[0];
          document.getElementById('available_to_ampm').value = toParts[1];
        }
      } else {
        document.getElementById('available_from_time').value = '00:00';
        document.getElementById('available_from_ampm').value = 'AM';
        document.getElementById('available_to_time').value = '00:00';
        document.getElementById('available_to_ampm').value = 'PM';
      }
    }
  }

  editBtn.addEventListener('click', () => toggleEditMode(true));
  cancelBtn.addEventListener('click', () => toggleEditMode(false));

  saveBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    saveBtn.disabled = true;

    const fromTime = document.getElementById('available_from_time').value;
    const fromAMPM = document.getElementById('available_from_ampm').value;
    const toTime = document.getElementById('available_to_time').value;
    const toAMPM = document.getElementById('available_to_ampm').value;

    const available_from = convertTo24Hour(fromTime, fromAMPM);
    const available_to = convertTo24Hour(toTime, toAMPM);

    const data = {
      name: document.getElementById('name').value.trim(),
      contact: document.getElementById('contact').value.trim(),
      departments: Array.from(document.getElementById('departments').selectedOptions).map(opt => opt.value),
      fee: document.getElementById('fee').value.trim(),
      available_from,
      available_to,
      about: document.getElementById('about').value.trim()
    };

    try {
      const response = await fetch('/update_worker_profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        document.getElementById('nameText').textContent = data.name;
        document.getElementById('contactText').textContent = data.contact;
        document.getElementById('departmentsText').textContent = data.departments.length ? data.departments.join(', ') : 'N/A';
        document.getElementById('feeText').textContent = data.fee;

        const from12 = convertTo12Hour(available_from);
        const to12 = convertTo12Hour(available_to);
        document.getElementById('availabilityText').textContent = `${from12.time} ${from12.ampm} to ${to12.time} ${to12.ampm}`;
        document.getElementById('aboutText').textContent = data.about || 'N/A';

        toggleEditMode(false);
        alert(result.message || 'Profile updated successfully.');
      } else {
        alert(result.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Failed to update profile. Please try again.');
    } finally {
      saveBtn.disabled = false;
    }
  });

  // 🔁 Availability display formatting
  (function initializeAvailabilityDisplay() {
    const availabilityText = document.getElementById('availabilityText').textContent.trim();
    if (!availabilityText || availabilityText === 'N/A') return;

    if (availabilityText.includes('to')) {
      const [fromStr, toStr] = availabilityText.split('to').map(s => s.trim());
      const time24Regex = /^\d{2}:\d{2}(:\d{2})?$/;
      if (time24Regex.test(fromStr) && time24Regex.test(toStr)) {
        const from12 = convertTo12Hour(fromStr);
        const to12 = convertTo12Hour(toStr);
        document.getElementById('availabilityText').textContent = `${from12.time} ${from12.ampm} to ${to12.time} ${to12.ampm}`;
      }
    }
  })();

  toggleEditMode(false);

  // ✅ NEW: Toggle status AJAX
  const statusToggle = document.getElementById('statusToggle');
  const statusLabel = document.getElementById('statusLabel');

  if (statusToggle) {
    statusToggle.addEventListener('change', () => {
      const newStatus = statusToggle.checked ? 'available' : 'not available';
      const formData = new FormData();
      formData.append('status', newStatus);

      fetch('/update-worker-status', {
        method: 'POST',
        body: formData
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            statusLabel.textContent = newStatus;
          } else {
            alert('Status update failed: ' + data.message);
            statusToggle.checked = !statusToggle.checked; // revert toggle
          }
        })
        .catch(err => {
          console.error('Error updating status:', err);
          alert('Error updating status.');
          statusToggle.checked = !statusToggle.checked; // revert toggle
        });
    });
  }
});

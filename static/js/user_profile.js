document.addEventListener("DOMContentLoaded", function () {
  const editBtn = document.getElementById("editBtn");
  const saveBtn = document.getElementById("saveBtn");
  const cancelBtn = document.getElementById("cancelBtn");

  const nameText = document.getElementById("nameText");
  const nameInput = document.getElementById("name");

  const contactText = document.getElementById("contactText");
  const contactInput = document.getElementById("contact");

  const addressText = document.getElementById("addressText");
  const addressInput = document.getElementById("address");

  let originalName = nameText?.textContent.trim() || "";
  let originalContact = contactText?.textContent.trim() || "";
  let originalAddress = addressText?.textContent.trim() || "";

  editBtn?.addEventListener("click", function () {
    // Pre-fill values
    if (nameInput) nameInput.value = originalName;
    if (contactInput) contactInput.value = originalContact;
    if (addressInput) addressInput.value = originalAddress;

    // Toggle to input
    if (nameText && nameInput) {
      nameText.style.display = "none";
      nameInput.style.display = "block";
    }

    if (contactText && contactInput) {
      contactText.style.display = "none";
      contactInput.style.display = "block";
    }

    if (addressText && addressInput) {
      addressText.style.display = "none";
      addressInput.style.display = "block";
    }

    editBtn.style.display = "none";
    saveBtn.style.display = "inline-block";
    cancelBtn.style.display = "inline-block";
  });

  cancelBtn?.addEventListener("click", function () {
    if (nameText && nameInput) {
      nameInput.value = originalName;
      nameText.textContent = originalName;
      nameInput.style.display = "none";
      nameText.style.display = "block";
    }

    if (contactText && contactInput) {
      contactInput.value = originalContact;
      contactText.textContent = originalContact;
      contactInput.style.display = "none";
      contactText.style.display = "block";
    }

    if (addressText && addressInput) {
      addressInput.value = originalAddress;
      addressText.textContent = originalAddress;
      addressInput.style.display = "none";
      addressText.style.display = "block";
    }

    saveBtn.style.display = "none";
    cancelBtn.style.display = "none";
    editBtn.style.display = "inline-block";
  });

  saveBtn?.addEventListener("click", function () {
  const updatedName = nameInput?.value.trim();
  const updatedContact = contactInput?.value.trim();
  const updatedAddress = addressInput?.value.trim();

  // Don't allow blank name/contact
  if (!updatedName || !updatedContact) {
    alert("Name and Contact cannot be empty.");
    return;
  }

  // Contact validation (10-digit number starting with 6-9)
  const contactRegex = /^[6-9]\d{9}$/;
  if (!contactRegex.test(updatedContact)) {
    alert("Please enter a valid 10-digit phone number.");
    return;
  }

  const dataToUpdate = {};

  if (updatedName !== originalName) {
    dataToUpdate.name = updatedName;
  }

  if (updatedContact !== originalContact) {
    dataToUpdate.contact = updatedContact;
  }

  if (updatedAddress !== originalAddress) {
    dataToUpdate.address = updatedAddress;
  }

  // If no changes
  if (Object.keys(dataToUpdate).length === 0) {
    alert("No changes made.");
    return;
  }

  fetch("/update_user_profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dataToUpdate)
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }

      // Update DOM only with changed fields
      if (dataToUpdate.name) {
        nameText.textContent = updatedName;
        originalName = updatedName;
      }
      if (dataToUpdate.contact) {
        contactText.textContent = updatedContact;
        originalContact = updatedContact;
      }
      if (dataToUpdate.address) {
        addressText.textContent = updatedAddress;
        originalAddress = updatedAddress;
      }

      // Hide inputs and show display
      nameInput.style.display = "none";
      nameText.style.display = "block";

      contactInput.style.display = "none";
      contactText.style.display = "block";

      addressInput.style.display = "none";
      addressText.style.display = "block";

      saveBtn.style.display = "none";
      cancelBtn.style.display = "none";
      editBtn.style.display = "inline-block";

      alert("Profile updated successfully.");
    })
    .catch(err => {
      console.error("Update failed:", err);
      alert("Error updating profile.");
    });
  });
});


export async function confirmAction(message) {
  // If SweetAlert2 is loaded globally as `Swal`, use it
  try {
    if (window.Swal && typeof window.Swal.fire === 'function') {
      const result = await window.Swal.fire({
        text: message,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya',
        cancelButtonText: 'Batal',
      })
      return !!result.isConfirmed
    }
  } catch (e) {
    // fallthrough to native confirm
  }

  return window.confirm(message)
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function notifyRequestFailure(path, error) {
  // Login handles its error inside the login modal, so it must not open this
  // application-wide popup as well.
  if (path === '/auth/login' || error.sessionExpired || typeof window === 'undefined') return

  window.dispatchEvent(new CustomEvent('helpdesk:api-error', {
    detail: { message: error.message || 'Permintaan ke server gagal diproses.' },
  }))
}

export async function api(path, { token, method = 'GET', body } = {}) {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok) {
      const err = new Error(result.message || 'Permintaan gagal diproses')
      err.status = response.status
      // A token can expire while dashboard polling is active. Clear it once at
      // the API boundary so every page stops using the stale session.
      if (response.status === 401 && token) {
        localStorage.removeItem('helpdesk-session')
        window.dispatchEvent(new CustomEvent('helpdesk:session-expired'))
        err.sessionExpired = true
      }
      throw err
    }

    return result
  } catch (error) {
    const requestError = error instanceof Error
      ? error
      : new Error('Tidak dapat terhubung ke server. Silakan coba lagi.')
    notifyRequestFailure(path, requestError)
    throw requestError
  }
}

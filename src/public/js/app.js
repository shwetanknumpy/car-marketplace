/* eslint-env browser */
'use strict';

/**
 * Progressive enhancement for the server-rendered pages.
 *
 * Every mutation goes through the same REST API an external client would use;
 * the session cookie authenticates the call, so there is no second auth path
 * to keep in sync.
 */
(function () {
  const API = '/api/v1';

  async function api(path, { method = 'GET', body } = {}) {
    const response = await fetch(`${API}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      credentials: 'same-origin',
      body: body ? JSON.stringify(body) : undefined,
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok) {
      const error = new Error(
        (payload && payload.error && payload.error.message) || 'Request failed'
      );
      error.details = payload && payload.error && payload.error.details;
      throw error;
    }

    return payload;
  }

  function toast(message, tone = 'info') {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = message;
    el.className = `toast toast-${tone}`;
    el.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => {
      el.hidden = true;
    }, 4000);
  }

  function showError(form, error) {
    const target = form.querySelector('[data-error]');
    const detail =
      error.details && error.details.length
        ? `${error.message}: ${error.details.map((d) => d.message).join(', ')}`
        : error.message;

    if (target) {
      target.textContent = detail;
      target.hidden = false;
    } else {
      toast(detail, 'error');
    }
  }

  function busy(form, isBusy) {
    const button = form.querySelector('button[type="submit"]');
    if (button) {
      button.disabled = isBusy;
      button.dataset.label = button.dataset.label || button.textContent;
      button.textContent = isBusy ? 'Working…' : button.dataset.label;
    }
  }

  function fields(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  /* ------------------------------- Auth -------------------------------- */

  document.querySelectorAll('[data-auth-form]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      busy(form, true);
      try {
        const mode = form.dataset.authForm;
        await api(`/auth/${mode}`, { method: 'POST', body: fields(form) });
        window.location.assign(form.dataset.returnTo || '/');
      } catch (error) {
        showError(form, error);
        busy(form, false);
      }
    });
  });

  document.querySelectorAll('[data-logout]').forEach((button) => {
    button.addEventListener('click', async () => {
      await api('/auth/logout', { method: 'POST' }).catch(() => {});
      window.location.assign('/');
    });
  });

  /* ------------------------------ Listings ------------------------------ */

  document.querySelectorAll('[data-listing-form]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      busy(form, true);

      const data = fields(form);
      const payload = {
        ...data,
        year: Number(data.year),
        price: Number(data.price),
        mileage: Number(data.mileage),
        images: String(data.images || '')
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
      };

      try {
        if (form.dataset.mode === 'create') {
          const result = await api('/listings', { method: 'POST', body: payload });
          window.location.assign(`/cars/${result.data._id}`);
        } else {
          await api(`/listings/${form.dataset.listingId}`, {
            method: 'PATCH',
            body: payload,
          });
          toast('Listing saved', 'success');
          busy(form, false);
        }
      } catch (error) {
        showError(form, error);
        busy(form, false);
      }
    });
  });

  document.querySelectorAll('[data-set-status]').forEach((button) => {
    button.addEventListener('click', async () => {
      button.disabled = true;
      try {
        await api(`/listings/${button.dataset.setStatus}/status`, {
          method: 'PATCH',
          body: { status: button.dataset.status },
        });
        window.location.reload();
      } catch (error) {
        toast(error.message, 'error');
        button.disabled = false;
      }
    });
  });

  document.querySelectorAll('[data-delete-listing]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!window.confirm('Delete this listing? This cannot be undone.')) return;
      try {
        await api(`/listings/${button.dataset.deleteListing}`, { method: 'DELETE' });
        window.location.assign('/dashboard');
      } catch (error) {
        toast(error.message, 'error');
      }
    });
  });

  /* ------------------------------ Inquiries ----------------------------- */

  document.querySelectorAll('[data-inquiry-form]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      busy(form, true);
      try {
        await api('/inquiries', {
          method: 'POST',
          body: {
            listingId: form.dataset.listingId,
            message: fields(form).message,
          },
        });
        form.reset();
        toast('Inquiry sent — the seller will be in touch.', 'success');
      } catch (error) {
        showError(form, error);
      } finally {
        busy(form, false);
      }
    });
  });

  document.querySelectorAll('[data-reply-form]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      busy(form, true);
      try {
        await api(`/inquiries/${form.dataset.inquiryId}/reply`, {
          method: 'POST',
          body: { message: fields(form).message },
        });
        window.location.reload();
      } catch (error) {
        showError(form, error);
        busy(form, false);
      }
    });
  });

  document.querySelectorAll('[data-mark-read]').forEach((button) => {
    button.addEventListener('click', async () => {
      try {
        await api(`/inquiries/${button.dataset.markRead}/read`, { method: 'PATCH' });
        window.location.reload();
      } catch (error) {
        toast(error.message, 'error');
      }
    });
  });

  document.querySelectorAll('[data-withdraw-inquiry]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!window.confirm('Withdraw this inquiry?')) return;
      try {
        await api(`/inquiries/${button.dataset.withdrawInquiry}`, { method: 'DELETE' });
        window.location.reload();
      } catch (error) {
        toast(error.message, 'error');
      }
    });
  });

  /* ------------------------------- Account ------------------------------ */

  document.querySelectorAll('[data-profile-form]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      busy(form, true);
      try {
        await api('/users/me', { method: 'PATCH', body: fields(form) });
        toast('Profile updated', 'success');
      } catch (error) {
        showError(form, error);
      } finally {
        busy(form, false);
      }
    });
  });

  document.querySelectorAll('[data-password-form]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      busy(form, true);
      try {
        await api('/auth/password', { method: 'POST', body: fields(form) });
        form.reset();
        toast('Password updated', 'success');
      } catch (error) {
        showError(form, error);
      } finally {
        busy(form, false);
      }
    });
  });

  document.querySelectorAll('[data-become-seller]').forEach((button) => {
    button.addEventListener('click', async () => {
      button.disabled = true;
      try {
        await api('/users/me/become-seller', { method: 'POST' });
        window.location.assign('/dashboard');
      } catch (error) {
        toast(error.message, 'error');
        button.disabled = false;
      }
    });
  });

  /* ------------------------------- Filters ------------------------------ */

  // Drop empty inputs before submitting so the URL carries only real filters.
  const filterForm = document.getElementById('filter-form');
  if (filterForm) {
    filterForm.addEventListener('submit', () => {
      filterForm.querySelectorAll('input, select').forEach((field) => {
        if (!field.value) field.disabled = true;
      });
    });
  }
})();

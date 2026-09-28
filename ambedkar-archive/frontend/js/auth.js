/**
 * auth.js — Comprehensive Authentication Manager
 * Features:
 * 1. Google Sign-In (Real Google Identity Services SDK + Fallback picker)
 * 2. Mobile Number Login with 6-Digit SMS OTP
 * 3. Gmail / Email Login with 6-Digit OTP
 * 4. Classic Password Login (Accepts Email or Mobile Number)
 * 5. Registration with Optional Phone Verification
 */

// Global callback for Google Identity Services
window.handleGoogleCredentialResponse = async function (response) {
  if (!response || !response.credential) {
    console.error('No Google credential returned in response', response);
    return;
  }
  await submitGoogleCredential(response.credential);
};

document.addEventListener('DOMContentLoaded', () => {
  // ── Redirect if already authenticated ─────────
  if (window.AppState && AppState.isLoggedIn()) {
    if (window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('register.html')) {
      window.location.href = 'dashboard.html';
      return;
    }
  }

  // ── Handle Google OAuth redirect callback early (before async initGoogleAuth) ──
  // This fires when returning from the redirect-based mobile OAuth flow.
  if (window.location.hash?.includes('access_token=')) {
    handleGoogleOAuthRedirectCallback();
    return; // token will trigger onAuthSuccess and redirect
  }

  // ── Initialize Components ─────────────────────
  initAuthTabs();
  initPasswordLogin();
  initTelegramOtpLogin();
  initEmailOtpLogin();
  initRegistration();
  initPasswordReset();
  initGoogleAuth();
});

/* ═══════════════════════════════════════════════════
   1. SEGMENTED AUTH TABS SWITCHER
   ═══════════════════════════════════════════════════ */
function initAuthTabs() {
  const tabs = document.querySelectorAll('.auth-tab-btn');
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetTab = tab.getAttribute('data-tab');
      tabs.forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      // Show matching panel
      const panels = document.querySelectorAll('.auth-panel');
      panels.forEach((p) => {
        p.style.display = 'none';
        p.classList.remove('active');
      });

      const activePanel = document.getElementById(`auth-panel-${targetTab}`);
      if (activePanel) {
        activePanel.style.display = 'block';
        activePanel.classList.add('active');
      }

      // Clear any previous error banner
      const errBanner = document.getElementById('login-error');
      if (errBanner) errBanner.classList.remove('show');
    });
  });
}

/* ═══════════════════════════════════════════════════
   2. PASSWORD LOGIN (EMAIL OR MOBILE)
   ═══════════════════════════════════════════════════ */
function initPasswordLogin() {
  const form = document.getElementById('login-form');
  if (!form) return;

  initPasswordToggle('password', 'toggle-password');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    const errBanner = document.getElementById('login-error');
    const errText = document.getElementById('login-error-text') || errBanner;
    const identifier = form.querySelector('#email').value.trim();
    const password = form.querySelector('#password').value;

    if (!identifier || !password) {
      if (errBanner) {
        errText.textContent = 'Please enter your email or phone number and password.';
        errBanner.classList.add('show');
      }
      return;
    }

    btn.disabled = true;
    const origHtml = btn.innerHTML;
    btn.innerHTML = '<span class="spinner spinner-sm"></span> Signing in…';
    if (errBanner) errBanner.classList.remove('show');

    try {
      const res = await api.auth.login({ email: identifier, password });
      onAuthSuccess(res, 'Signed in successfully! 👋');
    } catch (err) {
      if (errBanner) {
        errText.textContent = err.message || 'Invalid email/phone or password.';
        errBanner.classList.add('show');
      }
      btn.disabled = false;
      btn.innerHTML = origHtml;
    }
  });
}

/* ═══════════════════════════════════════════════════
   3. MOBILE NUMBER + OTP LOGIN
   ═══════════════════════════════════════════════════ */
function initPhoneOtpLogin() {
  const form = document.getElementById('phone-otp-form');
  if (!form) return;

  const phoneInput = document.getElementById('phone-number');
  const sendBtn = document.getElementById('send-phone-otp-btn');
  const otpBox = document.getElementById('phone-otp-box');
  const otpInput = document.getElementById('phone-otp-code');
  const verifyBtn = document.getElementById('verify-phone-otp-btn');
  const statusWrap = document.getElementById('phone-otp-status');
  const statusMsg = document.getElementById('phone-otp-status-msg');
  const timerText = document.getElementById('phone-otp-timer');
  const chipContainer = document.getElementById('phone-demo-chip');
  const errBanner = document.getElementById('login-error');
  const errText = document.getElementById('login-error-text') || errBanner;

  // Auto-format numbers only
  phoneInput?.addEventListener('input', () => {
    phoneInput.value = phoneInput.value.replace(/[^0-9]/g, '');
  });

  // Send OTP
  sendBtn?.addEventListener('click', async () => {
    const rawNum = phoneInput.value.trim();
    if (rawNum.length < 10) {
      if (errBanner) {
        errText.textContent = 'Please enter a valid 10-digit mobile number.';
        errBanner.classList.add('show');
      }
      phoneInput.focus();
      return;
    }
    if (errBanner) errBanner.classList.remove('show');

    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending…';

    try {
      const fullTarget = '+91' + rawNum;
      const res = await api.auth.sendOtp({ target: fullTarget, channel: 'whatsapp', type: 'whatsapp' });

      // Reveal OTP inputs
      otpBox.style.display = 'block';
      verifyBtn.disabled = false;
      statusWrap.style.display = 'flex';
      statusMsg.textContent = res.message || `Code dispatched to WhatsApp (${res.target || fullTarget}).`;

      // Show dev demo quick-fill chip if code received
      if (res.demoCode && chipContainer) {
        chipContainer.style.display = 'block';
        chipContainer.innerHTML = `
          <button type="button" class="otp-chip-badge" id="phone-quick-fill-btn">
            ⚡ Quick-fill received OTP: <strong>${res.demoCode}</strong>
          </button>
        `;
        document.getElementById('phone-quick-fill-btn')?.addEventListener('click', () => {
          otpInput.value = res.demoCode;
          verifyBtn.focus();
        });
      }

      if (window.AppState && AppState.showToast) {
        AppState.showToast(`WhatsApp OTP dispatched to ${fullTarget}!`, 'info');
      }

      startCountdown(sendBtn, timerText, 60);
      otpInput.focus();
    } catch (err) {
      if (errBanner) {
        errText.textContent = err.message || 'Failed to dispatch WhatsApp OTP.';
        errBanner.classList.add('show');
      }
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send Code';
    }
  });

  // Verify OTP
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rawNum = phoneInput.value.trim();
    const otp = otpInput.value.trim();

    if (!otp || otp.length < 4) {
      if (errBanner) {
        errText.textContent = 'Please enter the 6-digit verification code.';
        errBanner.classList.add('show');
      }
      otpInput.focus();
      return;
    }

    verifyBtn.disabled = true;
    const origHtml = verifyBtn.innerHTML;
    verifyBtn.innerHTML = '<span class="spinner spinner-sm"></span> Verifying OTP…';
    if (errBanner) errBanner.classList.remove('show');

    try {
      const res = await api.auth.verifyOtp({
        target: '+91' + rawNum,
        otp,
        channel: 'whatsapp',
        type: 'whatsapp',
      });
      onAuthSuccess(res, 'WhatsApp verified! Welcome 🎉');
    } catch (err) {
      if (errBanner) {
        errText.textContent = err.message || 'Invalid or expired OTP code.';
        errBanner.classList.add('show');
      }
      verifyBtn.disabled = false;
      verifyBtn.innerHTML = origHtml;
    }
  });
}

/* ═══════════════════════════════════════════════════
   4. GMAIL / EMAIL + OTP LOGIN
   ═══════════════════════════════════════════════════ */
function initEmailOtpLogin() {
  const form = document.getElementById('email-otp-form');
  if (!form) return;

  const emailInput = document.getElementById('email-otp-target');
  const sendBtn = document.getElementById('send-email-otp-btn');
  const otpBox = document.getElementById('email-otp-box');
  const otpInput = document.getElementById('email-otp-code');
  const verifyBtn = document.getElementById('verify-email-otp-btn');
  const statusWrap = document.getElementById('email-otp-status');
  const statusMsg = document.getElementById('email-otp-status-msg');
  const timerText = document.getElementById('email-otp-timer');
  const chipContainer = document.getElementById('email-demo-chip');
  const errBanner = document.getElementById('login-error');
  const errText = document.getElementById('login-error-text') || errBanner;

  // Send Email OTP
  sendBtn?.addEventListener('click', async () => {
    const email = emailInput.value.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      if (errBanner) {
        errText.textContent = 'Please enter a valid Gmail / Email address.';
        errBanner.classList.add('show');
      }
      emailInput.focus();
      return;
    }
    if (errBanner) errBanner.classList.remove('show');

    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending…';

    try {
      const res = await api.auth.sendOtp({ target: email, channel: 'email', type: 'email' });

      // Reveal OTP inputs
      otpBox.style.display = 'block';
      verifyBtn.disabled = false;
      statusWrap.style.display = 'flex';
      statusMsg.textContent = res.message || `Code dispatched to ${email}.`;

      // Show dev demo quick-fill chip
      if (res.demoCode && chipContainer) {
        chipContainer.style.display = 'block';
        chipContainer.innerHTML = `
          <button type="button" class="otp-chip-badge" id="email-quick-fill-btn">
            ⚡ Quick-fill received OTP: <strong>${res.demoCode}</strong>
          </button>
        `;
        document.getElementById('email-quick-fill-btn')?.addEventListener('click', () => {
          otpInput.value = res.demoCode;
          verifyBtn.focus();
        });
      }

      if (window.AppState && AppState.showToast) {
        AppState.showToast(`Verification code dispatched to ${email}!`, 'info');
      }

      startCountdown(sendBtn, timerText, 60);
      otpInput.focus();
    } catch (err) {
      if (errBanner) {
        errText.textContent = err.message || 'Failed to dispatch email OTP.';
        errBanner.classList.add('show');
      }
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send Code';
    }
  });

  // Verify Email OTP
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim().toLowerCase();
    const otp = otpInput.value.trim();

    if (!otp || otp.length < 4) {
      if (errBanner) {
        errText.textContent = 'Please enter the 6-digit verification code.';
        errBanner.classList.add('show');
      }
      otpInput.focus();
      return;
    }

    verifyBtn.disabled = true;
    const origHtml = verifyBtn.innerHTML;
    verifyBtn.innerHTML = '<span class="spinner spinner-sm"></span> Verifying OTP…';
    if (errBanner) errBanner.classList.remove('show');

    try {
      const res = await api.auth.verifyOtp({
        target: email,
        otp,
        channel: 'email',
        type: 'email',
      });
      onAuthSuccess(res, 'Email verified! Welcome 🎉');
    } catch (err) {
      if (errBanner) {
        errText.textContent = err.message || 'Invalid or expired OTP code.';
        errBanner.classList.add('show');
      }
      verifyBtn.disabled = false;
      verifyBtn.innerHTML = origHtml;
    }
  });
}

/* ═══════════════════════════════════════════════════
   5. TELEGRAM OTP LOGIN (100% FREE PRODUCTION)
   ═══════════════════════════════════════════════════ */
function initTelegramOtpLogin() {
  const form = document.getElementById('telegram-otp-form');
  if (!form) return;

  const targetInput = document.getElementById('telegram-target');
  const sendBtn = document.getElementById('send-telegram-otp-btn');
  const otpBox = document.getElementById('telegram-otp-box');
  const otpInput = document.getElementById('telegram-otp-code');
  const verifyBtn = document.getElementById('verify-telegram-otp-btn');
  const statusWrap = document.getElementById('telegram-otp-status');
  const statusMsg = document.getElementById('telegram-otp-status-msg');
  const timerText = document.getElementById('telegram-otp-timer');
  const chipContainer = document.getElementById('telegram-demo-chip');
  const errBanner = document.getElementById('login-error');
  const errText = document.getElementById('login-error-text') || errBanner;

  // Send Telegram OTP
  sendBtn?.addEventListener('click', async () => {
    const rawTarget = targetInput.value.trim();
    if (!rawTarget) {
      if (errBanner) {
        errText.textContent = 'Please enter your Telegram @username, Chat ID, or mobile number.';
        errBanner.classList.add('show');
      }
      targetInput.focus();
      return;
    }
    if (errBanner) errBanner.classList.remove('show');

    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending…';

    try {
      const res = await api.auth.sendOtp({ target: rawTarget, channel: 'telegram', type: 'telegram' });

      // Reveal OTP inputs
      otpBox.style.display = 'block';
      verifyBtn.disabled = false;
      statusWrap.style.display = 'flex';
      statusMsg.textContent = res.message || `Code dispatched to Telegram (${res.target || rawTarget}).`;

      // Show dev demo quick-fill chip
      if (res.demoCode && chipContainer) {
        chipContainer.style.display = 'block';
        chipContainer.innerHTML = `
          <button type="button" class="otp-chip-badge" id="tg-quick-fill-btn">
            ⚡ Quick-fill received OTP: <strong>${res.demoCode}</strong>
          </button>
        `;
        document.getElementById('tg-quick-fill-btn')?.addEventListener('click', () => {
          otpInput.value = res.demoCode;
          verifyBtn.focus();
        });
      }

      if (window.AppState && AppState.showToast) {
        AppState.showToast(`Telegram code dispatched to ${res.target || rawTarget}!`, 'info');
      }

      startCountdown(sendBtn, timerText, 60);
      otpInput.focus();
    } catch (err) {
      if (errBanner) {
        const rawMsg = err.message || 'Failed to dispatch Telegram OTP.';
        // Render rich clickable links if user needs to open bot
        errText.innerHTML = rawMsg.replace(
          /(https:\/\/t\.me\/[a-zA-Z0-9_]+)/g,
          '<a href="$1" target="_blank" rel="noopener" style="color:var(--gold-light);text-decoration:underline;font-weight:600;">$1</a>'
        );
        errBanner.classList.add('show');
      }
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send Code';
    }
  });

  // Verify Telegram OTP
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rawTarget = targetInput.value.trim();
    const otp = otpInput.value.trim();

    if (!otp || otp.length < 4) {
      if (errBanner) {
        errText.textContent = 'Please enter the 6-digit verification code.';
        errBanner.classList.add('show');
      }
      otpInput.focus();
      return;
    }

    verifyBtn.disabled = true;
    const origHtml = verifyBtn.innerHTML;
    verifyBtn.innerHTML = '<span class="spinner spinner-sm"></span> Verifying OTP…';
    if (errBanner) errBanner.classList.remove('show');

    try {
      const res = await api.auth.verifyOtp({
        target: rawTarget,
        otp,
        channel: 'telegram',
        type: 'telegram',
      });
      onAuthSuccess(res, 'Telegram verified! Welcome 🎉');
    } catch (err) {
      if (errBanner) {
        errText.textContent = err.message || 'Invalid or expired OTP code.';
        errBanner.classList.add('show');
      }
      verifyBtn.disabled = false;
      verifyBtn.innerHTML = origHtml;
    }
  });
}

/* ═══════════════════════════════════════════════════
   6. REGISTRATION FLOW WITH REAL-TIME STRENGTH
   ═══════════════════════════════════════════════════ */
function initRegistration() {
  const form = document.getElementById('register-form');
  if (!form) return;

  initPasswordToggle('password', 'toggle-password');
  initPasswordToggle('confirm-password', 'toggle-confirm-password');

  const pwdInput = form.querySelector('#password');
  const confirmPwdInput = form.querySelector('#confirm-password');
  const matchHint = document.getElementById('confirm-password-match');

  const reqLength = document.getElementById('req-length');
  const reqUpper = document.getElementById('req-upper');
  const reqLower = document.getElementById('req-lower');
  const reqNumber = document.getElementById('req-number');
  const reqSymbol = document.getElementById('req-symbol');

  function checkItem(el, passed) {
    if (!el) return;
    const icon = el.querySelector('.req-icon');
    if (passed) {
      el.classList.add('valid');
      el.classList.remove('invalid');
      if (icon) icon.textContent = '✓';
    } else {
      el.classList.remove('valid');
      el.classList.add('invalid');
      if (icon) icon.textContent = '○';
    }
  }

  function validateStrength(pwd) {
    const hasLen = pwd.length >= 8;
    const hasUp = /[A-Z]/.test(pwd);
    const hasLow = /[a-z]/.test(pwd);
    const hasNum = /[0-9]/.test(pwd);
    const hasSym = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pwd);

    checkItem(reqLength, hasLen);
    checkItem(reqUpper, hasUp);
    checkItem(reqLower, hasLow);
    checkItem(reqNumber, hasNum);
    checkItem(reqSymbol, hasSym);

    return hasLen && hasUp && hasLow && hasNum && hasSym;
  }

  function checkConfirmMatch() {
    if (!confirmPwdInput || !matchHint) return;
    const p1 = pwdInput?.value || '';
    const p2 = confirmPwdInput.value;
    if (!p2) {
      matchHint.style.display = 'none';
      return;
    }
    matchHint.style.display = 'block';
    if (p1 === p2) {
      matchHint.className = 'password-match-hint match';
      matchHint.textContent = '✓ Passwords match';
    } else {
      matchHint.className = 'password-match-hint mismatch';
      matchHint.textContent = '✗ Passwords do not match';
    }
  }

  pwdInput?.addEventListener('input', () => {
    validateStrength(pwdInput.value);
    checkConfirmMatch();
  });

  confirmPwdInput?.addEventListener('input', checkConfirmMatch);

  // Role selection
  document.querySelectorAll('.role-option').forEach((opt) => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.role-option').forEach((o) => o.classList.remove('selected'));
      opt.classList.add('selected');
      const radio = opt.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    const errBanner = document.getElementById('register-error');
    const name = form.querySelector('#name').value.trim();
    const email = form.querySelector('#email').value.trim();
    const rawPhone = form.querySelector('#register-phone')?.value.trim() || '';
    const phone = rawPhone ? (rawPhone.startsWith('+') ? rawPhone : '+91' + rawPhone) : '';
    const password = form.querySelector('#password').value;
    const confirmPassword = form.querySelector('#confirm-password').value;
    const language = form.querySelector('#language')?.value || 'en';
    const institution = form.querySelector('#institution')?.value?.trim() || '';
    const roleEl = form.querySelector('input[name="role"]:checked');
    const role = roleEl ? roleEl.value : 'visitor';

    if (errBanner) errBanner.classList.remove('show');

    if (!validateStrength(password)) {
      if (errBanner) {
        errBanner.textContent = 'Password must meet all 5 requirements: 8+ characters, uppercase, lowercase, number, and special symbol.';
        errBanner.classList.add('show');
      }
      pwdInput?.focus();
      return;
    }

    if (password !== confirmPassword) {
      if (errBanner) {
        errBanner.textContent = 'Passwords do not match.';
        errBanner.classList.add('show');
      }
      confirmPwdInput?.focus();
      return;
    }

    btn.disabled = true;
    const origHtml = btn.innerHTML;
    btn.innerHTML = '<span class="spinner spinner-sm"></span> Creating account…';

    try {
      const res = await api.auth.register({ name, email, phone, password, language, institution, role });
      onAuthSuccess(res, 'Account created! Welcome to the archive 🎉');
    } catch (err) {
      if (errBanner) {
        errBanner.textContent = err.message || 'Registration failed.';
        errBanner.classList.add('show');
      }
      btn.disabled = false;
      btn.innerHTML = origHtml;
    }
  });
}

/* ═══════════════════════════════════════════════════
   7. PASSWORD RESET MODAL & FLOW
   ═══════════════════════════════════════════════════ */
function initPasswordReset() {
  const forgotLink = document.getElementById('forgot-password-link');
  const modal = document.getElementById('reset-password-modal');
  const closeBtn = document.getElementById('close-reset-modal');
  if (!forgotLink || !modal) return;

  const reqForm = document.getElementById('forgot-request-form');
  const verifyForm = document.getElementById('forgot-verify-form');
  const resetEmailInput = document.getElementById('reset-email');
  const resetCodeInput = document.getElementById('reset-code');
  const resetNewPwdInput = document.getElementById('reset-new-password');
  const resetConfirmPwdInput = document.getElementById('reset-confirm-password');
  const errBanner = document.getElementById('reset-error-banner');
  const succBanner = document.getElementById('reset-success-banner');
  const demoChip = document.getElementById('reset-demo-chip');
  const matchHint = document.getElementById('reset-confirm-match');

  const reqLength = document.getElementById('reset-req-length');
  const reqUpper = document.getElementById('reset-req-upper');
  const reqLower = document.getElementById('reset-req-lower');
  const reqNumber = document.getElementById('reset-req-number');
  const reqSymbol = document.getElementById('reset-req-symbol');

  initPasswordToggle('reset-new-password', 'toggle-reset-new-pwd');

  function openModal() {
    modal.classList.add('active');
    errBanner.style.display = 'none';
    succBanner.style.display = 'none';
    reqForm.style.display = 'block';
    verifyForm.style.display = 'none';
    const loginEmail = document.getElementById('email')?.value?.trim();
    if (loginEmail && loginEmail.includes('@')) {
      resetEmailInput.value = loginEmail;
    }
    resetEmailInput.focus();
  }

  function closeModal() {
    modal.classList.remove('active');
  }

  forgotLink.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  function checkItem(el, passed) {
    if (!el) return;
    const icon = el.querySelector('.req-icon');
    if (passed) {
      el.classList.add('valid');
      el.classList.remove('invalid');
      if (icon) icon.textContent = '✓';
    } else {
      el.classList.remove('valid');
      el.classList.add('invalid');
      if (icon) icon.textContent = '○';
    }
  }

  function validateResetStrength(pwd) {
    const hasLen = pwd.length >= 8;
    const hasUp = /[A-Z]/.test(pwd);
    const hasLow = /[a-z]/.test(pwd);
    const hasNum = /[0-9]/.test(pwd);
    const hasSym = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pwd);

    checkItem(reqLength, hasLen);
    checkItem(reqUpper, hasUp);
    checkItem(reqLower, hasLow);
    checkItem(reqNumber, hasNum);
    checkItem(reqSymbol, hasSym);

    return hasLen && hasUp && hasLow && hasNum && hasSym;
  }

  function checkResetMatch() {
    if (!resetConfirmPwdInput || !matchHint) return;
    const p1 = resetNewPwdInput.value;
    const p2 = resetConfirmPwdInput.value;
    if (!p2) {
      matchHint.style.display = 'none';
      return;
    }
    matchHint.style.display = 'block';
    if (p1 === p2) {
      matchHint.className = 'password-match-hint match';
      matchHint.textContent = '✓ Passwords match';
    } else {
      matchHint.className = 'password-match-hint mismatch';
      matchHint.textContent = '✗ Passwords do not match';
    }
  }

  resetNewPwdInput?.addEventListener('input', () => {
    validateResetStrength(resetNewPwdInput.value);
    checkResetMatch();
  });

  resetConfirmPwdInput?.addEventListener('input', checkResetMatch);

  // Step 1: Send reset code
  reqForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = resetEmailInput.value.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      errBanner.textContent = 'Please enter a valid email address.';
      errBanner.style.display = 'block';
      return;
    }

    errBanner.style.display = 'none';
    const btn = document.getElementById('send-reset-code-btn');
    btn.disabled = true;
    const origHtml = btn.innerHTML;
    btn.innerHTML = '<span class="spinner spinner-sm"></span> Sending code…';

    try {
      const res = await api.auth.forgotPassword({ email });
      succBanner.textContent = res.message || 'Verification code sent to your email!';
      succBanner.style.display = 'block';

      reqForm.style.display = 'none';
      verifyForm.style.display = 'block';

      // Dev quick-fill chip
      if (res.demoCode && demoChip) {
        demoChip.style.display = 'block';
        demoChip.innerHTML = `
          <button type="button" class="otp-chip-badge" id="reset-chip-btn">
            ⚡ Quick-fill received reset code: <strong>${res.demoCode}</strong>
          </button>
        `;
        document.getElementById('reset-chip-btn')?.addEventListener('click', () => {
          resetCodeInput.value = res.demoCode;
          resetNewPwdInput.focus();
        });
      }

      resetCodeInput.focus();
    } catch (err) {
      errBanner.textContent = err.message || 'Failed to dispatch reset code.';
      errBanner.style.display = 'block';
      btn.disabled = false;
      btn.innerHTML = origHtml;
    }
  });

  // Step 2: Verify & Reset Password
  verifyForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = resetEmailInput.value.trim().toLowerCase();
    const token = resetCodeInput.value.trim();
    const newPassword = resetNewPwdInput.value;
    const confirmPassword = resetConfirmPwdInput.value;

    errBanner.style.display = 'none';

    if (!token || token.length < 4) {
      errBanner.textContent = 'Please enter the verification code.';
      errBanner.style.display = 'block';
      resetCodeInput.focus();
      return;
    }

    if (!validateResetStrength(newPassword)) {
      errBanner.textContent = 'Password must meet all 5 requirements: 8+ characters, uppercase, lowercase, number, and special symbol.';
      errBanner.style.display = 'block';
      resetNewPwdInput.focus();
      return;
    }

    if (newPassword !== confirmPassword) {
      errBanner.textContent = 'Passwords do not match.';
      errBanner.style.display = 'block';
      resetConfirmPwdInput.focus();
      return;
    }

    const btn = document.getElementById('submit-new-password-btn');
    btn.disabled = true;
    const origHtml = btn.innerHTML;
    btn.innerHTML = '<span class="spinner spinner-sm"></span> Updating password…';

    try {
      const res = await api.auth.resetPassword({ email, token, newPassword });
      succBanner.textContent = res.message || 'Password successfully updated! You can now log in.';
      succBanner.style.display = 'block';

      if (window.AppState && AppState.showToast) {
        AppState.showToast('Password updated! Sign in with your new password.', 'success');
      }

      // Pre-fill login email field
      const loginEmailField = document.getElementById('email');
      if (loginEmailField) loginEmailField.value = email;

      setTimeout(() => {
        closeModal();
      }, 1500);
    } catch (err) {
      errBanner.textContent = err.message || 'Failed to reset password.';
      errBanner.style.display = 'block';
      btn.disabled = false;
      btn.innerHTML = origHtml;
    }
  });
}

/* ═══════════════════════════════════════════════════
   8. REAL GOOGLE SIGN-IN & FALLBACK MODAL
   Mobile fix: pre-initialise token client eagerly before click,
   use One Tap bottom-sheet on mobile, redirect OAuth fallback.
   ═══════════════════════════════════════════════════ */

// Handles the implicit-grant access_token returned in the URL hash
// after launchGoogleOAuthRedirect() completes.
function handleGoogleOAuthRedirectCallback() {
  const hash = window.location.hash;
  if (!hash || !hash.includes('access_token=')) return;
  const params = new URLSearchParams(hash.slice(1));
  const accessToken = params.get('access_token');
  if (!accessToken) return;
  // Clean the token out of the address bar
  history.replaceState(null, '', window.location.pathname + window.location.search);
  submitGoogleAccessToken(accessToken);
}

// Detect mobile / touch-primary devices
function isMobileDevice() {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
    ('ontouchstart' in window && navigator.maxTouchPoints > 0)
  );
}

// Track Google initialization state across the page lifecycle
let isGoogleInitialized = false;
let googleTokenClient = null;
let isGoogleAuthProcessing = false;

function getGoogleClientId() {
  if (typeof window !== 'undefined' && window.GOOGLE_CLIENT_ID && !window.GOOGLE_CLIENT_ID.includes('demoarchive')) {
    return window.GOOGLE_CLIENT_ID;
  }
  const metaClient = document.querySelector('meta[name="google-signin-client_id"]')?.getAttribute('content');
  if (metaClient && !metaClient.includes('YOUR_CLIENT_ID')) {
    return metaClient;
  }
  return '782338228221-an7aut37hhgl908gi18tqro637g57eir.apps.googleusercontent.com';
}

function setGoogleButtonConnecting(btn) {
  if (!btn) return;
  btn.disabled = true;
  if (!btn.dataset.originalHtml) {
    btn.dataset.originalHtml = btn.innerHTML;
  }
  btn.innerHTML = `
    <span class="spinner spinner-sm" aria-hidden="true"></span>
    <span>Connecting to Google…</span>
  `;
  if (window.AppState && AppState.showToast) {
    AppState.showToast('Connecting to Google…', 'info');
  }
}

function resetGoogleButtonState(btn, errorMessage) {
  isGoogleAuthProcessing = false;
  const activeBtn = btn || document.getElementById('google-login-btn') || document.getElementById('google-register-btn');
  if (activeBtn) {
    activeBtn.disabled = false;
    if (activeBtn.dataset.originalHtml) {
      activeBtn.innerHTML = activeBtn.dataset.originalHtml;
    }
  }
  if (errorMessage) {
    const banner = document.getElementById('login-error') || document.getElementById('register-error');
    const textEl = document.getElementById('login-error-text') || banner;
    if (textEl) textEl.textContent = errorMessage;
    if (banner) banner.classList.add('show');
  }
}

function initGoogleAuth() {
  const loginGoogleBtn = document.getElementById('google-login-btn');
  const registerGoogleBtn = document.getElementById('google-register-btn');
  const gsiContainer = document.getElementById('google-gsi-container');
  const targetBtn = loginGoogleBtn || registerGoogleBtn;
  if (!targetBtn && !gsiContainer) return;

  const isRegister = !!registerGoogleBtn;
  let clientId = getGoogleClientId();

  // Non-blocking background fetch to sync client ID from backend if available
  fetch('/api/auth/config')
    .then((r) => r.json())
    .then((cfgData) => {
      if (cfgData.success && cfgData.googleClientId && !cfgData.googleClientId.includes('demoarchive')) {
        clientId = cfgData.googleClientId;
      }
    })
    .catch(() => {});

  // Polling helper for Google Identity Services SDK
  const waitForGoogleSdk = (timeoutMs = 4000) => {
    return new Promise((resolve) => {
      if (window.google && window.google.accounts) {
        return resolve(window.google);
      }
      let elapsed = 0;
      const interval = setInterval(() => {
        elapsed += 50;
        if (window.google && window.google.accounts) {
          clearInterval(interval);
          resolve(window.google);
        } else if (elapsed >= timeoutMs) {
          clearInterval(interval);
          resolve(null);
        }
      }, 50);
    });
  };

  // Helper to initialize GIS exactly once and render official button
  const setupGoogleServices = (googleSdk) => {
    if (isGoogleInitialized) return;
    if (!googleSdk || !googleSdk.accounts || !googleSdk.accounts.id) return;
    isGoogleInitialized = true;

    // A. Initialize Google Identity Services (official rendered button + ID token)
    try {
      googleSdk.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          resetGoogleButtonState();
          await window.handleGoogleCredentialResponse(response);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
        context: isRegister ? 'signup' : 'signin',
        use_fedcm_for_prompt: true,
      });

      if (gsiContainer) {
        const btnWidth = Math.min(320, Math.max(220, (gsiContainer.clientWidth || 300)));
        googleSdk.accounts.id.renderButton(gsiContainer, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: isRegister ? 'signup_with' : 'signin_with',
          shape: 'pill',
          logo_alignment: 'left',
          width: btnWidth,
        });

        // Make official container visible and hide fallback button
        gsiContainer.style.display = 'flex';
        if (loginGoogleBtn) loginGoogleBtn.style.display = 'none';
        if (registerGoogleBtn) registerGoogleBtn.style.display = 'none';
      }
    } catch (gsiErr) {
      console.warn('Google GSI renderButton:', gsiErr);
    }

    // B. Initialize Google OAuth2 Token Client (direct OAuth popup on button click)
    try {
      if (googleSdk.accounts.oauth2) {
        googleTokenClient = googleSdk.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              resetGoogleButtonState(null, tokenResponse.error_description || 'Google sign-in was cancelled.');
              return;
            }
            if (tokenResponse.access_token) {
              await submitGoogleAccessToken(tokenResponse.access_token);
            }
          },
          error_callback: (err) => {
            console.warn('Google OAuth popup error, falling back to redirect:', err);
            resetGoogleButtonState();
            launchGoogleOAuthRedirect();
          },
        });
      }
    } catch (oauthErr) {
      console.warn('Google OAuth2 initTokenClient:', oauthErr);
    }
  };

  // Start checking for Google SDK immediately in background
  if (window.google && window.google.accounts) {
    setupGoogleServices(window.google);
  } else {
    waitForGoogleSdk().then((googleSdk) => {
      if (googleSdk) setupGoogleServices(googleSdk);
    });
  }

  // Fallback Account Modal (for local offline testing or unconfigured origins)
  let modalOverlay = document.getElementById('google-auth-modal');
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.id = 'google-auth-modal';
    modalOverlay.className = 'google-modal-overlay';
    modalOverlay.innerHTML = `
      <div class="google-modal-box" role="dialog" aria-labelledby="google-modal-title" aria-modal="true">
        <div class="google-modal-header">
          <button type="button" class="google-modal-close" id="close-google-modal" aria-label="Close">&times;</button>
          <svg class="google-icon" viewBox="0 0 24 24" width="36" height="36" aria-hidden="true" style="margin-bottom:8px;">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <h2 id="google-modal-title" style="font-family:var(--font-display);font-size:1.35rem;margin-bottom:4px;color:var(--text);">Google Sign-In Fallback</h2>
          <p style="font-size:0.85rem;color:var(--text-muted);">Choose a verified test account or enter your Gmail to continue</p>
        </div>

        <div class="google-account-list">
          <button type="button" class="google-account-item" data-email="researcher@ambedkar-archive.in" data-name="Archival Researcher">
            <div class="google-avatar" style="background:#1a73e8;">AR</div>
            <div style="flex:1;">
              <div style="font-weight:600;font-size:0.95rem;color:var(--text);">Archival Researcher</div>
              <div style="font-size:0.8rem;color:var(--text-muted);">researcher@ambedkar-archive.in</div>
            </div>
            <span style="color:var(--gold-light);font-size:1.1rem;">→</span>
          </button>

          <button type="button" class="google-account-item" data-email="admin@ambedkar-archive.in" data-name="Archive Administrator">
            <div class="google-avatar" style="background:#ea4335;">AA</div>
            <div style="flex:1;">
              <div style="font-weight:600;font-size:0.95rem;color:var(--text);">Archive Administrator</div>
              <div style="font-size:0.8rem;color:var(--text-muted);">admin@ambedkar-archive.in</div>
            </div>
            <span style="color:var(--gold-light);font-size:1.1rem;">→</span>
          </button>

          <button type="button" class="google-account-item" data-email="visitor@ambedkar-archive.in" data-name="Heritage Archive Visitor">
            <div class="google-avatar" style="background:#34a853;">HV</div>
            <div style="flex:1;">
              <div style="font-weight:600;font-size:0.95rem;color:var(--text);">Heritage Archive Visitor</div>
              <div style="font-size:0.8rem;color:var(--text-muted);">visitor@ambedkar-archive.in</div>
            </div>
            <span style="color:var(--gold-light);font-size:1.1rem;">→</span>
          </button>
        </div>

        <div class="google-modal-custom">
          <form id="google-custom-form" style="display:flex;gap:8px;flex-direction:column;">
            <label for="google-custom-email" style="font-size:0.8rem;font-weight:600;color:var(--text-muted);">Or enter your Google / Gmail account:</label>
            <div style="display:flex;gap:8px;">
              <input id="google-custom-email" type="email" placeholder="you@gmail.com" class="input" style="flex:1;font-size:0.85rem;" required />
              <button type="submit" class="btn btn-primary btn-sm" style="border-radius:var(--radius-full);white-space:nowrap;">Continue →</button>
            </div>
          </form>
        </div>
      </div>
    `;
    document.body.appendChild(modalOverlay);

    // Modal close handling
    document.getElementById('close-google-modal')?.addEventListener('click', () => modalOverlay.classList.remove('active'));
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) modalOverlay.classList.remove('active');
    });

    // Account select clicks
    modalOverlay.querySelectorAll('.google-account-item').forEach((item) => {
      item.addEventListener('click', () => {
        const email = item.getAttribute('data-email');
        const name = item.getAttribute('data-name');
        modalOverlay.classList.remove('active');
        submitGoogleProfile({ email, name });
      });
    });

    // Custom Gmail submission
    document.getElementById('google-custom-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('google-custom-email');
      const email = input.value.trim().toLowerCase();
      if (!email) return;
      const name = email.split('@')[0].replace(/[._]/g, ' ');
      modalOverlay.classList.remove('active');
      submitGoogleProfile({ email, name });
    });
  }

  // Handle implicit-grant redirect callback (fires if we came back from launchGoogleOAuthRedirect)
  handleGoogleOAuthRedirectCallback();

  // Redirect-based OAuth — works on every mobile browser without popups
  const launchGoogleOAuthRedirect = () => {
    if (!clientId) {
      resetGoogleButtonState();
      modalOverlay?.classList.add('active');
      return;
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: window.location.origin + window.location.pathname,
      response_type: 'token',
      scope: 'email profile openid',
      prompt: 'select_account',
      state: isRegister ? 'register' : 'login',
    });
    sessionStorage.setItem('google_oauth_return', window.location.href);
    window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString();
  };

  // Button click handler — ATTACHED SYNCHRONOUSLY, IMMEDIATE ONE-TAP FLOW
  const handleGoogleClick = async (e) => {
    e.preventDefault();
    if (isGoogleAuthProcessing) return; // Prevent duplicate multi-taps
    isGoogleAuthProcessing = true;

    const activeBtn = e.currentTarget;
    setGoogleButtonConnecting(activeBtn);

    try {
      // If Google SDK is not yet ready, wait briefly for it (up to 2s)
      let googleSdk = window.google && window.google.accounts ? window.google : await waitForGoogleSdk(2000);

      if (googleSdk) {
        setupGoogleServices(googleSdk);
      }

      // If tokenClient is ready, invoke immediate OAuth flow
      if (googleTokenClient) {
        googleTokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      }

      // If token client is not available, launch redirect immediately
      if (clientId) {
        launchGoogleOAuthRedirect();
        return;
      }

      // Offline fallback modal
      resetGoogleButtonState(activeBtn);
      modalOverlay?.classList.add('active');
    } catch (err) {
      console.error('Google Sign-In click error:', err);
      resetGoogleButtonState(activeBtn, err.message || 'Could not connect to Google.');
    }
  };

  // ATTACH CLICK LISTENERS IMMEDIATELY AND SYNCHRONOUSLY
  [loginGoogleBtn, registerGoogleBtn].filter(Boolean).forEach((btn) => {
    btn.addEventListener('click', handleGoogleClick);
  });
}

/* ═══════════════════════════════════════════════════
   HELPER UTILITIES
   ═══════════════════════════════════════════════════ */
async function submitGoogleCredential(credential) {
  const banner = document.getElementById('login-error') || document.getElementById('register-error');
  if (banner) banner.classList.remove('show');

  if (window.AppState && AppState.showToast) {
    AppState.showToast('Connecting with Google…', 'info');
  }

  try {
    const res = await api.auth.googleLogin({ credential });
    onAuthSuccess(res, `Welcome, ${res.user.name.split(' ')[0]}! Signed in with Google 🎉`);
  } catch (err) {
    if (banner) {
      banner.textContent = err.message || 'Google sign-in failed.';
      banner.classList.add('show');
    }
  }
}

async function submitGoogleAccessToken(accessToken) {
  const banner = document.getElementById('login-error') || document.getElementById('register-error');
  if (banner) banner.classList.remove('show');

  if (window.AppState && AppState.showToast) {
    AppState.showToast('Verifying Google authorization…', 'info');
  }

  try {
    const res = await api.auth.googleLogin({ accessToken });
    onAuthSuccess(res, `Welcome, ${res.user.name.split(' ')[0]}! Signed in with Google 🎉`);
  } catch (err) {
    if (banner) {
      banner.textContent = err.message || 'Google authorization failed.';
      banner.classList.add('show');
    }
  }
}

async function submitGoogleProfile({ email, name }) {
  const banner = document.getElementById('login-error') || document.getElementById('register-error');
  if (banner) banner.classList.remove('show');

  if (window.AppState && AppState.showToast) {
    AppState.showToast('Authenticating with account…', 'info');
  }

  try {
    const res = await api.auth.googleLogin({
      email,
      name,
      googleId: 'g_' + Math.random().toString(36).substring(2, 12),
      picture: '',
    });
    onAuthSuccess(res, `Welcome, ${res.user.name.split(' ')[0]}! Signed in 🎉`);
  } catch (err) {
    if (banner) {
      banner.textContent = err.message || 'Authentication failed.';
      banner.classList.add('show');
    }
  }
}

function onAuthSuccess(res, toastMsg) {
  if (window.AppState) {
    AppState.setAuthSession(res.token, res.user);
    if (AppState.showToast) {
      AppState.showToast(toastMsg, 'success');
    }
  } else {
    localStorage.setItem('auth_token', res.token);
    localStorage.setItem('auth_user', JSON.stringify(res.user));
  }

  const redirect = sessionStorage.getItem('redirect_after_login');
  sessionStorage.removeItem('redirect_after_login');
  setTimeout(() => {
    window.location.href = redirect || 'dashboard.html';
  }, 750);
}

function startCountdown(buttonEl, textEl, seconds) {
  let remaining = seconds;
  buttonEl.disabled = true;
  textEl.textContent = `(Resend in ${remaining}s)`;

  const interval = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) {
      clearInterval(interval);
      buttonEl.disabled = false;
      buttonEl.textContent = 'Resend OTP';
      textEl.textContent = '';
    } else {
      textEl.textContent = `(Resend in ${remaining}s)`;
    }
  }, 1000);
}

function initPasswordToggle(inputId, btnId) {
  const input = document.getElementById(inputId);
  const btn = document.getElementById(btnId);
  if (!input || !btn) return;
  btn.addEventListener('click', () => {
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.innerHTML = show ? '🙈' : '👁';
    btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  });
}

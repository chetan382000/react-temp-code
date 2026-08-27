import './App.css'
import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2, CircleUserRound, LogOut, ShieldCheck } from 'lucide-react'
import { request } from './api/client'

function saveSession(data) {
  if (!data?.auth?.accessToken) return
  localStorage.setItem('auth', JSON.stringify(data))
}

function getSession() {
  try { return JSON.parse(localStorage.getItem('auth')) } catch { return null }
}

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [step, setStep] = useState('form')
  const [form, setForm] = useState({ name: '', email: '', countryCode: '+91', mobileNumber: '', password: '', confirmPassword: '' })
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value })

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const payload = await request(mode === 'login' ? '/auth/login' : '/auth/register', {
        method: 'POST', body: JSON.stringify(mode === 'login' ? { email: form.email, password: form.password } : form),
      })
      const data = payload.data
      if (data?.auth?.accessToken) saveSession(data)
      if (mode === 'login' && payload.message?.toLowerCase().includes('otp')) setStep('otp')
      else if (mode === 'register') setStep('otp')
      else onAuthenticated(data)
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  async function verify(event) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const payload = await request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ type: 1, email: form.email, otp: Number(otp) }) })
      saveSession(payload.data); onAuthenticated(payload.data)
    } catch (requestError) { setError(requestError.message) } finally { setBusy(false) }
  }

  const switchMode = (nextMode) => { setMode(nextMode); setStep('form'); setError('') }

  return <main className="auth-layout">
    <section className="intro-panel">
      <div className="brand-mark"><ShieldCheck size={22} /> northstar</div>
      <div className="intro-copy"><p className="eyebrow">A calmer way to begin</p><h1>Make your next move with clarity.</h1><p className="intro-text">Your account is the first step toward a focused, personal workspace.</p></div>
      <div className="intro-footer"><span>01</span><span className="line" /><span>Simple. Secure. Yours.</span></div>
    </section>
    <section className="form-panel">
      {step === 'form' ? <>
        <div className="form-heading"><p className="eyebrow">Welcome back</p><h2>{mode === 'login' ? 'Sign in to Northstar' : 'Create your account'}</h2><p>{mode === 'login' ? 'Pick up where you left off.' : 'Set up your personal workspace in a minute.'}</p></div>
        <div className="mode-switch"><button className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>Sign in</button><button className={mode === 'register' ? 'active' : ''} onClick={() => switchMode('register')}>Register</button></div>
        <form onSubmit={submit}>
          {mode === 'register' && <><label>Full name<input name="name" value={form.name} onChange={update} placeholder="Chetan Sharma" required /></label><div className="two-fields"><label>Code<input name="countryCode" value={form.countryCode} onChange={update} required /></label><label>Mobile number<input name="mobileNumber" value={form.mobileNumber} onChange={update} placeholder="9876543210" required /></label></div></>}
          <label>Email address<input name="email" type="email" value={form.email} onChange={update} placeholder="you@example.com" required /></label>
          <label>Password<input name="password" type="password" value={form.password} onChange={update} placeholder="Minimum 8 characters" required /></label>
          {mode === 'register' && <label>Confirm password<input name="confirmPassword" type="password" value={form.confirmPassword} onChange={update} required /></label>}
          {error && <p className="error">{error}</p>}
          <button className="primary-button" disabled={busy}>{busy ? 'Please wait...' : mode === 'login' ? 'Continue' : 'Create account'} <ArrowRight size={18} /></button>
        </form>
        {mode === 'login' && <p className="fine-print">By continuing, you agree to our terms and privacy policy.</p>}
      </> : <form className="otp-view" onSubmit={verify}>
        <div className="otp-icon"><CheckCircle2 size={26} /></div><p className="eyebrow">One more step</p><h2>Verify your email</h2><p>Enter the six-digit code sent to <strong>{form.email}</strong>.</p><label>Verification code<input className="otp-input" inputMode="numeric" maxLength="6" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} placeholder="123456" required /></label>{error && <p className="error">{error}</p>}<button className="primary-button" disabled={busy}>{busy ? 'Verifying...' : 'Verify and enter'} <ArrowRight size={18} /></button><p className="demo-note">Local development code: <strong>123456</strong></p><button type="button" className="text-button" onClick={() => setStep('form')}>Use a different email</button>
      </form>}
    </section>
  </main>
}

function Home({ session, onLogout }) {
  const [profile, setProfile] = useState(session)
  const [loading, setLoading] = useState(true)
  useEffect(() => { request('/user/get-profile', { headers: { Authorization: `Bearer ${session.auth.accessToken}` } }).then((payload) => setProfile({ ...session, ...payload.data })).catch(() => {}).finally(() => setLoading(false)) }, [session])
  const name = profile?.name || profile?.data?.name || 'there'
  return <main className="home-shell"><header className="topbar"><div className="brand-mark"><ShieldCheck size={22} /> northstar</div><button className="logout-button" onClick={onLogout}><LogOut size={17} /> Sign out</button></header><section className="home-content"><div className="welcome-row"><div><p className="eyebrow">Your workspace</p><h1>Good to see you, {name.split(' ')[0]}.</h1><p className="intro-text">Everything is ready. This is your starting point.</p></div><div className="avatar"><CircleUserRound size={31} /></div></div><div className="status-card"><div className="status-icon"><CheckCircle2 size={22} /></div><div><p className="card-label">Account status</p><h3>{loading ? 'Loading your profile...' : 'You are all set'}</h3><p>{loading ? 'Connecting to your workspace.' : 'Your email is verified and your session is active.'}</p></div></div><div className="profile-summary"><p className="eyebrow">Profile details</p><div className="profile-grid"><div><span>Name</span><strong>{name}</strong></div><div><span>Email</span><strong>{profile?.email || profile?.data?.email || 'Not available'}</strong></div></div></div></section></main>
}

function App() {
  const [session, setSession] = useState(getSession)
  return session ? <Home session={session} onLogout={() => { localStorage.removeItem('auth'); setSession(null) }} /> : <AuthScreen onAuthenticated={setSession} />
}

export default App

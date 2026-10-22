import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, Mail, Phone, User } from 'lucide-react'
import { useStore } from '../lib/store'
import { Logo } from '../components/ui'

// Mock auth: accepts any details and stores the profile locally. Replace with a real auth provider.
export default function Auth({ mode }: { mode: 'login' | 'register' }) {
  const { login, toast } = useStore()
  const navigate = useNavigate()
  const [sp] = useSearchParams()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const isRegister = mode === 'register'

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (phone.replace(/\D/g, '').length < 10) return setError('Enter a valid phone number')
    if (password.length < 6) return setError('Password must be at least 6 characters')
    if (isRegister && name.trim().length < 2) return setError('Enter your full name')
    login({ name: isRegister ? name.trim() : name.trim() || 'House4Rent user', phone: phone.trim(), email: email.trim() || undefined })
    toast(isRegister ? 'Welcome to House4Rent.ng!' : 'Signed in')
    navigate(sp.get('next') ?? '/')
  }

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-logo">
          <Logo />
        </div>
        <h1>{isRegister ? 'Create your account' : 'Sign in'}</h1>
        <p className="muted">{isRegister ? 'Post properties, save adverts and chat with sellers.' : 'Welcome back. Sign in to manage your adverts and messages.'}</p>
        <form className="form" onSubmit={submit}>
          {(isRegister || mode === 'login') && isRegister && (
            <label className="input-icon">
              <User size={17} />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" autoComplete="name" />
            </label>
          )}
          <label className="input-icon">
            <Phone size={17} />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" inputMode="tel" autoComplete="tel" />
          </label>
          {isRegister && (
            <label className="input-icon">
              <Mail size={17} />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" type="email" autoComplete="email" />
            </label>
          )}
          <label className="input-icon">
            <Lock size={17} />
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} />
          </label>
          {error && <span className="field-error">{error}</span>}
          <button className="btn btn-primary block lg">{isRegister ? 'Register' : 'Sign in'}</button>
        </form>
        <p className="auth-switch">
          {isRegister ? (
            <>
              Already have an account? <Link to="/login">Sign in</Link>
            </>
          ) : (
            <>
              New to House4Rent.ng? <Link to="/register">Create an account</Link>
            </>
          )}
        </p>
        <p className="muted small center">Demo: any phone number and a 6+ character password will work.</p>
      </div>
    </div>
  )
}

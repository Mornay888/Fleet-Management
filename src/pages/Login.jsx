import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setMessage(''); setLoading(true)
    if (mode === 'signin') {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
    } else {
      const { error } = await signUp(email, password, fullName)
      if (error) setError(error.message)
      else setMessage('Account created! Check your email to confirm, then sign in.')
    }
    setLoading(false)
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          <i className="ti ti-fuel" /> FuelTrack Pro
        </div>
        <div className="login-sub">Fleet & fuel management</div>

        {error && <div className="error-msg"><i className="ti ti-alert-circle" /> {error}</div>}
        {message && <div style={{background:'#EAF3DE',color:'#27500A',padding:'8px 12px',borderRadius:8,fontSize:13,marginBottom:12}}>{message}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="form-group">
              <label>Full name</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" required />
            </div>
          )}
          <div className="form-group">
            <label>Email address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button type="submit" className="primary" disabled={loading}>
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div style={{marginTop:16,textAlign:'center',fontSize:13,color:'#6b6b65'}}>
          {mode === 'signin'
            ? <span>No account? <button style={{border:'none',background:'none',color:'var(--accent)',cursor:'pointer',padding:0}} onClick={() => setMode('signup')}>Sign up</button></span>
            : <span>Have an account? <button style={{border:'none',background:'none',color:'var(--accent)',cursor:'pointer',padding:0}} onClick={() => setMode('signin')}>Sign in</button></span>
          }
        </div>
      </div>
    </div>
  )
}

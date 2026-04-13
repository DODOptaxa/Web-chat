import { useState } from 'react'
import { login, register } from '../api/auth'
import { useChatContext } from '../context/ChatContext'
import ThemeToggle from './ThemeToggle'

type Tab = 'login' | 'register'

export default function LoginScreen() {
  const { enterChat, state } = useChatContext()
  const [tab, setTab] = useState<Tab>('login')
  const [error, setError] = useState('')

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [userName, setUserName] = useState('')
  const [emailReg, setEmailReg] = useState('')
  const [passReg, setPassReg]   = useState('')

  const [showPassLogin, setShowPassLogin] = useState(false)
  const [showPassReg, setShowPassReg]     = useState(false)

  async function handleLogin() {
    if (!email || !password) return
    setError('')
    try {
      const user = await login(email, password)
      await enterChat(user)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  async function handleRegister() {
    if (!userName || !emailReg || !passReg) return
    setError('')
    try {
      const user = await register(userName, emailReg, passReg)
      await enterChat(user)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  return (
    <>
      <div className="bg-grid" />
      <div className="bg-glow glow-1" />
      <div className="bg-glow glow-2" />
      <ThemeToggle />

      <div id="app">
        <div id="login-screen">
          <div id="online-badge">
            <span className="badge-pulse" />
            <span id="online-count">
              {state.onlineCount != null ? `${state.onlineCount} человек` : 'Подключение...'}
            </span>
            <span className="badge-sep" />
            <span className="badge-label">сейчас в сети</span>
          </div>

          <div className="login-card">
            <div className="card-shimmer" />
            <div className="login-art" aria-hidden="true">
              <img src="/assets/ddd.gif" alt="" />
            </div>
            <div className="login-body">
              <div className="login-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <h1 className="login-heading">Добро <em>пожаловать</em></h1>
              <p className="login-sub">Войдите или создайте аккаунт</p>

              <div className="auth-tabs">
                <button className={`auth-tab${tab === 'login' ? ' active' : ''}`} onClick={() => { setTab('login'); setError('') }}>Войти</button>
                <button className={`auth-tab${tab === 'register' ? ' active' : ''}`} onClick={() => { setTab('register'); setError('') }}>Регистрация</button>
              </div>

              {error && (
                <div id="auth-error" className="auth-error">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span>{error}</span>
                </div>
              )}

              {tab === 'login' && (
                <div className="form-fields tab-panel">
                  <div className="field-group">
                    <label className="field-label">Email</label>
                    <div className="field-wrap">
                      <input className="field-input" type="email" placeholder="your@email.com" autoComplete="email"
                        value={email} onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                    </div>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Пароль</label>
                    <div className="field-wrap">
                      <input className="field-input" type={showPassLogin ? 'text' : 'password'} placeholder="••••••••" autoComplete="current-password"
                        value={password} onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                      <button type="button" className="field-eye" tabIndex={-1} onClick={() => setShowPassLogin(v => !v)}>
                        {showPassLogin
                          ? <svg className="eye-closed" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          : <svg className="eye-open" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        }
                      </button>
                    </div>
                  </div>
                  <button className="btn-join login-btn" onClick={handleLogin}>
                    <span>Войти</span><span className="btn-arrow">→</span>
                  </button>
                </div>
              )}

              {tab === 'register' && (
                <div className="form-fields tab-panel">
                  <div className="field-group">
                    <label className="field-label">Отображаемое имя</label>
                    <div className="field-wrap">
                      <input className="field-input" placeholder="Как вас называть?" maxLength={30} autoComplete="off"
                        value={userName} onChange={e => setUserName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleRegister()} />
                    </div>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Email</label>
                    <div className="field-wrap">
                      <input className="field-input" type="email" placeholder="your@email.com" autoComplete="email"
                        value={emailReg} onChange={e => setEmailReg(e.target.value)} />
                    </div>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Пароль</label>
                    <div className="field-wrap">
                      <input className="field-input" type={showPassReg ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password"
                        value={passReg} onChange={e => setPassReg(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleRegister()} />
                      <button type="button" className="field-eye" tabIndex={-1} onClick={() => setShowPassReg(v => !v)}>
                        {showPassReg
                          ? <svg className="eye-closed" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                          : <svg className="eye-open" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        }
                      </button>
                    </div>
                  </div>
                  <button className="btn-join register-btn" onClick={handleRegister}>
                    <span>Создать аккаунт</span><span className="btn-arrow">→</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

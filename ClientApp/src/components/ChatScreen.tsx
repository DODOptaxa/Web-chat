import { useState } from 'react'
import { login, register } from '../api/auth'
import { useChatContext } from '../context/ChatContext'
import ThemeToggle from './ThemeToggle'

type Tab = 'login' | 'register'


const IconEyeOpen = () => (
	<svg
		width='15'
		height='15'
		viewBox='0 0 24 24'
		fill='none'
		stroke='currentColor'
		strokeWidth='2'
		strokeLinecap='round'
		strokeLinejoin='round'
	>
		<path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
		<circle cx='12' cy='12' r='3' />
	</svg>
)

const IconEyeClosed = () => (
	<svg
		width='15'
		height='15'
		viewBox='0 0 24 24'
		fill='none'
		stroke='currentColor'
		strokeWidth='2'
		strokeLinecap='round'
		strokeLinejoin='round'
	>
		<path d='M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24' />
		<line x1='1' y1='1' x2='23' y2='23' />
	</svg>
)

const IconCheck = () => (
	<svg
		width='15'
		height='15'
		viewBox='0 0 24 24'
		fill='none'
		stroke='currentColor'
		strokeWidth='2.5'
		strokeLinecap='round'
		strokeLinejoin='round'
	>
		<polyline points='20 6 9 17 4 12' />
	</svg>
)

const IconSpinner = () => (
	<svg
		width='15'
		height='15'
		viewBox='0 0 24 24'
		fill='none'
		stroke='currentColor'
		strokeWidth='2.2'
		strokeLinecap='round'
		strokeLinejoin='round'
		style={{ animation: 'spin 1s linear infinite' }}
	>
		<path d='M21 12a9 9 0 1 1-6.219-8.56' />
	</svg>
)

// ── components ─────────────────────────────────────────────────────────────────

export default function LoginScreen() {
	const { enterChat, state } = useChatContext()

	const [tab, setTab] = useState<Tab>('login')
	const [error, setError] = useState('')

	// login
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [showPassLogin, setShowPassLogin] = useState(false)

	// register
	const [userName, setUserName] = useState('')
	const [emailReg, setEmailReg] = useState('')
	const [passReg, setPassReg] = useState('')
	const [showPassReg, setShowPassReg] = useState(false)

	// verif. email
	const [codeSent, setCodeSent] = useState(false)
	const [codeSending, setCodeSending] = useState(false)
	const [codeValue, setCodeValue] = useState('')
	const [codeSuccess, setCodeSuccess] = useState('')

	// ── event listeners ─────────────────────────────────────────────────────────────

	function switchTab(t: Tab) {
		setTab(t)
		setError('')
	}

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

	async function handleSendCode() {
		if (!emailReg) return
		setCodeSending(true)
		setError('')
		setCodeSuccess('')
		try {
			const res = await fetch(
				`/api/auth/send-code?email=${encodeURIComponent(emailReg)}`,
				{ method: 'POST' },
			)
			if (!res.ok) {
				const data = await res.json()
				throw new Error(data.message || 'Ошибка отправки')
			}
			setCodeSent(true)
			setCodeSuccess('Код отправлен на почту')
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : 'Ошибка')
		} finally {
			setCodeSending(false)
		}
	}

	async function handleRegister() {
		if (!userName || !emailReg || !passReg) return
		if (!codeSent) {
			setError('Сначала отправьте код подтверждения на email')
			return
		}
		if (!codeValue) {
			setError('Введите код из письма')
			return
		}
		setError('')
		try {
			const user = await register(userName, emailReg, passReg, codeValue)
			await enterChat(user)
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : 'Ошибка')
		}
	}

	// ── render ──────────────────────────────────────────────────────────────────

	return (
		<>
			<div className='bg-grid' />
			<div className='bg-glow glow-1' />
			<div className='bg-glow glow-2' />
			<ThemeToggle />

			<div id='app'>
				<div id='login-screen'>
					<div id='online-badge'>
						<span className='badge-pulse' />
						<span id='online-count'>
							{state.onlineCount != null
								? `${state.onlineCount} человек`
								: 'Подключение...'}
						</span>
						<span className='badge-sep' />
						<span className='badge-label'>сейчас в сети</span>
					</div>

					<div className='login-card'>
						<div className='card-shimmer' />
						<div className='login-art' aria-hidden='true'>
							<img src='/assets/ddd.gif' alt='' />
						</div>

						<div className='login-body'>
							<div className='login-icon'>
								<svg
									width='24'
									height='24'
									viewBox='0 0 24 24'
									fill='none'
									stroke='currentColor'
									strokeWidth='1.8'
									strokeLinecap='round'
									strokeLinejoin='round'
								>
									<path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
								</svg>
							</div>

							<h1 className='login-heading'>
								Добро <em>пожаловать</em>
							</h1>
							<p className='login-sub'>Войдите или создайте аккаунт</p>

							<div className='auth-tabs'>
								<button
									className={`auth-tab${tab === 'login' ? ' active' : ''}`}
									onClick={() => switchTab('login')}
								>
									Войти
								</button>
								<button
									className={`auth-tab${tab === 'register' ? ' active' : ''}`}
									onClick={() => switchTab('register')}
								>
									Регистрация
								</button>
							</div>

							{error && (
								<div id='auth-error' className='auth-error'>
									<svg
										width='14'
										height='14'
										viewBox='0 0 24 24'
										fill='none'
										stroke='currentColor'
										strokeWidth='2.2'
										strokeLinecap='round'
										strokeLinejoin='round'
									>
										<circle cx='12' cy='12' r='10' />
										<line x1='12' y1='8' x2='12' y2='12' />
										<line x1='12' y1='16' x2='12.01' y2='16' />
									</svg>
									<span>{error}</span>
								</div>
							)}

							{/* ── login ── */}
							{tab === 'login' && (
								<div className='form-fields tab-panel'>
									<div className='field-group'>
										<label className='field-label'>Email</label>
										<div className='field-wrap'>
											<input
												className='field-input'
												type='email'
												placeholder='your@email.com'
												autoComplete='email'
												value={email}
												onChange={e => setEmail(e.target.value)}
												onKeyDown={e => e.key === 'Enter' && handleLogin()}
											/>
										</div>
									</div>

									<div className='field-group'>
										<label className='field-label'>Пароль</label>
										<div className='field-wrap'>
											<input
												className='field-input'
												type={showPassLogin ? 'text' : 'password'}
												placeholder='••••••••'
												autoComplete='current-password'
												value={password}
												onChange={e => setPassword(e.target.value)}
												onKeyDown={e => e.key === 'Enter' && handleLogin()}
											/>
											<button
												type='button'
												className='field-eye'
												tabIndex={-1}
												onClick={() => setShowPassLogin(v => !v)}
											>
												{showPassLogin ? <IconEyeClosed /> : <IconEyeOpen />}
											</button>
										</div>
									</div>

									<button className='btn-join login-btn' onClick={handleLogin}>
										<span>Войти</span>
										<span className='btn-arrow'>→</span>
									</button>
								</div>
							)}

							{/* ── register ── */}
							{tab === 'register' && (
								<div className='form-fields tab-panel'>
									<div className='field-group'>
										<label className='field-label'>Отображаемое имя</label>
										<div className='field-wrap'>
											<input
												className='field-input'
												placeholder='Как вас называть?'
												maxLength={30}
												autoComplete='off'
												value={userName}
												onChange={e => setUserName(e.target.value)}
												onKeyDown={e => e.key === 'Enter' && handleRegister()}
											/>
										</div>
									</div>

									<div className='field-group'>
										<label className='field-label'>Email</label>
										<div className='field-wrap'>
											<input
												className='field-input'
												type='email'
												placeholder='your@email.com'
												autoComplete='email'
												value={emailReg}
												onChange={e => {
													setEmailReg(e.target.value)
													setCodeSent(false)
													setCodeSuccess('')
												}}
											/>
											<button
												type='button'
												className={[
													'field-eye',
													'send-code-btn',
													codeSending ? 'sending' : '',
													codeSent ? 'sent' : '',
												]
													.filter(Boolean)
													.join(' ')}
												title='Отправить код подтверждения'
												tabIndex={-1}
												onClick={handleSendCode}
												disabled={codeSending || !emailReg}
											>
												<span className='send-code-icon'>
													{codeSending ? <IconSpinner /> : <IconCheck />}
												</span>
											</button>
										</div>
										{codeSuccess && (
											<span className='field-hint field-hint--success'>
												{codeSuccess}
											</span>
										)}
									</div>

									<div
										className={`field-group${codeSent ? '' : ' field-group--disabled'}`}
									>
										<label className='field-label'>Код из письма</label>
										<div className='field-wrap'>
											<input
												className='field-input'
												type='text'
												placeholder='123456'
												maxLength={6}
												disabled={!codeSent}
												value={codeValue}
												onChange={e =>
													setCodeValue(e.target.value.replace(/\D/g, ''))
												}
												onKeyDown={e => e.key === 'Enter' && handleRegister()}
											/>
										</div>
									</div>

									<div className='field-group'>
										<label className='field-label'>Пароль</label>
										<div className='field-wrap'>
											<input
												className='field-input'
												type={showPassReg ? 'text' : 'password'}
												placeholder='••••••••'
												autoComplete='new-password'
												value={passReg}
												onChange={e => setPassReg(e.target.value)}
												onKeyDown={e => e.key === 'Enter' && handleRegister()}
											/>
											<button
												type='button'
												className='field-eye'
												tabIndex={-1}
												onClick={() => setShowPassReg(v => !v)}
											>
												{showPassReg ? <IconEyeClosed /> : <IconEyeOpen />}
											</button>
										</div>
									</div>

									<button
										className='btn-join register-btn'
										onClick={handleRegister}
									>
										<span>Создать аккаунт</span>
										<span className='btn-arrow'>→</span>
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

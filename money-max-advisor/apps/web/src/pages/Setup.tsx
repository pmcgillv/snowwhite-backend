import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

type MethodMode = 'checking_savings' | 'line_of_credit'

interface SetupState {
  institutionName: string
  methodMode: MethodMode
  paycheckSplit: number
  step: 1 | 2 | 3 | 4
}

export default function Setup() {
  const navigate = useNavigate()
  const [state, setState] = useState<SetupState>({
    institutionName: '',
    methodMode: 'checking_savings',
    paycheckSplit: 80,
    step: 1,
  })

  const totalSteps = 4

  function next() {
    if (state.step < totalSteps) {
      setState(s => ({ ...s, step: (s.step + 1) as SetupState['step'] }))
    } else {
      navigate('/app')
    }
  }

  function prev() {
    if (state.step > 1) {
      setState(s => ({ ...s, step: (s.step - 1) as SetupState['step'] }))
    }
  }

  return (
    <div className="app-page page-enter" role="main" aria-labelledby="setup-title">
      <header className="app-page__header">
        <h1 className="app-page__title" id="setup-title">Setup Wizard</h1>
        <p className="app-page__subtitle">Configure Ledgerline to match your financial situation.</p>
      </header>

      {/* Step progress */}
      <div className="step-progress" role="progressbar" aria-valuenow={state.step} aria-valuemin={1} aria-valuemax={totalSteps} aria-label={`Step ${state.step} of ${totalSteps}`}>
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`step-progress__dot${
              i + 1 < state.step ? ' step-progress__dot--complete' :
              i + 1 === state.step ? ' step-progress__dot--active' : ''
            }`}
          />
        ))}
      </div>

      <div className="setup-step">
        {state.step === 1 && (
          <Step1
            value={state.institutionName}
            onChange={v => setState(s => ({ ...s, institutionName: v }))}
          />
        )}
        {state.step === 2 && (
          <Step2
            value={state.methodMode}
            onChange={v => setState(s => ({ ...s, methodMode: v }))}
          />
        )}
        {state.step === 3 && (
          <Step3
            value={state.paycheckSplit}
            onChange={v => setState(s => ({ ...s, paycheckSplit: v }))}
          />
        )}
        {state.step === 4 && <Step4 state={state} />}

        <div style={{ display: 'flex', gap: 'var(--sp-3)', marginTop: 'var(--sp-6)' }}>
          {state.step > 1 && (
            <button className="btn btn-ghost" onClick={prev} aria-label="Previous step">
              Back
            </button>
          )}
          <button className="btn btn-primary" onClick={next} aria-label={state.step < totalSteps ? 'Next step' : 'Finish setup'}>
            {state.step < totalSteps ? 'Continue' : 'Finish Setup'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Step1({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <>
      <div className="setup-step__num">Step 1 of 4</div>
      <h2 className="setup-step__title">Connect Your Accounts</h2>
      <p className="setup-step__desc">
        Enter your primary financial institution. Ledgerline uses read-only access
        to import your balances and transactions — no credentials are stored.
      </p>
      <div className="form-group">
        <label className="form-label" htmlFor="institution">Primary Institution</label>
        <input
          id="institution"
          className="form-input"
          type="text"
          placeholder="e.g. Chase, Wells Fargo, Credit Union…"
          value={value}
          onChange={e => onChange(e.target.value)}
          aria-required="true"
        />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="firefly">Firefly III URL (optional)</label>
        <input
          id="firefly"
          className="form-input"
          type="url"
          placeholder="https://your-firefly-instance.com"
        />
      </div>
    </>
  )
}

function Step2({ value, onChange }: { value: MethodMode; onChange: (v: MethodMode) => void }) {
  return (
    <>
      <div className="setup-step__num">Step 2 of 4</div>
      <h2 className="setup-step__title">Choose Your Method</h2>
      <p className="setup-step__desc">
        How do you want Ledgerline to route extra cash to accelerate debt paydown?
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
        {(
          [
            {
              key: 'checking_savings' as const,
              label: 'Checking / Savings Float',
              desc: 'Use your checking and savings accounts as a float. Park extra cash and sweep toward debt each cycle.',
            },
            {
              key: 'line_of_credit' as const,
              label: 'Line of Credit Offset',
              desc: 'Use a low-interest line of credit as your primary account. Deposit your paycheck directly and pull for expenses — reducing average daily balance and interest.',
            },
          ] as const
        ).map(opt => (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            aria-pressed={value === opt.key}
            style={{
              background: value === opt.key ? 'var(--teal-10)' : 'var(--panel-lo)',
              border: `1px solid ${value === opt.key ? 'var(--teal)' : 'var(--border-hi)'}`,
              borderRadius: 'var(--r-lg)',
              padding: 'var(--sp-4) var(--sp-5)',
              textAlign: 'left',
              cursor: 'pointer',
              transition: 'border-color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out)',
            }}
          >
            <div style={{ fontWeight: 600, color: value === opt.key ? 'var(--teal)' : 'var(--sand)', marginBottom: 'var(--sp-1)' }}>
              {opt.label}
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--sand-60)', lineHeight: 1.5 }}>
              {opt.desc}
            </div>
          </button>
        ))}
      </div>
    </>
  )
}

function Step3({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <>
      <div className="setup-step__num">Step 3 of 4</div>
      <h2 className="setup-step__title">Paycheck Split</h2>
      <p className="setup-step__desc">
        What percentage of each paycheck should be earmarked for bills and debt
        servicing? The remainder becomes discretionary float.
      </p>
      <div className="form-group">
        <label className="form-label" htmlFor="split">
          Bills &amp; Debt Allocation — <strong style={{ color: 'var(--teal)' }}>{value}%</strong>
        </label>
        <input
          id="split"
          type="range"
          min={50}
          max={100}
          step={5}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--teal)', marginTop: 'var(--sp-2)' }}
          aria-label={`Allocation: ${value}%`}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--sand-30)', marginTop: 'var(--sp-1)' }}>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
    </>
  )
}

function Step4({ state }: { state: SetupState }) {
  return (
    <>
      <div className="setup-step__num">Step 4 of 4</div>
      <h2 className="setup-step__title">Review &amp; Confirm</h2>
      <p className="setup-step__desc">Everything looks right? Hit Finish Setup to start your action plan.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
        {[
          { label: 'Institution',     value: state.institutionName || '(none set)' },
          { label: 'Method',          value: state.methodMode === 'checking_savings' ? 'Checking / Savings Float' : 'Line of Credit Offset' },
          { label: 'Paycheck Split',  value: `${state.paycheckSplit}% to bills & debt` },
        ].map(r => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--sp-3)' }}>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--sand-60)' }}>{r.label}</span>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--sand)' }}>{r.value}</span>
          </div>
        ))}
      </div>
    </>
  )
}

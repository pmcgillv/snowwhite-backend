import { useState } from 'react'
import { IconInfo } from '../components/Icons'

interface Integration {
  id: string
  name: string
  description: string
  status: 'connected' | 'disconnected' | 'error'
}

const INTEGRATIONS: Integration[] = [
  { id: 'firefly', name: 'Firefly III',      description: 'Self-hosted finance manager — demo read-only sync', status: 'connected'    },
  { id: 'plaid',   name: 'Plaid',            description: 'Open banking account connection (read-only)',        status: 'disconnected' },
  { id: 'teller',  name: 'Teller',           description: 'US bank connectivity API (read-only)',               status: 'disconnected' },
]

type MethodMode = 'checking_savings' | 'line_of_credit'

export default function Settings() {
  const [methodMode, setMethodMode] = useState<MethodMode>('checking_savings')
  const [notifications, setNotifications] = useState(true)
  const [weeklyDigest, setWeeklyDigest] = useState(false)

  return (
    <div className="app-page page-enter" role="main" aria-labelledby="settings-title">
      <header className="app-page__header">
        <h1 className="app-page__title" id="settings-title">Settings</h1>
        <p className="app-page__subtitle">Method configuration, integrations, and preferences.</p>
      </header>

      <div className="readonly-notice" role="note" aria-label="Read-only notice">
        <span className="readonly-notice__icon" aria-hidden="true">
          <IconInfo size={16} />
        </span>
        <p className="readonly-notice__text">
          <strong>Read-only by design.</strong> Ledgerline never initiates payments,
          transfers, or account changes on your behalf. All integrations below
          use read-only API access only.
        </p>
      </div>

      {/* Method mode */}
      <section aria-labelledby="method-heading" style={{ marginBottom: 'var(--sp-8)' }}>
        <div className="section-header">
          <h2 className="section-header__title" id="method-heading">Acceleration Method</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          {(
            [
              { key: 'checking_savings' as const, label: 'Checking / Savings Float' },
              { key: 'line_of_credit'   as const, label: 'Line of Credit Offset'   },
            ] as const
          ).map(opt => (
            <label
              key={opt.key}
              className="settings-row"
              style={{ cursor: 'pointer' }}
              htmlFor={`method-${opt.key}`}
            >
              <div className="settings-row__info">
                <div className="settings-row__label">{opt.label}</div>
              </div>
              <input
                id={`method-${opt.key}`}
                type="radio"
                name="methodMode"
                value={opt.key}
                checked={methodMode === opt.key}
                onChange={() => setMethodMode(opt.key)}
                style={{ accentColor: 'var(--teal)', width: 18, height: 18 }}
                aria-label={opt.label}
              />
            </label>
          ))}
        </div>
      </section>

      {/* Notifications */}
      <section aria-labelledby="notif-heading" style={{ marginBottom: 'var(--sp-8)' }}>
        <div className="section-header">
          <h2 className="section-header__title" id="notif-heading">Notifications</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          <div className="settings-row">
            <div className="settings-row__info">
              <div className="settings-row__label">New Action Alerts</div>
              <div className="settings-row__desc">Get notified when new actions are generated</div>
            </div>
            <button
              className={`settings-toggle${notifications ? ' on' : ''}`}
              onClick={() => setNotifications(v => !v)}
              aria-pressed={notifications}
              aria-label="Toggle new action alerts"
            />
          </div>
          <div className="settings-row">
            <div className="settings-row__info">
              <div className="settings-row__label">Weekly Digest</div>
              <div className="settings-row__desc">Summary of your financial progress every Monday</div>
            </div>
            <button
              className={`settings-toggle${weeklyDigest ? ' on' : ''}`}
              onClick={() => setWeeklyDigest(v => !v)}
              aria-pressed={weeklyDigest}
              aria-label="Toggle weekly digest"
            />
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section aria-labelledby="integrations-heading">
        <div className="section-header">
          <h2 className="section-header__title" id="integrations-heading">Integrations</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          {INTEGRATIONS.map(intg => (
            <div key={intg.id} className="settings-row" aria-label={`Integration: ${intg.name}`}>
              <div className="settings-row__info">
                <div className="settings-row__label">{intg.name}</div>
                <div className="settings-row__desc">{intg.description}</div>
              </div>
              <span
                className={`badge ${intg.status === 'connected' ? 'badge-teal' : intg.status === 'error' ? 'badge-warning' : 'badge-muted'}`}
                aria-label={`Status: ${intg.status}`}
              >
                {intg.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

import { Heart, Flower, Globe, User, Sparkles, Car, Skull, Rocket, Cog, Orbit } from 'lucide-react'

export default function ControlPanel({ config, setConfig, gestureData }) {
  const templates = [
    { id: 'hearts', icon: Heart, label: 'Hearts' },
    { id: 'flowers', icon: Flower, label: 'Flowers' },
    { id: 'saturn', icon: Globe, label: 'Saturn' },
    { id: 'buddha', icon: User, label: 'Buddha' },
    { id: 'fireworks', icon: Sparkles, label: 'Fireworks' },
    { id: 'f1', icon: Car, label: 'F1 Car' },
    { id: 'dinosaur', icon: Skull, label: 'Dinosaur' },
    { id: 'starship', icon: Rocket, label: 'Starship' },
    { id: 'engine', icon: Cog, label: 'Engine' },
    { id: 'galaxy', icon: Orbit, label: 'Galaxy' },
  ]

  return (
    <div style={{
      position: 'absolute',
      bottom: '40px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '24px',
      background: 'rgba(20, 20, 20, 0.6)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      color: 'white',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
      minWidth: '400px',
      fontFamily: '"Inter", sans-serif'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, opacity: 0.9 }}>Particle Control</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', opacity: 0.7 }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: gestureData.tension > 0.1 ? '#4ade80' : '#ef4444',
            boxShadow: gestureData.tension > 0.1 ? '0 0 10px #4ade80' : 'none'
          }} />
          {gestureData.tension > 0.1 ? 'Hand Detected' : 'No Hand'}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        {templates.map(t => {
          const Icon = t.icon
          const isActive = config.template === t.id
          return (
            <button
              key={t.id}
              onClick={() => setConfig({ ...config, template: t.id })}
              style={{
                background: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                border: '1px solid',
                borderColor: isActive ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
                borderRadius: '12px',
                padding: '12px',
                cursor: 'pointer',
                color: 'white',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                width: '70px'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent'}
            >
              <Icon size={20} color={isActive ? config.color : 'white'} />
              <span style={{ fontSize: '10px', opacity: 0.8 }}>{t.label}</span>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
        <label style={{ fontSize: '14px', opacity: 0.8 }}>Color</label>
        <div style={{
          position: 'relative',
          width: '100%',
          height: '36px',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <input
            type="color"
            value={config.color}
            onChange={e => setConfig({ ...config, color: e.target.value })}
            style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              cursor: 'pointer',
              border: 'none',
              padding: 0,
              margin: 0
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', opacity: 0.5, marginTop: '4px' }}>
        <span>Tension: {(gestureData.tension * 100).toFixed(0)}%</span>
        <span>State: {gestureData.isClosed ? 'Closed' : 'Open'}</span>
      </div>
    </div>
  )
}

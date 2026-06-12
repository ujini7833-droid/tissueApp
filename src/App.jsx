import { useEffect, useRef, useState } from 'react'
import './App.css'

const MAX_TISSUES = 70
const TARGETS = [30, 100, 200]

function formatTime(milliseconds) {
  const minutes = Math.floor(milliseconds / 60000)
  const seconds = Math.floor((milliseconds % 60000) / 1000)
  const hundredths = Math.floor((milliseconds % 1000) / 10)

  return `${minutes > 0 ? `${minutes}:` : ''}${String(seconds).padStart(minutes > 0 ? 2 : 1, '0')}.${String(hundredths).padStart(2, '0')}`
}

function makeTissue(origin) {
  const direction = Math.random() > 0.5 ? 1 : -1

  const drift = (80 + Math.random() * 250) * direction

  return {
    id: crypto.randomUUID(),
    x: origin.x,
    y: origin.y,
    drift,
    driftMid: drift * 0.42,
    lift: 220 + Math.random() * 190,
    rotate: (160 + Math.random() * 360) * direction,
    startRotate: Math.random() * 28 - 14,
    duration: 2.3 + Math.random() * 1.8,
    delay: Math.random() * 0.08,
    size: 0.78 + Math.random() * 0.5,
    hue: Math.random() * 12 - 6,
    fold: Math.random() * 65 + 15,
  }
}

function App() {
  const [tissues, setTissues] = useState([])
  const [target, setTarget] = useState(null)
  const [count, setCount] = useState(0)
  const [phase, setPhase] = useState('select')
  const [elapsed, setElapsed] = useState(0)
  const boxRef = useRef(null)
  const countRef = useRef(0)
  const startTimeRef = useRef(null)
  const animationFrameRef = useRef(null)

  useEffect(() => {
    if (phase !== 'running') return undefined

    const updateTimer = () => {
      setElapsed(performance.now() - startTimeRef.current)
      animationFrameRef.current = requestAnimationFrame(updateTimer)
    }

    animationFrameRef.current = requestAnimationFrame(updateTimer)
    return () => cancelAnimationFrame(animationFrameRef.current)
  }, [phase])

  const chooseTarget = (amount) => {
    setTarget(amount)
    setCount(0)
    countRef.current = 0
    setElapsed(0)
    startTimeRef.current = null
    setTissues([])
    setPhase('ready')
  }

  const resetGame = () => {
    setTarget(null)
    setCount(0)
    countRef.current = 0
    setElapsed(0)
    startTimeRef.current = null
    setTissues([])
    setPhase('select')
  }

  const retryGame = () => chooseTarget(target)

  const pullTissue = (point) => {
    if (!target || phase === 'complete' || countRef.current >= target) return

    const now = performance.now()
    if (startTimeRef.current === null) {
      startTimeRef.current = now
      setPhase('running')
    }

    const nextCount = countRef.current + 1
    countRef.current = nextCount
    setCount(nextCount)

    const box = boxRef.current?.getBoundingClientRect()
    const origin = point ?? {
      x: box ? box.left + box.width / 2 : window.innerWidth / 2,
      y: box ? box.top + 42 : window.innerHeight / 2,
    }

    setTissues((current) => [
      ...current.slice(-(MAX_TISSUES - 1)),
      makeTissue(origin),
    ])

    if (nextCount >= target) {
      const finalTime = now - (startTimeRef.current ?? now)
      setElapsed(finalTime)
      setPhase('complete')
    }
  }

  const remaining = target ? Math.max(target - count, 0) : 0
  const progress = target ? (count / target) * 100 : 0

  if (phase === 'select') {
    return (
      <main className="selection-screen">
        <div className="selection-options" aria-label="목표 장수 선택">
          {TARGETS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => chooseTarget(amount)}
            >
              <strong>{amount}</strong>
              <span>장</span>
            </button>
          ))}
        </div>
      </main>
    )
  }

  return (
    <main className={`app phase-${phase}`}>
      <div className="background-shape shape-one" aria-hidden="true" />
      <div className="background-shape shape-two" aria-hidden="true" />

      <header className="topbar">
        <a className="brand" href="/" aria-label="뽀송한 하루 홈">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </a>
        <button type="button" className="clear-button" onClick={resetGame}>
          <span aria-hidden="true">↻</span>
          다시 선택
        </button>
      </header>

      <section className="intro">
        <p className="eyebrow">
          {phase === 'ready' ? '준비되면 첫 장을 뽑으세요' : '티슈 챌린지 진행 중'}
        </p>
        <h1>
          {remaining.toLocaleString()}장
          <br />
          <em>남았어요.</em>
        </h1>
        <p className="description">
          박스를 클릭할 때마다 한 장씩 날아가요.
          <br />
          리듬을 타고 촤르르 뽑아보세요.
        </p>
      </section>

      <section className="playground" aria-label="각티슈 챌린지">
        <div className="counter-card" aria-live="polite">
          <div className="timer">
            <span className="counter-label">경과 시간</span>
            <strong>{formatTime(elapsed)}</strong>
          </div>
          <div className="progress-track" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="box-stage">
          <div className="box-shadow" aria-hidden="true" />
          {phase === 'ready' && (
            <div className="click-guide" aria-hidden="true">
              <span className="click-guide-arrow">←</span>
              <strong>클릭해주세요!</strong>
            </div>
          )}
          <button
            ref={boxRef}
            type="button"
            className="tissue-box"
            onClick={() => pullTissue()}
            disabled={phase === 'complete'}
            aria-label="티슈 한 장 뽑기"
          >
            <span className="box-top">
              <span className="box-hole">
                <span className="ready-tissue" />
              </span>
            </span>
            <span className="box-front">
            </span>
            <span className="box-side" />
          </button>
          <p className="pull-hint">
            <span aria-hidden="true">↑</span>
            {phase === 'ready'
              ? '첫 클릭과 함께 타이머가 시작돼요'
              : '빠르게 클릭해 티슈를 모두 뽑으세요'}
          </p>
        </div>
      </section>

      <p className="footer-note">빠르게, 하지만 손목은 소중하게.</p>

      {phase === 'complete' && (
        <section className="result-overlay" aria-modal="true" role="dialog">
          <div className="result-card">
            <span className="result-sparkle" aria-hidden="true">✦</span>
            <p className="eyebrow">챌린지 완료</p>
            <h2>{target}장을 모두 뽑았어요!</h2>
            <div className="final-time">
              <span>최종 기록</span>
              <strong>{formatTime(elapsed)}</strong>
              <small>초</small>
            </div>
            <p>한 장당 평균 {formatTime(elapsed / target)}초</p>
            <div className="result-actions">
              <button type="button" className="primary-action" onClick={retryGame}>
                같은 장수로 다시
              </button>
              <button type="button" className="secondary-action" onClick={resetGame}>
                다른 장수 선택
              </button>
            </div>
          </div>
        </section>
      )}

      <div className="tissue-layer" aria-hidden="true">
        {tissues.map((tissue) => (
          <span
            key={tissue.id}
            className="flying-tissue"
            style={{
              '--x': `${tissue.x}px`,
              '--y': `${tissue.y}px`,
              '--drift': `${tissue.drift}px`,
              '--drift-mid': `${tissue.driftMid}px`,
              '--lift': `${tissue.lift}px`,
              '--rotate': `${tissue.rotate}deg`,
              '--start-rotate': `${tissue.startRotate}deg`,
              '--duration': `${tissue.duration}s`,
              '--delay': `${tissue.delay}s`,
              '--size': tissue.size,
              '--hue': `${tissue.hue}deg`,
              '--fold': `${tissue.fold}%`,
            }}
            onAnimationEnd={() =>
              setTissues((current) =>
                current.filter((item) => item.id !== tissue.id),
              )
            }
          >
            <i />
          </span>
        ))}
      </div>
    </main>
  )
}

export default App

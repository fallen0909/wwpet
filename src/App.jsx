import { useEffect, useMemo, useRef, useState } from "react";
import { Minus, X } from "lucide-react";
import "./styles.css";

const CELL = { width: 192, height: 208 };
const SCALE = 1.44;

const STATES = {
  idle: { row: 0, frames: 6, durations: [280, 110, 110, 140, 140, 320] },
  "running-right": { row: 1, frames: 8, durations: [120, 120, 120, 120, 120, 120, 120, 220] },
  "running-left": { row: 2, frames: 8, durations: [120, 120, 120, 120, 120, 120, 120, 220] },
  waving: { row: 3, frames: 4, durations: [140, 140, 140, 280] },
  jumping: { row: 4, frames: 5, durations: [140, 140, 140, 140, 280] },
  failed: { row: 5, frames: 8, durations: [140, 140, 140, 140, 140, 140, 140, 240] },
  waiting: { row: 6, frames: 6, durations: [150, 150, 150, 150, 150, 260] },
  running: { row: 7, frames: 6, durations: [120, 120, 120, 120, 120, 220] },
  review: { row: 8, frames: 6, durations: [150, 150, 150, 150, 150, 280] }
};

const CLICK_STATES = ["waving", "jumping", "waiting", "review"];
const HEART_COLORS = ["#ff5c8a", "#ff85b3", "#ffc2d6", "#f24f79"];

export default function App() {
  const [stateName, setStateName] = useState("idle");
  const [frame, setFrame] = useState(0);
  const [hearts, setHearts] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [petPop, setPetPop] = useState(false);
  const clickIndex = useRef(0);
  const dragStart = useRef(null);

  const activeState = STATES[stateName];

  useEffect(() => {
    let cancelled = false;
    let currentFrame = 0;
    let timer;

    const tick = () => {
      if (cancelled) return;
      setFrame(currentFrame);
      const delay = activeState.durations[currentFrame] ?? 160;
      currentFrame = (currentFrame + 1) % activeState.frames;
      timer = window.setTimeout(tick, delay);
    };

    tick();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [activeState, stateName]);

  useEffect(() => {
    if (stateName === "idle") return;
    const timeout = window.setTimeout(() => setStateName("idle"), 1300);
    return () => window.clearTimeout(timeout);
  }, [stateName]);

  const spriteStyle = useMemo(
    () => ({
      width: CELL.width,
      height: CELL.height,
      transform: `scale(${SCALE})`,
      backgroundImage: "url('/pet/spritesheet.webp')",
      backgroundSize: `${CELL.width * 8}px ${CELL.height * 9}px`,
      backgroundPosition: `-${frame * CELL.width}px -${activeState.row * CELL.height}px`
    }),
    [activeState.row, frame]
  );

  function spawnHearts() {
    const count = 3 + Math.floor(Math.random() * 4);
    const next = Array.from({ length: count }, (_, index) => ({
      id: `${Date.now()}-${index}-${Math.random()}`,
      left: 106 + Math.random() * 82,
      top: 78 + Math.random() * 58,
      size: 14 + Math.random() * 12,
      drift: -42 + Math.random() * 84,
      rotate: -24 + Math.random() * 48,
      color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
      delay: Math.random() * 90
    }));
    setHearts((current) => [...current, ...next]);
    window.setTimeout(() => {
      const ids = new Set(next.map((heart) => heart.id));
      setHearts((current) => current.filter((heart) => !ids.has(heart.id)));
    }, 1150);
  }

  function handlePetClick() {
    if (isDragging) return;
    clickIndex.current = (clickIndex.current + 1) % CLICK_STATES.length;
    setStateName(CLICK_STATES[clickIndex.current]);
    setPetPop(true);
    spawnHearts();
    window.setTimeout(() => setPetPop(false), 360);
  }

  function handlePointerDown(event) {
    if (event.button !== 0) return;
    dragStart.current = {
      x: event.screenX,
      y: event.screenY,
      moved: false
    };
    window.petWindow?.dragStart({ x: event.screenX, y: event.screenY });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!dragStart.current) return;
    const dx = event.screenX - dragStart.current.x;
    const dy = event.screenY - dragStart.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) {
      dragStart.current.moved = true;
      setIsDragging(true);
      window.petWindow?.dragMove({ x: event.screenX, y: event.screenY });
    }
  }

  function handlePointerUp(event) {
    const moved = dragStart.current?.moved;
    dragStart.current = null;
    window.petWindow?.dragEnd();
    window.setTimeout(() => setIsDragging(false), 40);
    if (!moved) handlePetClick();
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }

  return (
    <main className="pet-shell">
      <div className="window-actions">
        <button type="button" aria-label="Minimize" onClick={() => window.petWindow?.minimize()}>
          <Minus size={15} strokeWidth={2.2} />
        </button>
        <button type="button" aria-label="Close" onClick={() => window.petWindow?.close()}>
          <X size={15} strokeWidth={2.2} />
        </button>
      </div>

      <section
        className={`pet-stage ${petPop ? "is-pop" : ""}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          dragStart.current = null;
          setIsDragging(false);
          window.petWindow?.dragEnd();
        }}
      >
        <div className="heart-layer" aria-hidden="true">
          {hearts.map((heart) => (
            <span
              key={heart.id}
              className="heart"
              style={{
                left: heart.left,
                top: heart.top,
                width: heart.size,
                height: heart.size,
                color: heart.color,
                "--drift": `${heart.drift}px`,
                "--rotate": `${heart.rotate}deg`,
                animationDelay: `${heart.delay}ms`
              }}
            />
          ))}
        </div>
        <div className="sprite-wrap" aria-label="汪汪Q版桌面宠物">
          <div className="sprite" style={spriteStyle} />
        </div>
      </section>
    </main>
  );
}

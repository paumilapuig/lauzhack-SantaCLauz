/** Styles of the word aquarium, rendered with the component (class prefix `aq-`). */
export const AQUARIUM_CSS = `
/* The word aquarium: animals swim in once, aq-bob a little and then rest (nothing moves on its own for more than 5 s). */
.aq-tank {
  background: linear-gradient(180deg, #dff3f1 0%, #bfe3df 55%, #9fd1cb 100%);
}

.aq-sand {
  background: #f3e6c9;
}

.aq-swim {
  animation: aq-swim-in 900ms cubic-bezier(0.215, 0.61, 0.355, 1) both, aq-bob 1500ms ease-in-out 900ms 3;
}

.aq-rest {
  animation: aq-drop-in 600ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.aq-creature:hover {
  animation: aq-wiggle 500ms ease-in-out 1;
}

.aq-bubble {
  animation: aq-rise 4500ms ease-in 1 both;
}

@keyframes aq-swim-in {
  from { opacity: 0; transform: translateX(-40px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes aq-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

@keyframes aq-drop-in {
  from { opacity: 0; transform: translateY(-24px) scale(0.6); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes aq-wiggle {
  0%, 100% { transform: rotate(0); }
  30% { transform: rotate(-6deg); }
  70% { transform: rotate(6deg); }
}

@keyframes aq-rise {
  from { opacity: 0.7; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-260px); }
}

@media (prefers-reduced-motion: reduce) {
  .aq-swim, .aq-rest, .aq-creature:hover, .aq-bubble { animation: none; }
}
`

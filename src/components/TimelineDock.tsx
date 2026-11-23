import { ChevronLeft, ChevronRight, Film, ImagePlus, Mic, Type } from 'lucide-react';
import { buildTimelineSchedule } from '../engine/timeline';
import type { ScribeProject } from '../types/scribe';

interface TimelineDockProps {
  project: ScribeProject;
  playheadTime: number;
  selectedId: string | null;
  onSelectElement: (id: string) => void;
  onScrub: (timeSec: number) => void;
  onMoveOrder: (id: string, dir: -1 | 1) => void;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(1).padStart(4, '0');
  return `${String(m).padStart(2, '0')}:${s}`;
}

export function TimelineDock({
  project,
  playheadTime,
  selectedId,
  onSelectElement,
  onScrub,
  onMoveOrder,
}: TimelineDockProps) {
  const { items, totalDuration } = buildTimelineSchedule(project);

  return (
    <section className="timeline-dock" aria-label="Linha do tempo">
      <div className="timeline-header">
        <div className="timeline-meta">
          <Film size={14} />
          <strong>Linha do Tempo</strong>
          <span className="timeline-count">{items.length} cenas</span>
        </div>

        <div className="timeline-scrubber-wrap">
          <span className="mono-time">{formatTime(playheadTime)}</span>
          <input
            id="timeline-scrubber"
            type="range"
            min={0}
            max={Math.max(0.5, totalDuration)}
            step={0.05}
            value={Math.min(playheadTime, totalDuration)}
            onChange={(e) => onScrub(Number(e.target.value))}
            aria-label="Posição do vídeo no tempo"
          />
          <span className="mono-time muted">{formatTime(totalDuration)}</span>
        </div>
      </div>

      <div className="timeline-tracks">
        {items.length === 0 ? (
          <div className="timeline-empty">
            Adicione vetores, imagens PNG ou textos no painel esquerdo para montar sua animação.
          </div>
        ) : (
          <div className="timeline-clips-row">
            {items.map((item, idx) => {
              const dur = Math.max(0.4, item.endTime - (idx === 0 ? 0 : items[idx - 1].endTime));
              const widthPx = Math.max(122, Math.min(280, Math.round(dur * 48)));
              const isSelected = item.element.id === selectedId;
              const isActiveNow =
                playheadTime >= item.startTime - item.element.transitionDuration &&
                playheadTime <= item.endTime;

              return (
                <div
                  key={item.element.id}
                  className={`timeline-clip ${isSelected ? 'selected' : ''} ${isActiveNow ? 'playing' : ''}`}
                  style={{ width: `${widthPx}px` }}
                  onClick={() => {
                    onSelectElement(item.element.id);
                    onScrub(item.drawEndTime);
                  }}
                >
                  <div className="clip-top">
                    <span className="clip-badge">
                      {item.element.type === 'text' ? (
                        <Type size={11} />
                      ) : item.element.type === 'traced-image' ? (
                        <ImagePlus size={11} />
                      ) : (
                        <Film size={11} />
                      )}
                      <span>#{idx + 1}</span>
                    </span>
                    <div className="clip-arrows" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => onMoveOrder(item.element.id, -1)}
                        disabled={idx === 0}
                        title="Mover para antes"
                      >
                        <ChevronLeft size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onMoveOrder(item.element.id, 1)}
                        disabled={idx === items.length - 1}
                        title="Mover para depois"
                      >
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="clip-title">{item.element.name}</div>
                  <div className="clip-time">
                    {item.element.drawDuration.toFixed(1)}s + {item.element.pauseDuration.toFixed(1)}s
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {project.voiceover && (
          <div className="timeline-audio-strip">
            <div className="audio-strip-label">
              <Mic size={12} />
              <span>{project.voiceover.name}</span>
            </div>
            <div className="waveform-bars" aria-hidden="true">
              {project.voiceover.waveform.map((amp, idx) => (
                <span
                  key={idx}
                  className="waveform-bar"
                  style={{ height: `${Math.max(18, Math.round(amp * 100))}%` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

import { ScreenSection, getMeta } from '../components/Section'
import { Badge } from '../components/Badge'
import { OfficialViewer, useSlideControls } from '../pdf/OfficialViewer'
import { officialSlideTitles } from '../pdf/officialSlides'
import { sections, slideCompanions } from '../data/courseContent'
import { goToSection } from '../hooks/navigation'
import { IconNext } from '../components/Icons'

const pad = (n: number) => String(n).padStart(2, '0')

export function OfficialSection() {
  const { slide, go } = useSlideControls()
  return (
    <ScreenSection id="oficial" className="official">
      <div className="section-screen official__screen">
        <div className="official__head">
          <div className="section-head">
            <span className="section-code">01</span>
            <span className="kicker">Presentación</span>
          </div>
          <h2 className="official__title">
            OFICIAL <span>TOP LEARNING</span>
          </h2>
        </div>

        <div className="official__grid">
          <div className="official__viewer">
            <OfficialViewer variant="section" />
          </div>

          <aside className="official__map panel" aria-label="Mapa: diapositiva oficial y explicación visual">
            <div className="official__map-head">
              <span className="mono">Diap. → visual</span>
              <Badge kind="teacher" />
            </div>
            <ol className="slide-rail">
              {officialSlideTitles.map((title, i) => {
                const n = i + 1
                const comp = slideCompanions.find((c) => c.page === n)
                const target = comp?.section ? getMeta(comp.section) : undefined
                const active = n === slide
                return (
                  <li key={n} className={`slide-rail__row ${active ? 'is-active' : ''} ${n < slide ? 'is-past' : ''}`}>
                    <button className="slide-rail__btn" onClick={() => go(n)} aria-current={active ? 'step' : undefined}>
                      <span className="slide-rail__dot" aria-hidden />
                      <span className="mono slide-rail__n">{pad(n)}</span>
                      <span className="slide-rail__t">{title}</span>
                      {target && <span className="mono slide-rail__to">→ {target.code}</span>}
                    </button>
                    {active && comp && (
                      <div className="slide-rail__detail">
                        <p>{comp.note}</p>
                        {target && (
                          <button className="btn btn--sm btn--gold" onClick={() => goToSection(target.id)}>
                            Ir a {target.code} · {sections.find((s) => s.id === target.id)?.title} <IconNext className="i" />
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
          </aside>
        </div>
      </div>
    </ScreenSection>
  )
}

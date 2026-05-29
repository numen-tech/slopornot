# Sample AI Text (German Smoke Test Fixture)

Paste the prose below into the skill via:

```text
/agentic-humanizer
<paste prose>
```

Expected behavior: German is detected from the text and confirmed as de-DE in
Q1. `patterns.md` is NOT loaded (it is English-only). `references/ai-tells/de.md`
and `references/supplemental-ai-tells.md` are loaded. Readability is labeled
"Wiener Sachtextformel" with a value and a band target. The AI score shows as
n/a because the on-device detector is English-only (`detect_text` returns
`kind: not_english`). The 5-iteration loop runs using the German tells and
terminates on readability band membership rather than an AI threshold. Step 7
output includes a Language line (German, de-DE) and labels readability as Wiener
Sachtextformel.

## Prosatext

In der heutigen schnelllebigen Welt stellt die Einführung künstlicher
Intelligenz einen grundlegenden Paradigmenwechsel dar, der die Arbeitswelt in
nahezu allen Branchen transformiert. Es ist wichtig zu beachten, dass
Organisationen, die diese bahnbrechenden Lösungen nutzen möchten, ein komplexes
Geflecht aus Überlegungen sorgfältig navigieren müssen, darunter Skalierbarkeit,
nahtlose Integration und langfristige strategische Ausrichtung. Der erfolgreiche
Einsatz dieser Systeme erfordert einen ganzheitlichen Ansatz, der nicht nur die
technische Umsetzung, sondern auch das organisatorische Veränderungsmanagement
und die Einbindung der Stakeholder umfasst.

Darüber hinaus erfordert die rasante Entwicklung dieses Bereichs eine
kontinuierliche Überwachung und Anpassung, um einen nachhaltigen
Wettbewerbsvorteil zu sichern. Tauchen wir ein in die zentralen
Herausforderungen: Die Integration dieser fortschrittlichen Fähigkeiten in
bestehende Arbeitsabläufe verlangt ein umfassendes Verständnis sowohl der
technischen Architektur als auch der menschlichen Faktoren, die die Akzeptanz
beeinflussen. Insgesamt lässt sich sagen, dass die Reise zur digitalen
Transformation kein rein technologisches Unterfangen ist, sondern eine
vielschichtige Initiative, die nachhaltiges Engagement, strategische Vision und
abteilungsübergreifende Zusammenarbeit erfordert, um ihr volles Potenzial
auszuschöpfen und der Organisation echten Mehrwert zu liefern.

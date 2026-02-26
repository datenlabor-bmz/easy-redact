# EasyRedact – Compliance-Dokumentation

**Stand:** Februar 2026  
**Gültigkeitsbereich:** On-Premises-Deployment mit Azure OpenAI (Sweden Central)

Dieses Verzeichnis enthält die vollständige Compliance-, Datenschutz- und IT-Sicherheitsdokumentation für den Einsatz von EasyRedact im die Behörde (Betreiber). Die Dokumentation wurde nach den Anforderungen des IT-Sicherheitsbeauftragten (ISB) und des Datenschutzbeauftragten (DSB) einer Bundesbehörde erstellt.

---

## Inhaltsverzeichnis

| # | Dokument | Zweck | Adressaten |
|---|----------|-------|-----------|
| [01](./01_systemdokumentation.md) | **Technische Systemdokumentation** | Vollständige Beschreibung des technischen Systems, Stack, Datenflüsse, Schnittstellen, Sicherheitsfunktionen | ISB, IT-Referat, Datenlabor |
| [02](./02_c4_architektur.md) | **C4-Architekturdiagramme** | Systemkontext, Container, Komponenten und Deployment-Diagramme nach C4-Modell (Level 1–4) | ISB, IT-Architektur, DSB |
| [03](./03_ki_act_klassifizierung.md) | **KI-Act-Klassifizierung** | Einstufung von EasyRedact nach EU AI Act (VO 2024/1689); Risikoklasse, Betreiberpflichten | Rechtsabteilung, DSB |
| [04](./04_datenschutzinformation.md) | **Datenschutzinformation** | Pflichtinformation nach Art. 13/14 DSGVO für Beschäftigte; Zwecke, Rechtsgrundlagen, Empfänger, Betroffenenrechte | DSB, alle Nutzer |
| [05](./05_datenschutzfolgeabschaetzung.md) | **Datenschutz-Folgenabschätzung (DSFA)** | Vollständige DSFA nach Art. 35 DSGVO; Risiken, Maßnahmen, Restrisiken, DSB-Freigabe | DSB, ISB |
| [06](./06_sicherheitskonzept.md) | **IT-Sicherheitskonzept** | BSI IT-Grundschutz-orientiertes Sicherheitskonzept; Schutzbedarf, Bedrohungen, Maßnahmen (TOM), Notfallkonzept | ISB, IT-Referat |
| [07](./07_betriebskonzept.md) | **Betriebskonzept** | Deployment-Anleitung, Konfiguration, Monitoring, Update-Prozesse, Notfallkontakte | IT-Referat, Betrieb |
| [08](./08_verarbeitungsverzeichnis.md) | **Verarbeitungsverzeichnis (VVT)** | VVT-Eintrag nach Art. 30 DSGVO; Kategorien, Empfänger, Löschfristen, TOMs, Rechtsgrundlagen | DSB, BfDI (auf Anfrage) |
| [09](./09_nutzungsrichtlinie.md) | **Nutzungsrichtlinie** | Verbindliche Kurzrichtlinie für Beschäftigte; Prüfpflicht, Moduswahl, Datensparsamkeit, Vorfallmeldung | Alle Nutzer, IT-Referat |

---

## Freigabestatus

| Dokument | DSB | ISB | IT-Referat |
|----------|-----|-----|------------|
| Systemdokumentation | ⬜ | ⬜ | – |
| C4-Architektur | ⬜ | ⬜ | – |
| KI-Act-Klassifizierung | ⬜ | – | – |
| Datenschutzinformation | ⬜ | – | – |
| DSFA | ⬜ | ⬜ | – |
| Sicherheitskonzept | – | ⬜ | ⬜ |
| Betriebskonzept | – | ⬜ | ⬜ |
| Verarbeitungsverzeichnis | ⬜ | – | – |
| Nutzungsrichtlinie | ⬜ | – | ⬜ |

⬜ = Freigabe ausstehend | ✅ = Freigegeben | ❌ = Abgelehnt

---

## Offene Punkte vor Produktionsfreigabe

Die folgenden Maßnahmen müssen vor der Produktionseinführung abgeschlossen sein:

1. **AVV mit Microsoft Azure** abschließen (für Azure OpenAI Service)
2. **Nutzungsrichtlinie** in Kraft setzen (Vorlage: `09_nutzungsrichtlinie.md`)
3. **DSFA-Freigabe** durch DSB einholen
4. **Sicherheitskonzept-Freigabe** durch ISB einholen

---

## Ansprechpartner

| Rolle | Name | Kontakt |
|-------|------|---------|
| Technische Verantwortung | datenlabor-bmz | [Kontakt einsetzen] |
| Datenschutzbeauftragter (DSB) | [Name] | datenschutz@behoerde.intern |
| IT-Sicherheitsbeauftragter (ISB) | [Name] | [Kontakt einsetzen] |
| IT-Betrieb | IT-Referat der Behörde | [Kontakt einsetzen] |

---

## Revisionshistorie

| Version | Datum | Änderungen | Autor |
|---------|-------|-----------|-------|
| 1.0 | Februar 2026 | Erstversion aller Dokumente | datenlabor-bmz |

---

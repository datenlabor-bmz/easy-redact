# Nutzungsrichtlinie – EasyRedact

**Dokumentversion:** 1.0  
**Stand:** Februar 2026  
**Geltungsbereich:** Alle Beschäftigten der Behörde, die EasyRedact nutzen  
**Freigabe durch:** [IT-Referat / Datenschutzbeauftragter – Unterschrift einsetzen]

---

## 1. Zweck

EasyRedact ist ein KI-gestütztes Werkzeug zur Schwärzung von PDF- und DOCX-Dokumenten. Diese Richtlinie regelt die verbindlichen Anforderungen an die Nutzung, um Datenschutzverstöße und fehlerhafte Schwärzungen zu vermeiden.

---

## 2. Prüfpflicht für KI-Vorschläge

**KI-Vorschläge sind immer manuell zu prüfen und zu bestätigen.** Das KI-Modell kann Schwärzungen übersehen oder falsch vorschlagen. Die rechtliche Verantwortung für das geschwärzte Dokument liegt beim bearbeitenden Beschäftigten, nicht beim KI-System.

Vor dem Export eines geschwärzten Dokuments ist sicherzustellen, dass:
- alle relevanten personenbezogenen Daten oder schutzwürdigen Informationen geschwärzt sind,
- keine legitimen Inhalte versehentlich geschwärzt wurden,
- PDF-Metadaten (Autor, Ersteller etc.) bei Bedarf entfernt wurden.

---

## 3. Wahl des Verarbeitungsmodus

EasyRedact bietet zwei KI-Modi:

| Modus | Datenverarbeitung | Empfehlung |
|-------|------------------|-----------|
| **Cloud-KI** (Azure OpenAI, EU-Region Schweden) | Dokumenttext wird an Microsoft Azure übermittelt | Geeignet für nicht eingestufte Dokumente; Microsoft verarbeitet Daten DSGVO-konform ohne Speicherung |
| **Lokal-KI** (Ollama o.ä., on-premises) | Dokumenttext verbleibt vollständig auf Behördeninfrastruktur | Empfohlen für besonders sensitive Inhalte |

Für **VS-eingestufte Dokumente** darf ausschließlich der Lokal-KI-Modus oder die manuelle Schwärzung (ohne KI) verwendet werden.

---

## 4. Sitzungsdaten

Dokumente und Schwärzungen werden ausschließlich im Browser des Arbeitsplatzes gespeichert (IndexedDB). Nach Abschluss der Bearbeitung sollten die Sitzungsdaten über die Funktion „Sitzung löschen" in der App gelöscht werden, insbesondere:
- bei besonders sensitiven Dokumenten,
- bei Nutzung eines gemeinsam genutzten Arbeitsplatzes.

---

## 5. Nicht erlaubte Nutzungen

- Verarbeitung von VS-eingestuften Dokumenten im Cloud-KI-Modus
- Weitergabe des Azure OpenAI API-Keys oder anderer Konfigurationsgeheimnisse
- Nutzung von EasyRedact über öffentliche Netzwerke außerhalb des Behörden-Intranets

---

## 6. Vorfallmeldung

Verdacht auf fehlerhafte Schwärzungen mit tatsächlicher Datenweitergabe sowie technische Sicherheitsvorfälle sind unverzüglich dem Datenschutzbeauftragten und dem IT-Sicherheitsbeauftragten zu melden.

---

*Freigegeben durch:*

Datum: ________________  
Unterschrift: ________________  
Funktion: ________________

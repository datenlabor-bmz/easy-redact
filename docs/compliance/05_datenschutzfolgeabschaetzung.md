# Datenschutz-Folgenabschätzung (DSFA) – EasyRedact

> 📥 [Alle Compliance-Dokumente als DOCX herunterladen](https://github.com/datenlabor-bmz/easy-redact/releases/download/compliance-docs/EasyRedact_Compliance.zip)

**Dokumentversion:** 1.0  
**Stand:** Februar 2026  
**Rechtsgrundlage:** Art. 35 DSGVO; § 67 BDSG; DSK-Kurzpapier Nr. 5  
**Erstellt durch:** [Name DSB oder datenlabor-bmz einsetzen]  
**Überprüft durch:** Behördlicher Datenschutzbeauftragter  
**Status:** Entwurf – Freigabe durch DSB ausstehend

---

## Präambel

Die Datenschutz-Folgenabschätzung (DSFA) gemäß Art. 35 DSGVO ist durchzuführen, wenn eine Verarbeitungstätigkeit voraussichtlich ein **hohes Risiko** für die Rechte und Freiheiten natürlicher Personen mit sich bringt. Die Datenschutzkonferenz (DSK) hat eine Muss-Liste für DSFA-pfllichtige Verarbeitungen veröffentlicht. EasyRedact ist zu prüfen auf:

- **Verwendung neuer Technologien** (KI, Machine Learning)
- **Verarbeitung besonderer Datenkategorien** (Art. 9/10 DSGVO) in den zu bearbeitenden Dokumenten
- **Systematische Verarbeitung** durch Behörden

Diese drei Merkmale treffen auf EasyRedact zu. Die DSFA ist daher durchzuführen.

---

## Teil I: Beschreibung der Verarbeitungstätigkeit

### 1.1 Name und Beschreibung

**Name:** EasyRedact – KI-gestützte Dokumentenschwärzung  
**Betreiber:** die Behörde (Betreiber)  
**Anbieter der Anwendung:** datenlabor-bmz  
**Betriebsform:** On-Premises (Rechenzentrum der Behörde), Docker-Container

**Beschreibung:** EasyRedact ermöglicht Sachbearbeitern der Behörde, PDF- und DOCX-Dokumente zu schwärzen. Dabei werden entweder personenbezogene Daten (PII-Modus) oder gesetzlich geschützte Informationen im Kontext von IFG-Anfragen (FOI-Modus) identifiziert und entfernt. Die KI-Unterstützung erfolgt wahlweise über Azure OpenAI (Sweden Central) oder ein lokales Sprachmodell; eine vollständig manuelle Bearbeitung ohne KI ist ebenfalls möglich.

### 1.2 Verarbeitungszwecke

1. Schwärzung personenbezogener Daten in Behördendokumenten vor Weitergabe oder Veröffentlichung
2. Unterstützung bei der Bearbeitung von Informationsfreiheitsanfragen (IFG/UIG/VIG)
3. Effizienzsteigerung in der Sachbearbeitung durch KI-gestützte Vorschlagsgenerierung

### 1.3 Kategorie der Betroffenen

- **Dritte** (natürliche Personen, deren Daten in den zu schwärzenden Dokumenten enthalten sind): Antragsteller, Beteiligte, erwähnte Personen, Mitarbeiter, Vertragspartner
- **Beschäftigte der Behörde** (als Nutzer der Anwendung, in sehr begrenztem Umfang)

### 1.4 Datenkategorien in verarbeiteten Dokumenten

| Kategorie | Art. 9/10 DSGVO? | Häufigkeit |
|-----------|-----------------|-----------|
| Namen, Adressen, Kontaktdaten | Nein (Allgemein) | Sehr häufig |
| Bankverbindungen, finanzielle Daten | Nein | Häufig |
| Berufs- und Funktionsangaben | Nein | Häufig |
| Gesundheitsdaten | **Ja (Art. 9)** | Gelegentlich |
| Daten zu politischen Meinungen | **Ja (Art. 9)** | Gelegentlich |
| Gewerkschaftszugehörigkeit | **Ja (Art. 9)** | Selten |
| Daten zu strafrechtlichen Verurteilungen | **Ja (Art. 10)** | Selten |
| Religiöse/weltanschauliche Überzeugungen | **Ja (Art. 9)** | Selten |

### 1.5 Technische Verarbeitungsschritte

1. Dokumentenupload → Speicherung in Browser-IndexedDB (kein Server-Upload)
2. DOCX → PDF-Konvertierung (optional, server-seitig, temporär)
3. Textextraktion via MuPDF WASM (im Browser)
4. KI-Analyse: Dokumenttext → Azure OpenAI (Sweden Central) → Schwärzungsvorschläge
5. Menschliche Prüfung und Freigabe der Vorschläge
6. PDF-Schwärzung via MuPDF WASM (im Browser)
7. Export des geschwärzten PDFs (im Browser, kein Server-Upload)

### 1.6 Auftragsverarbeiter

| Auftragsverarbeiter | Zweck | Sitz | Übermittlungsgrundlage |
|---------------------|-------|------|------------------------|
| Microsoft Azure (Azure OpenAI, Sweden Central) | KI-Analyse von Dokumenttext | EU (Schweden) | Art. 28 DSGVO (AVV), ggf. Art. 46 Abs. 2 lit. c DSGVO (EU-SCC) |

---

## Teil II: Bewertung der Notwendigkeit und Verhältnismäßigkeit

### 2.1 Notwendigkeit der Verarbeitung

Die manuelle Schwärzung von Dokumenten im Rahmen von IFG-Verfahren ist eine gesetzliche Pflicht (§ 5 IFG: Schutz personenbezogener Daten; § 6 IFG: Schutz des geistigen Eigentums). Ohne softwaregestützte Werkzeuge ist diese Aufgabe bei größeren Dokumentmengen kaum effizient zu erfüllen.

Die KI-Unterstützung ist nicht zwingend erforderlich (manuelle Schwärzung möglich), erhöht aber erheblich die Vollständigkeit und Effizienz, insbesondere bei umfangreichen Dokumenten.

### 2.2 Verhältnismäßigkeit der KI-Verarbeitung

- **Datensparsamkeit:** Nur extrahierter Text (nicht Binärdaten) wird an Azure OpenAI übertragen
- **Zweckbindung:** Daten werden ausschließlich für Schwärzungsvorschläge verarbeitet
- **Keine Daten-Retention:** Azure OpenAI speichert keine Daten nach der Verarbeitungssitzung
- **Opt-in:** Nutzer müssen KI-Verarbeitung aktiv wählen und bestätigen
- **Alternative vorhanden:** Vollständig lokale Verarbeitung (Lokal-LLM, spaCy, manuelle Schwärzung) möglich

### 2.3 Rechtsgrundlagen (Verhältnismäßigkeitsprüfung)

- **Art. 6 Abs. 1 lit. e DSGVO** (Öffentliche Aufgabe): Schwärzung von Dokumenten für IFG-Verfahren ist eine gesetzliche Pflicht.
- **Art. 9 Abs. 2 lit. g DSGVO** i.V.m. **§ 22 Abs. 1 Nr. 1 lit. b BDSG**: Verarbeitung besonderer Datenkategorien ist zur Erfüllung erheblicher öffentlicher Interessen (IFG-Vollzug, Datenschutz) erforderlich.

---

## Teil III: Identifikation und Bewertung von Risiken

### 3.1 Risikoidentifikation

| Nr. | Risikoszenario | Eintrittswahrscheinlichkeit | Schwere | Gesamtrisiko |
|-----|---------------|--------------------------|---------|-------------|
| R1 | **Datenpanne bei Azure OpenAI**: Dokumenttext wird von Azure OpenAI unbeabsichtigt gespeichert oder weitergegeben | Gering (Microsofts AVV schließt Datenspeicherung aus) | Hoch | **Mittel** |
| R2 | **Unbeabsichtigte Übermittlung ohne Einwilligung**: Dokumenttext wird ohne Nutzereinwilligung an Cloud-KI gesendet | Sehr gering (technisch durch Consent-Check blockiert) | Hoch | **Gering** |
| R3 | **Unvollständige KI-Schwärzung**: KI erkennt nicht alle zu schwärzenden Stellen; versehentliche Weitergabe personenbezogener Daten | Mittel (KI-Systeme sind nicht fehlerfrei) | Sehr hoch | **Hoch** |
| R4 | **Fehlgeleitete Schwärzung**: KI schlägt falsch-positive Schwärzungen vor; legitime Informationen werden entfernt | Mittel | Mittel | **Mittel** |
| R5 | **Unbefugter Zugriff auf Browser-IndexedDB**: Dritte greifen auf im Browser gespeicherte Dokumente zu | Gering (erfordert physischen Zugriff auf Arbeitsplatz) | Hoch | **Mittel** |
| R6 | **XSS-Angriff**: Durch eine Sicherheitslücke wird auf gespeicherte Dokumente in IndexedDB zugegriffen | Sehr gering (CSP-Header, kein Nutzercontent im DOM) | Sehr hoch | **Mittel** |
| R7 | **US Cloud Act**: US-Behörden fordern Daten von Microsoft an | Sehr gering (keine Hinweise auf derartige Anfragen, Microsoft DPA schützt) | Sehr hoch | **Mittel** |
| R8 | **Verlust der Sitzungsdaten im Browser**: Browserdaten werden ohne Backup gelöscht | Mittel (Browser-Cache-Löschung) | Gering (Arbeitsverlust, kein Datenschutzrisiko) | **Gering** |
| R9 | **IFG-Regelwerk-Manipulation**: GitHub-CDN-Inhalte werden manipuliert und führen zu falschen Schwärzungsvorschlägen | Sehr gering (HTTPS, keine personenbezogenen Daten betroffen) | Mittel | **Gering** |
| R10 | **Dokumentinhalt in Server-Logs**: Dokumenttext wird in Server-Logs persistiert | Sehr gering (Produktions-Logs deaktiviert, kein sensible Inhalte mehr geloggt) | Hoch | **Gering** |

**Risikoampel:**
- 🔴 Hoch: R3 (Unvollständige Schwärzung)
- 🟡 Mittel: R1, R4, R5, R6, R7
- 🟢 Gering: R2, R8, R9, R10

### 3.2 Detailbewertung Hochrisiko: R3 – Unvollständige KI-Schwärzung

**Beschreibung:** Der KI-Assistent erkennt nicht alle personenbezogenen Daten im Dokument. Der Bearbeiter überprüft die Vorschläge nur oberflächlich und gibt das unvollständig geschwärzte Dokument weiter. Betroffene erleiden dadurch Datenschutzverletzungen.

**Betroffene Interessen:** Schutz personenbezogener Daten der im Dokument erwähnten Personen; Ansehen und rechtliche Exposition der Behörde.

**Eintrittswahrscheinlichkeit:** Mittel – KI-Systeme haben eine nachgewiesene Fehlerrate, insbesondere bei unstrukturierten Texten, Fremdsprachen und kontextabhängigen Angaben (z.B. indirekte Namensreferenzen).

**Schadenshöhe:** Sehr hoch – Eine unbeabsichtigte Offenlegung besonderer Datenkategorien (Gesundheitsdaten, strafrechtliche Daten) kann erhebliche Schäden für Betroffene verursachen. Für die Behörde drohen Bußgelder (Art. 83 DSGVO) und Reputationsschäden.

---

## Teil IV: Risikominderungsmaßnahmen

### 4.1 Implementierte Maßnahmen

| Nr. | Maßnahme | Minderung | Resido-Risiko |
|-----|---------|-----------|--------------|
| M1 | **Human-in-the-loop**: Alle KI-Vorschläge erfordern manuelle Freigabe | R3, R4 | Mittel |
| M2 | **Einwilligungsmanagement**: Zweistufige Einwilligung vor KI-Analyse | R2 | Sehr gering |
| M3 | **Azure OpenAI AVV**: Keine Datenspeicherung, EU-Datenhaltung, GDPR-Compliance | R1, R7 | Gering |
| M4 | **Produktions-Logging deaktiviert**: Dokumentinhalt wird nicht in Server-Logs persistiert | R10 | Sehr gering |
| M5 | **CSP und Sicherheitsheader**: XSS-Schutz, Clickjacking-Schutz | R6 | Sehr gering |
| M6 | **TLS/HTTPS**: Verschlüsselung aller Übertragungen | R1 | Gering |
| M7 | **Lokale Verarbeitungsoption**: Alternative zu Cloud-KI | R1, R7 | N/A (kein Risiko bei lokaler Verarbeitung) |
| M8 | **robots.txt + Firewall**: Keine öffentliche Erreichbarkeit | R5, R6 | Gering |

### 4.2 Empfohlene zusätzliche Maßnahmen

| Nr. | Empfohlene Maßnahme | Priorität | Zuständigkeit |
|-----|---------------------|-----------|--------------|
| E1 | **Onboarding-Dialog + Download-Bestätigung**: Beim ersten Aufruf erscheint ein Pflicht-Dialog (Prüfpflicht, Verarbeitungsmodi, VS-NfD-Hinweis), der per Checkbox bestätigt werden muss; Bestätigung wird in IndexedDB persistiert. Vor jedem Download erscheint ein zweiter Dialog, der den Nutzer nochmals auf seine persönliche Verantwortung hinweist. Beide Dialoge ersetzen eine formale Schulung und dokumentieren die Kenntnisnahme technisch. | Hoch | datenlabor-bmz |
| E2 | **Nutzungsrichtlinie / Dienstanweisung**: Kurze schriftliche Anweisung, die Prüfpflicht und Umgang mit sensiblen Dokumenten regelt. | Hoch | IT-Referat / DSB |
| E3 | **Regelmäßiges Qualitätsaudit**: Stichprobenartige Prüfung bereits exportierter Dokumente | Mittel | zuständiger Fachbereich |
| E4 | **Auditlogging im Proxy**: Zugriffsprotokollierung (Zeitstempel, Quell-IP, HTTP-Status — kein Dokumentinhalt) | Mittel | IT-Infrastruktur |
| E5 | **IFG-Regelwerk-Lokal-Fallback**: Lokale Kopie des Regelwerks für Air-Gap-Betrieb | Niedrig | datenlabor-bmz |
| E6 | **Automatisches Sitzungsablauf**: Browserseitige IndexedDB nach definiertem Zeitintervall leeren | Niedrig | datenlabor-bmz |

---

## Teil V: Konsultation des Datenschutzbeauftragten

### 5.1 Ergebnis der DSB-Konsultation

- **DSB-Konsultation durchgeführt am:** [Datum einsetzen]
- **Empfehlung des DSB:** [Einsetzen nach Konsultation]
- **Ggf. Vorab-Konsultation der Aufsichtsbehörde (Art. 36 DSGVO):** Nicht erforderlich, sofern Maßnahmen M1–M8 und Empfehlungen E1–E3 vollständig umgesetzt werden.

### 5.2 Kriterien für Vorab-Konsultation (Art. 36 DSGVO)

Eine Vorab-Konsultation der BfDI wäre erforderlich, wenn das Restrisiko nach Umsetzung aller Maßnahmen weiterhin hoch ist. Mit den implementierten und empfohlenen Maßnahmen wird das Gesamtrisiko auf **mittel** gesenkt; eine Vorab-Konsultation ist daher **nicht zwingend erforderlich**, wird aber **empfohlen**, da:
- Es sich um eine neuartige KI-Technologie in einem Behördenkontext handelt
- Besondere Datenkategorien nach Art. 9/10 DSGVO regelmäßig betroffen sind

---

## Teil VI: Gesamtbewertung und Ergebnis

### 6.1 Ausgangsbewertung (vor Maßnahmen)

| Risiko | Vor Maßnahmen |
|--------|---------------|
| R3 (Unvollständige Schwärzung) | 🔴 Hoch |
| R1 (Azure OpenAI Datenpanne) | 🟡 Mittel |
| R5 (IndexedDB-Zugriff) | 🟡 Mittel |
| Gesamtrisiko | 🔴 Hoch |

### 6.2 Restrisikobewertung (nach Maßnahmen M1–M8 und Umsetzung E1–E2)

| Risiko | Nach Maßnahmen |
|--------|----------------|
| R3 (Unvollständige Schwärzung) | 🟡 Mittel (verbleibendes inhärentes Risiko jeder KI) |
| R1 (Azure OpenAI Datenpanne) | 🟢 Gering |
| R5 (IndexedDB-Zugriff) | 🟢 Gering |
| **Gesamtrestrisiko** | **🟡 Mittel – akzeptabel unter Bedingungen** |

### 6.3 Bedingungen für Freigabe

Die Verarbeitungstätigkeit wird unter folgenden Bedingungen als datenschutzrechtlich vertretbar bewertet:

1. Auftragsverarbeitungsvertrag (AVV) mit Microsoft Azure ist abgeschlossen
2. Onboarding-Dialog und Download-Bestätigungsdialog sind in der App implementiert (E1)
3. Nutzungsrichtlinie/Dienstanweisung (E2) ist in Kraft
4. Produktions-Logging enthält keine Dokumentinhalte
5. Zugriff ist auf Behörden-Intranet beschränkt (Firewall, keine nutzerspezifische Authentifizierung – bewusste Architekturentscheidung, s. Sicherheitskonzept)

### 6.4 Entscheidung

☐ **Freigegeben** – unter den genannten Bedingungen datenschutzrechtlich vertretbar  
☐ **Nicht freigegeben** – Nachbesserung erforderlich  
☐ **Vorab-Konsultation BfDI erforderlich**

Datum: ________________  
Unterschrift DSB: ________________
Unterschrift ISB: ________________

---

## Teil VII: Revisionsplan

| Anlass | Fälligkeitsdatum | Zuständig |
|--------|-----------------|-----------|
| Regelmäßige Überprüfung | Jährlich, ab Freigabedatum | DSB der Behörde |
| Wesentliche Systemänderung (neue Funktion, neuer KI-Anbieter) | Bei Änderung | datenlabor-bmz + DSB |
| Änderung der Rechtslage (DSGVO, BDSG, AI Act) | Bei Änderung | DSB der Behörde |
| Sicherheitsvorfall | Unmittelbar | DSB + ISB der Behörde |

---

## Anhang A: Kurzliste der Maßnahmen (TOM-Übersicht)

| Maßnahme | Kategorie (BSI) | Implementiert |
|---------|----------------|--------------|
| HTTPS/TLS 1.3 | Verschlüsselung | In App implementiert |
| Einwilligungsmanagement (Consent-Workflow) | Datenschutz-by-Design | In App implementiert |
| Kein persistenter Server-Log mit Dokumentinhalt | Datensparsamkeit | In App implementiert |
| MuPDF WASM (lokale Verarbeitung) | Datensparsamkeit | In App implementiert |
| CSP + Sicherheitsheader | Technische Sicherheit | In App implementiert |
| Intranet-only Deployment | Zugriffsbeschränkung | Durch Betreiber sicherzustellen |
| Azure OpenAI AVV + EU-Datenhaltung | Auftragsverarbeitung | AVV durch Betreiber abzuschließen |
| Nutzungsrichtlinie + Onboarding-Dialog in App | Organisatorisch | Onboarding in App; Nutzungsrichtlinie durch Betreiber |
| Intranet-Firewall (keine nutzerspezifische Authentifizierung) | Zugriffskontrolle | Durch Betreiber sicherzustellen |

---


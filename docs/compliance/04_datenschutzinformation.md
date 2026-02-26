# Datenschutzinformation nach Art. 13/14 DSGVO – EasyRedact

**Dokumentversion:** 1.0  
**Stand:** Februar 2026  
**Rechtsgrundlage:** Art. 13, 14 DSGVO; § 75 BDSG  

> Diese Datenschutzinformation richtet sich an die **Beschäftigten der Behörde**, die EasyRedact im Rahmen ihrer dienstlichen Tätigkeit nutzen. Sie informiert über die Verarbeitung personenbezogener Daten im Zusammenhang mit der Nutzung von EasyRedact, insbesondere der Übermittlung von Dokumentinhalten an externe KI-Dienste.

---

## 1. Verantwortlicher

**die Behörde (Betreiber)**  
Stresemannstraße 94  
10963 Berlin  

Behördlicher Datenschutzbeauftragter: [Name und Kontaktdaten einsetzen]  
E-Mail: datenschutz@behoerde.intern

---

## 2. Zweck und Rechtsgrundlage der Datenverarbeitung

### 2.1 Verarbeitungszwecke

EasyRedact verarbeitet personenbezogene Daten zu folgenden Zwecken:

| Zweck | Beschreibung |
|-------|-------------|
| **Dokumentenschwärzung (PII)** | Erkennung und Schwärzung personenbezogener Daten in Dokumenten vor deren Weitergabe oder Veröffentlichung |
| **IFG-Bearbeitung** | Unterstützung bei der Schwärzung von Dokumenten im Rahmen von Informationsfreiheitsanfragen nach § 1 IFG, § 3 UIG o.ä. |
| **KI-gestützte Analyse** | Bei erteilter Einwilligung: Übermittlung von Dokumenttexten an Azure OpenAI (Microsoft) zur KI-Analyse und Generierung von Schwärzungsvorschlägen |

### 2.2 Rechtsgrundlagen

| Verarbeitungsvorgang | Rechtsgrundlage |
|---------------------|----------------|
| Nutzung der Anwendung im Dienstbetrieb | Art. 6 Abs. 1 lit. e DSGVO i.V.m. § 3 BDSG (öffentliche Aufgabe / behördliche Aufgabenerfüllung) |
| Übermittlung von Dokumenttexten an Azure OpenAI (Cloud-KI) | Art. 6 Abs. 1 lit. e DSGVO i.V.m. § 3 BDSG (behördliche Aufgabenerfüllung); ergänzt durch explizite Einwilligungsabfrage im System |
| Verarbeitung besonderer Kategorien personenbezogener Daten (Art. 9 DSGVO) in Dokumenten | Art. 9 Abs. 2 lit. g DSGVO (erhebliches öffentliches Interesse) i.V.m. § 22 Abs. 1 Nr. 1 lit. b BDSG |

> **Hinweis zur Einwilligung:** Die im System abgefragte „Einwilligung" für den Cloud-KI-Modus ist technischer Natur (Einwilligungsmanagement-Funktion). Die eigentliche Rechtsgrundlage für die Verarbeitung ist Art. 6 Abs. 1 lit. e DSGVO (behördliche Aufgabenerfüllung). Die Einwilligungsabfrage dient primär als Transparenz- und Kontrollmechanismus, nicht als DSGVO-Einwilligung im Rechtssinne.

---

## 3. Kategorien verarbeiteter personenbezogener Daten

### 3.1 Daten der Dokumentinhalte (zu bearbeitende Dritte)

EasyRedact verarbeitet die personenbezogenen Daten von **Dritten** (Antragsteller, Beteiligte, erwähnte Personen), die in den zu schwärzenden Dokumenten enthalten sind:

- Namen natürlicher Personen
- Anschriften und Kontaktdaten
- Berufliche Angaben und Funktionsbezeichnungen
- Bankverbindungen und finanzielle Angaben
- Gesundheitsdaten (§ 9 DSGVO, bei entsprechenden Dokumenten)
- Angaben zu strafrechtlichen Verurteilungen (Art. 10 DSGVO, bei entsprechenden Dokumenten)
- Biometrische Daten (selten, z.B. Lichtbilder in eingescannten Dokumenten)

### 3.2 Nutzungsdaten der Beschäftigten

EasyRedact erhebt **keine** eigenständigen Nutzungsprofile oder Login-Daten. Die Anwendung führt keine Authentifizierung durch. Nutzungsdaten (z.B. Zugriffszeiten) können durch den vorgelagerten Reverse Proxy oder das Netzwerklogging der Behörde erfasst werden (außerhalb des Anwendungsscopes).

### 3.3 Browserseitig gespeicherte Daten

- Hochgeladene Dokumente (ArrayBuffer in IndexedDB des Browsers)
- Schwärzungsgeometrie und -status (IndexedDB)
- Chat-Verlauf (IndexedDB)
- Panel-Konfiguration (localStorage)

Diese Daten verbleiben ausschließlich im Browser des jeweiligen Arbeitsplatzes und werden nicht an Server übertragen (außer Dokumenttext bei KI-Einwilligung).

---

## 4. Empfänger personenbezogener Daten

### 4.1 Interne Empfänger

Keine automatische Weiterleitung an interne Systeme. Der Bearbeiter kann exportierte, geschwärzte Dokumente manuell in das DMS oder andere Systeme übertragen.

### 4.2 Externe Empfänger (Auftragsverarbeiter)

| Empfänger | Dienst | Datenkategorien | Bedingung | Rechtsgrundlage |
|-----------|--------|----------------|-----------|----------------|
| Microsoft Azure (Ireland/Sweden) | Azure OpenAI Service (Sweden Central) | Dokumenttext (extrahierter Text, kein Originalbinär) | Nur bei Cloud-KI-Einwilligung im System | Art. 28 DSGVO (AVV), Art. 46 DSGVO (EU-SCC) |

> **Auftragsverarbeitungsvertrag (AVV):** Mit Microsoft Azure muss ein gültiger Auftragsverarbeitungsvertrag nach Art. 28 DSGVO vorliegen. Microsoft stellt diesen als Teil der **Microsoft Online Services DPA** bereit. Im Kontext des Betreibers ist dieser über den bestehenden Microsoft-Rahmenvertrag (ELA/MCA) einzubeziehen.

### 4.3 Datenübermittlung in Drittländer

Azure OpenAI verarbeitet Daten in der **Region Sweden Central** (Europäische Union / Europäischer Wirtschaftsraum). Eine Übermittlung in Drittländer findet **nicht** statt, sofern der betreiberspezifische Azure OpenAI-Endpunkt korrekt konfiguriert ist.

> **US Cloud Act:** Der US CLOUD Act kann US-amerikanischen Behörden den Zugriff auf Daten bei US-Unternehmen ermöglichen. Microsoft hat erklärt, im Fall staatlicher Zugriffsanfragen die Konformität mit EU-DSGVO und den Transfer Impact Assessments zu gewährleisten und Kundenbenachrichtigungen soweit rechtlich möglich vorzunehmen. Die CJEU-Rechtsprechung (Schrems II) und das EU-US Data Privacy Framework (DPF, seit Juli 2023) sind bei der Risikobewertung zu berücksichtigen.

---

## 5. Speicherdauer und Löschung

| Datenkategorie | Speicherort | Löschung |
|---------------|-------------|---------|
| Dokumentinhalte | IndexedDB (Browser, Arbeitsplatz) | Durch Nutzer (manuell, „Sitzung löschen"-Funktion), oder bei Browserdaten-Löschung |
| Chat-Verlauf | IndexedDB (Browser) | Wie Dokumentinhalte |
| Azure OpenAI (Übermittlungen) | Azure OpenAI Service | **Keine Datenspeicherung** durch Microsoft nach der Verarbeitung (gemäß Azure OpenAI DPA); Eingaben werden nicht für Modelltraining verwendet |
| Temporäre DOCX-Dateien | Server-Dateisystem (RAM/tmp) | Sofortige Löschung nach Konvertierung |

> **Empfehlung:** Bearbeiter sollten Sitzungsdaten nach Abschluss der Schwärzungsarbeit löschen, insbesondere bei Bearbeitung sensitiver Dokumente.

---

## 6. Betroffenenrechte

Die in den Dokumenten betroffenen Personen (Dritte, deren Daten geschwärzt werden) haben folgende Rechte:

| Recht | Artikel DSGVO | Einschränkungen |
|-------|--------------|----------------|
| Auskunftsrecht | Art. 15 DSGVO | Kann gemäß § 29 Abs. 1 BDSG eingeschränkt sein, wenn IFG-Verfahren oder behördliche Geheimhaltungspflichten entgegenstehen |
| Recht auf Berichtigung | Art. 16 DSGVO | Sachgemäße Bearbeitung |
| Recht auf Löschung | Art. 17 DSGVO | Kann durch gesetzliche Aufbewahrungspflichten eingeschränkt sein |
| Recht auf Einschränkung | Art. 18 DSGVO | Sachgemäße Bearbeitung |
| Recht auf Widerspruch | Art. 21 DSGVO | Kann durch zwingende öffentliche Interessen eingeschränkt sein |

**Beschwerderecht:** Betroffene können sich bei der **Bundesbeauftragten für den Datenschutz und die Informationsfreiheit (BfDI)** beschweren:  
Graurheindorfer Straße 153, 53117 Bonn  
poststelle@bfdi.bund.de

---

## 7. Automatisierte Entscheidungsfindung

EasyRedact führt **keine automatisierte Entscheidungsfindung** im Sinne des Art. 22 DSGVO durch. Alle Schwärzungsvorschläge des KI-Assistenten werden dem Nutzer zur manuellen Prüfung und Bestätigung vorgelegt. Die endgültige Entscheidung liegt beim zuständigen Bearbeiter.

---

## 8. Datenschutz durch Technikgestaltung und datenschutzfreundliche Voreinstellungen (Art. 25 DSGVO)

EasyRedact implementiert folgende Privacy-by-Design- und Privacy-by-Default-Maßnahmen:

| Maßnahme | Technische Umsetzung |
|---------|---------------------|
| **Datensparsamkeit** | Dokumenttext wird nur bei expliziter Einwilligung übermittelt; Rohdaten (Binärdaten) verbleiben immer im Browser |
| **Lokale Verarbeitung** | PDF-Rendering, Textextraktion, Schwärzung und Export erfolgen vollständig im Browser (MuPDF WASM) |
| **Einwilligungsmanagement** | Zweistufige Einwilligung (Modellwahl + Dokumentzugriff) vor jeder KI-gestützten Analyse |
| **Keine persistente Serverspeicherung** | Keine Datenbank; API-Routen sind zustandslos |
| **Metadatenentfernung** | Funktion zum Entfernen von PDF-Metadaten vor Export |
| **Keine Telemetrie** | Keine Analytics- oder Tracking-Dienste eingebunden |
| **Sichere HTTP-Header** | X-Frame-Options, CSP, Referrer-Policy, Permissions-Policy |
| **Robots.txt** | Suchmaschinen-Indexierung gesperrt |

---

## 9. Sicherheit der Verarbeitung (Art. 32 DSGVO)

Technische und organisatorische Maßnahmen (TOMs) gemäß Art. 32 DSGVO sind im **Sicherheitskonzept** (separates Dokument) beschrieben. Zusammenfassung:

- Transportverschlüsselung: HTTPS/TLS 1.3 (PKI-Zertifikat der Behörde)
- Zugriffskontrolle: Netzwerkseitig (Behörden-Intranet, Reverse Proxy)
- Datenhaltung: Ausschließlich browserseitig (kein zentrales Datenleck-Risiko)
- Auftragsverarbeitung: Azure OpenAI mit AVV und EU-Datenhaltung (Sweden Central)

---


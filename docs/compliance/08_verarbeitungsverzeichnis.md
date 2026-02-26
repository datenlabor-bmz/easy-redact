# Verzeichnis von Verarbeitungstätigkeiten (VVT) – EasyRedact

**Dokumentversion:** 1.0  
**Stand:** Februar 2026  
**Rechtsgrundlage:** Art. 30 DSGVO; § 70 BDSG  
**Verantwortlicher:** die Behörde (Betreiber)  
**Behördlicher Datenschutzbeauftragter:** [Name und Kontakt einsetzen]

---

## Vorbemerkung

Das Verzeichnis von Verarbeitungstätigkeiten (VVT) nach Art. 30 DSGVO dokumentiert alle wesentlichen Verarbeitungstätigkeiten des Verantwortlichen. Dieses Dokument beschreibt den VVT-Eintrag für die Verarbeitungstätigkeit **„Dokumentenschwärzung mit EasyRedact"**.

---

## VVT-Eintrag Nr. [laufende Nummer einsetzen]

### A. Grunddaten der Verarbeitungstätigkeit

| Feld | Inhalt |
|------|--------|
| **Bezeichnung der Verarbeitungstätigkeit** | Dokumentenschwärzung mit KI-Unterstützung (EasyRedact) |
| **Datum der Aufnahme** | [Datum einsetzen] |
| **Datum der letzten Überprüfung** | [Datum einsetzen] |
| **Zuständiges Referat / Organisationseinheit** | datenlabor-bmz; alle nutzenden Referate |
| **Ansprechpartner (technisch)** | [Name, datenlabor-bmz, Kontakt einsetzen] |

---

### B. Verantwortlicher (Art. 30 Abs. 1 lit. a DSGVO)

**Name:** die Behörde (Betreiber)  
**Anschrift:** Stresemannstraße 94, 10963 Berlin  
**Vertreten durch:** Bundesminister für wirtschaftliche Zusammenarbeit und Entwicklung  
**Datenschutzbeauftragter:** [Name, Anschrift, Telefon, E-Mail einsetzen]

---

### C. Zwecke der Verarbeitung (Art. 30 Abs. 1 lit. b DSGVO)

1. **Schwärzung personenbezogener Daten** in Behördendokumenten vor Weitergabe an Antragsteller, Gerichte, andere Behörden oder zur Veröffentlichung
2. **Bearbeitung von IFG-Anfragen**: Unterstützung bei der Umsetzung des Informationsfreiheitsgesetzes (IFG), Umweltinformationsgesetzes (UIG) und verwandter Normen durch KI-gestützte Identifikation von Ausnahmetatbeständen (§ 5 IFG, § 6 IFG u.a.)
3. **Effizienzsteigerung**: Reduzierung des manuellen Aufwands bei der Schwärzungsarbeit durch KI-Vorschlagsgenerierung

---

### D. Beschreibung der Kategorien betroffener Personen (Art. 30 Abs. 1 lit. c DSGVO)

| Kategorie betroffener Personen | Beschreibung |
|-------------------------------|-------------|
| **Antragsteller** | Natürliche oder juristische Personen, die IFG-Anfragen gestellt haben |
| **Beteiligte und erwähnte Personen** | In Behördendokumenten genannte natürliche Personen (Zeugen, Beteiligte, Gutachter etc.) |
| **Behördenmitarbeiter** | Namentlich genannte Beschäftigte der Behörde oder anderer Behörden |
| **Vertragspartner / Dritte** | In Verträgen oder Berichten genannte natürliche Personen |
| **Beschäftigte der Behörde (als Anwender)** | Im sehr begrenzten Umfang: Zugriffsdaten über Reverse-Proxy-Log |

---

### E. Kategorien personenbezogener Daten (Art. 30 Abs. 1 lit. c DSGVO)

#### Reguläre personenbezogene Daten

- Vor- und Nachnamen
- Anschriften (Wohn- und Dienstanschriften)
- E-Mail-Adressen, Telefonnummern
- Berufliche Angaben (Dienstbezeichnung, Funktion, Arbeitgeber)
- Bankverbindungen, IBAN
- Geburtsdaten
- Unterschriften (als Bild in PDFs)
- Kfz-Kennzeichen

#### Besondere Kategorien personenbezogener Daten (Art. 9 DSGVO)

- **Gesundheitsdaten** (z.B. in medizinischen Gutachten, Krankheitsbescheinigungen)
- **Daten über politische Meinungen** (z.B. in politischen Berichten)
- **Gewerkschaftszugehörigkeit** (z.B. in Tarifverhandlungsunterlagen)
- **Religiöse oder weltanschauliche Überzeugungen** (selten)

#### Strafrechtliche Daten (Art. 10 DSGVO)

- **Angaben zu strafrechtlichen Verurteilungen oder Straftaten** (z.B. in Compliance-Berichten)

---

### F. Kategorien von Empfängern (Art. 30 Abs. 1 lit. d DSGVO)

#### Interne Empfänger

- Sachbearbeiter des jeweiligen Referats (als Anwender der Plattform)
- Empfänger des geschwärzten Dokuments (Antragsteller, Gerichte, andere Behörden)

#### Externe Empfänger (Auftragsverarbeiter)

| Auftragsverarbeiter | Dienst | Rechtsgrundlage | Sitz |
|---------------------|--------|-----------------|------|
| Microsoft Ireland Operations Limited | Azure OpenAI Service (Region: Sweden Central) | Art. 28 DSGVO (AVV) | Irland / EU |

> **Bedingung:** Datenübermittlung an Azure OpenAI erfolgt **ausschließlich** nach expliziter Nutzereinwilligung im System und nur für den Dokumenttext (kein Binär-Upload).

#### Drittländer-Übermittlungen (Art. 30 Abs. 1 lit. e DSGVO)

Keine Übermittlung in Drittländer außerhalb des EWR, da Azure OpenAI in Region Sweden Central (EU) betrieben wird.

> **Vorbehalt:** Bei Nutzung des US CLOUD Act durch US-Behörden gegenüber Microsoft besteht ein theoretisches Restrisiko. Entsprechende Schutzmaßnahmen (AVV, EU-SCC, Transfer Impact Assessment) sind vertraglich zu regeln.

---

### G. Löschfristen (Art. 30 Abs. 1 lit. f DSGVO)

| Datenkategorie | Speicherort | Löschfrist | Verantwortlich |
|---------------|-------------|-----------|---------------|
| Dokumentinhalte in Browser-IndexedDB | Browser des Anwenders (IndexedDB) | Nach Sitzungsende / manuell durch Anwender | Anwender |
| Chat-Verlauf in Browser-IndexedDB | Browser des Anwenders | Nach Sitzungsende / manuell | Anwender |
| Temporäre DOCX-Dateien | Server-Dateisystem (RAM/tmp) | Sofortig nach Konvertierung | Automatisch (Anwendung) |
| Azure OpenAI-Verarbeitung | Azure OpenAI Service | Keine Speicherung nach Verarbeitung (lt. Microsoft DPA) | Microsoft Azure |
| Reverse-Proxy-Zugriffslog | Log-Infrastruktur der Behörde | Gemäß Protokollierungsrichtlinie der Behörde (empfohlen: 90 Tage) | IT-Referat der Behörde |
| Exportiertes geschwärztes Dokument | DMS / Dateisystem des Anwenders | Gemäß Aktenordnungsplan und einschlägiger Aufbewahrungsfristen der Behörde | Zuständiges Referat |

---

### H. Beschreibung der technischen und organisatorischen Maßnahmen (TOMs) (Art. 30 Abs. 1 lit. g DSGVO)

#### Technische Maßnahmen

| Maßnahme | Kategorie |
|---------|-----------|
| Transportverschlüsselung HTTPS/TLS 1.3 (Intranet: Nutzer → Reverse Proxy) | Vertraulichkeit |
| Transportverschlüsselung HTTPS/TLS 1.3 (Reverse Proxy / Container → Azure OpenAI via Unternehmens-Proxy) | Vertraulichkeit |
| Zweistufiges Einwilligungsmanagement (Modellwahl + Dokumentzugriff) vor jeder KI-Analyse | Datenschutz by Design |
| Lokale PDF-Verarbeitung im Browser (MuPDF WASM) – keine Übertragung von Binärdaten | Datensparsamkeit |
| Sofortige Löschung temporärer DOCX-Konvertierungsdateien | Datensparsamkeit |
| Kein persistentes Server-Logging von Dokumentinhalten (Produktionsmodus) | Datensparsamkeit |
| HTTP-Sicherheitsheader (CSP, X-Frame-Options, Permissions-Policy etc.) | Integrität / Vertraulichkeit |
| Intranet-only Deployment: keine öffentliche Erreichbarkeit | Zugriffsbeschränkung |
| Containerisierung (Docker / Kubernetes) mit Namespace-Isolation | Integrität |

#### Organisatorische Maßnahmen

| Maßnahme | Kategorie |
|---------|-----------|
| Zugriffskontrolle via Intranet-Firewall | Zugriffskontrolle |
| Authentifizierung am Reverse Proxy (LDAP/AD) | Zugriffskontrolle |
| Nutzungsrichtlinie / Dienstanweisung (zu erstellen) | Governance |
| Onboarding-Dialog (Erstnutzer, Pflicht-Bestätigung per Checkbox, in IndexedDB persistiert) + Download-Bestätigungsdialog | Awareness / Schulungsersatz |
| Auftragsverarbeitungsvertrag (AVV) mit Microsoft Azure | Vertragsmanagement |
| Datenschutz-Folgenabschätzung (DSFA) durchgeführt | Compliance |
| Incident-Response-Prozess (bestehende Prozesse der Behörde) | Notfallmanagement |

---

### I. Rechtsgrundlagen der Verarbeitung

| Verarbeitungsvorgang | Rechtsgrundlage |
|---------------------|----------------|
| Hauptverarbeitung: Dokument-Schwärzung für IFG/Datenschutzzwecke | Art. 6 Abs. 1 lit. e DSGVO i.V.m. § 3 BDSG (öffentliches Interesse / behördliche Aufgabe), i.V.m. §§ 1 ff. IFG, §§ 3 ff. UIG |
| Verarbeitung besonderer Datenkategorien (Art. 9 DSGVO) | Art. 9 Abs. 2 lit. g DSGVO i.V.m. § 22 Abs. 1 Nr. 1 lit. b BDSG (erhebliches öffentliches Interesse, IFG-Vollzug) |
| Verarbeitung strafrechtlicher Daten (Art. 10 DSGVO) | Art. 10 DSGVO i.V.m. § 24 BDSG (öffentliches Interesse) |
| Übermittlung an Azure OpenAI (Auftragsverarbeitung) | Art. 28 DSGVO |

---

### J. Verweise auf verwandte Dokumente

| Dokument | Speicherort |
|---------|-------------|
| IT-Sicherheitskonzept EasyRedact | `docs/compliance/06_sicherheitskonzept.md` |
| DSFA EasyRedact | `docs/compliance/05_datenschutzfolgeabschaetzung.md` |
| Datenschutzinformation für Beschäftigte | `docs/compliance/04_datenschutzinformation.md` |
| Technische Systemdokumentation | `docs/compliance/01_systemdokumentation.md` |
| Betriebskonzept | `docs/compliance/07_betriebskonzept.md` |
| AVV Microsoft Azure (extern) | [Ablageort im DMS der Behörde einsetzen] |

---

### K. Freigabe und Genehmigung

| Rolle | Name | Datum | Unterschrift |
|-------|------|-------|-------------|
| Verantwortliche Stelle (Betreiber) | | | |
| Datenschutzbeauftragter | | | |
| IT-Sicherheitsbeauftragter | | | |

---


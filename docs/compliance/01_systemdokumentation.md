# Technische Systemdokumentation – EasyRedact

**Dokumentversion:** 1.0  
**Stand:** Februar 2026  
**Erstellt für:** [Betreibende Behörde]  
**Verantwortlich:** datenlabor-bmz

---

## 1. Systemübersicht

### 1.1 Zweck und Funktion

EasyRedact ist eine KI-gestützte Webanwendung zur Schwärzung von PDF- und DOCX-Dokumenten. Die Anwendung unterstützt Sachbearbeiterinnen und Sachbearbeiter bei der Bearbeitung von Auskunftsersuchen nach dem Informationsfreiheitsgesetz (IFG) sowie bei der Entfernung personenbezogener Daten aus behördlichen Dokumenten vor deren Weitergabe oder Veröffentlichung.

Das System kombiniert lokale Dokumentenverarbeitung im Browser mit optional zugeschalteter KI-Analyse über Azure OpenAI oder ein lokal betriebenes Sprachmodell.

### 1.2 Einsatzbereich

- Bearbeitung von IFG-Anfragen (§ 1 IFG, § 3 UIG, Landesinformationsfreiheitsgesetze)
- Schwärzung personenbezogener Daten vor Weitergabe
- Unterstützung mehrerer Referate/Abteilungen der Behörde
- Betrieb ausschließlich im internen Netz der Behörde (Intranet/On-Premises)

### 1.3 Abgrenzung

EasyRedact **trifft keine** Schwärzungsentscheidungen autonom. Alle KI-Vorschläge werden dem Nutzer zur manuellen Prüfung und Freigabe angezeigt. Die endgültige Entscheidung liegt stets beim zuständigen Bearbeiter (human-in-the-loop).

---

## 2. Technologie-Stack

| Schicht | Komponente | Version | Lizenz |
|---------|------------|---------|--------|
| Web-Framework | Next.js (App Router) | 15.x | MIT |
| UI-Library | React | 19.x | MIT |
| UI-Komponenten | shadcn/ui (Radix Primitives) | 1.x | MIT |
| Styling | Tailwind CSS | 4.x | MIT |
| Internationalisierung | next-intl | 4.x | MIT |
| PDF-Verarbeitung | MuPDF (WASM) | 1.27 | AGPL-3.0 |
| Browser-Persistenz | idb (IndexedDB-Wrapper) | 8.x | ISC |
| KI-Client | OpenAI Node SDK | 6.x | MIT |
| DOCX-Konvertierung | LibreOffice | 7.x | MPL-2.0 |
| NLP (lokal) | spaCy (de_core_news_lg) | 3.x | MIT |
| Laufzeitumgebung | Node.js | 22.x | MIT |
| Containerisierung | Docker | 24+ | Apache-2.0 |

**Gesamtlizenz der Anwendung:** AGPL-3.0

> **Hinweis AGPL:** EasyRedact ist selbst unter AGPL-3.0 veröffentlicht; die AGPL-3.0-Lizenz von MuPDF ist damit vollständig kompatibel. Behördeninterne Modifikationen des Quellcodes sollten im Sinne der Lizenz dokumentiert werden.

---

## 3. Systemarchitektur

### 3.1 Deployment-Topologie (On-Premises)

Siehe [02_c4_architektur.md – Level 4](./02_c4_architektur.md#level-4--deployment-diagramm-on-premises).

### 3.2 Datenflussdiagramm

```
Nutzer-Browser
│
├─[1]─ PDF/DOCX hochladen
│       └─ Datei gespeichert in IndexedDB (lokal, kein Server-Upload)
│
├─[2]─ DOCX-Konvertierung (nur Docker-Modus)
│       └─ POST /api/docx → LibreOffice (serverseitig, temp. Datei)
│       └─ PDF zurück an Browser → IndexedDB
│
├─[3]─ PDF-Rendering & Textextraktion
│       └─ MuPDF WASM im Browser (kein Serverkontakt)
│
├─[4]─ KI-Chat (nach expliziter Einwilligung)
│       ├─ POST /api/chat ← [Chatverlauf + Dokumenttext (wenn Einwilligung erteilt)]
│       │   ├─ Cloud-KI: weiterleitung an Azure OpenAI (Sweden Central)
│       │   └─ Lokal-KI: weiterleitung an lokalen LLM-Endpunkt (z.B. Ollama)
│       └─ SSE-Stream → Browser (Vorschläge, Fragen, Statusmeldungen)
│
└─[5]─ Exportiertes PDF
        └─ MuPDF WASM erstellt geschwärztes PDF im Browser (kein Server-Upload)
```

### 3.3 Server-seitige API-Routen

| Route | Methode | Zweck | Externe Verbindungen |
|-------|---------|-------|---------------------|
| `/api/chat` | POST | KI-Chat-Proxy, Streaming | Azure OpenAI oder lokaler LLM |
| `/api/docx` | POST | DOCX→PDF-Konvertierung | Keine (LibreOffice lokal) |
| `/api/nlp` | POST | spaCy NER (Docker) | Keine (lokal) |

---

## 4. Datenhaltung und Persistenz

### 4.1 Browser-seitige Datenhaltung (IndexedDB)

| Datenbankname | Object Store | Inhalt | Löschung |
|---------------|-------------|--------|---------|
| `easy-redact` | `files` | Rohdaten hochgeladener Dokumente (ArrayBuffer) | Manuell durch Nutzer oder Browser-Datenlöschung |
| `easy-redact` | `session` | Sitzungsstatus, Schwärzungsgeometrie, Einwilligungsstatus | Wie `files` |
| `easy-redact` | `chat` | Chat-Verlauf (Nachrichten mit Rollen) | Wie `files` |

**localStorage:**
- `er-left-width`, `er-right-width`: Panel-Breiten (keine sensiblen Daten)
- `hasVisitedApp`: Boolean für Erstbesuch-Weiterleitung

### 4.2 Server-seitige Datenhaltung

**Es gibt keine serverseitige Datenbank.** Alle API-Routen sind zustandslos. Temporäre Dateien bei der DOCX-Konvertierung (`/api/docx`) werden nach der Verarbeitung sofort gelöscht.

### 4.3 Datenübertragung an Dritte

| Datenkategorie | Übertragung an | Bedingung |
|---------------|----------------|-----------|
| Dokumenttext (extrahiert) | Azure OpenAI (Sweden Central) | Nur nach expliziter Nutzereinwilligung (Cloud-KI) |
| Dokumenttext (extrahiert) | Lokaler LLM-Endpunkt | Nur nach expliziter Nutzereinwilligung (Lokal-KI) |
| IFG-Regelwerk | GitHub CDN (raw.githubusercontent.com) | Nur in FOI-Modus, serverseitig, keine personenbezogenen Daten |
| Rohdokument | Kein Dritter | Dokumente verbleiben im Browser |

---

## 5. Umgebungsvariablen und Konfiguration

| Variable | Pflicht | Beschreibung | Beispielwert |
|----------|---------|-------------|-------------|
| `AZURE_OPENAI_API_KEY` | Ja (Cloud) | Azure OpenAI API-Schlüssel | `abc123...` |
| `AZURE_OPENAI_API_BASE` | Ja (Cloud) | Azure-Endpunkt-URL | `https://behoerde-oai.openai.azure.com` |
| `AZURE_OPENAI_API_VERSION` | Nein | API-Version | `2024-12-01-preview` |
| `AZURE_OPENAI_DEPLOYMENT` | Nein | Deployment-Name | `gpt-5.2` |
| `OPENAI_API_BASE` | Nein (Lokal) | Lokaler LLM-Endpunkt | `http://localhost:11434/v1` |
| `OPENAI_API_KEY` | Nein (Lokal) | Lokaler LLM-Key | `ollama` |
| `LOCAL_LLM_MODEL` | Nein | Lokales Modell | `llama3.3:latest` |
| `NEXT_PUBLIC_LOCAL_LLM_ENABLED` | Nein | Lokal-KI-Option anzeigen | `true` |
| `HTTPS_PROXY` | Nein | Unternehmens-Proxy für externe Verbindungen | `http://proxy.behoerde.intern:8080` |
| `HTTP_PROXY` | Nein | HTTP-Proxy | `http://proxy.behoerde.intern:8080` |
| `NO_PROXY` | Nein | Proxy-Ausnahmen | `localhost,127.0.0.1` |
| `LIBREOFFICE_PATH` | Nein (Docker) | LibreOffice-Pfad | `/usr/bin/libreoffice` |
| `SPACY_ENABLED` | Nein (Docker) | spaCy-Endpunkt aktivieren | `true` |

**Sicherheitshinweis:** `AZURE_OPENAI_API_KEY` muss als Secret in der Deployment-Umgebung hinterlegt werden (Kubernetes Secret / Docker Secret), niemals im Klartext in Konfigurationsdateien.

---

## 6. Abhängigkeiten und externe Dienste

### 6.1 Azure OpenAI (Sweden Central)

- **Dienstanbieter:** Microsoft Azure
- **Region:** Sweden Central (EU-Datenhaltung)
- **Dienst:** Azure OpenAI Service
- **Nutzung:** Chat Completions API mit Tool Calling und Streaming
- **Datenverarbeitungsvertrag:** Microsoft Online Services DPA (inkl. EU-Standardvertragsklauseln)
- **Zertifizierungen:** ISO 27001, ISO 27017, ISO 27018, SOC 2 Type 2
- **Keine Daten-Retention:** Eingaben werden von Azure OpenAI nicht für Modelltraining verwendet (opt-out standardmäßig aktiv bei Azure-Kunden)
- **Verbindung:** HTTPS/TLS 1.3 via Unternehmens-Proxy

### 6.2 GitHub (CDN für IFG-Regelwerk)

- **Dienstanbieter:** GitHub Inc. (Microsoft)
- **Zweck:** Abruf des Datensatzes `datenlabor-bmz/redaction-rules`
- **Datenkategorie:** Rein strukturelle Regelwerksdaten (keine personenbezogenen Daten)
- **Verbindung:** Server-seitig (Next.js API Route), nicht vom Browser
- **Alternative:** Regelwerk kann für Air-Gap-Betrieb lokal gebündelt werden

### 6.3 Kein weiterer Drittanbieter

Es werden keine Analytics-, Tracking- oder Telemetrie-Dienste eingebunden.

---

## 7. Sicherheitsfunktionen der Anwendung

### 7.1 Einwilligungsmanagement

Das System implementiert ein zweistufiges Einwilligungsmodell:

1. **Stufe 1 – Modellauswahl:** Beim ersten Start wählt der Nutzer die Verarbeitungsoption (Cloud-KI / Lokal-KI / Keine KI).
2. **Stufe 2 – Dokumentenzugang:** Bevor das KI-Modell auf den Dokumenteninhalt zugreifen darf, zeigt das System ein dediziertes Einwilligungsdialog. Erst nach expliziter Bestätigung werden Dokumentinhalte an den `/api/chat`-Endpunkt übermittelt.

Technisch: Das Tool `read_documents` ist im OpenAI-Tool-Schema deaktiviert, solange kein Einwilligungsstatus gesetzt ist. Der Dokumenttext (`documentPages`) wird nur dann im Request-Body mitgesendet, wenn `consent !== null`.

### 7.2 Lokale Verarbeitung (Privacy by Design)

- PDF-Rendering und Textextraktion erfolgen vollständig im Browser via MuPDF WASM
- Schwärzungsgeometrie wird lokal berechnet (keine Server-Roundtrips)
- Export des geschwärzten PDFs erfolgt im Browser (kein Upload)
- Alle Dokumente und Sitzungsdaten verbleiben in IndexedDB des Nutzerbrowsers

### 7.3 Metadaten-Entfernung

EasyRedact ermöglicht das Entfernen von PDF-Metadaten (Author, Creator, Producer, Keywords, Subject, Title, XMP-Metadaten) vor dem Export. Dies verhindert die unbeabsichtigte Weitergabe interner Autorenschaftsinformationen.

### 7.4 HTTP-Sicherheits-Header

Die Anwendung liefert folgende Sicherheits-Header:

| Header | Wert |
|--------|------|
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `X-DNS-Prefetch-Control` | `off` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=()` |
| `Content-Security-Policy` | `default-src 'self'; connect-src 'self'; frame-ancestors 'none'` (vereinfacht) |

### 7.5 Keine Telemetrie

Die Anwendung enthält keine Analytics-, Tracking- oder Telemetrie-Dienste (kein Google Analytics, kein PostHog, keine Sentry-Cloud-Integration).

---

## 8. Systemgrenzen und Nicht-Funktionalitäten

- **Keine Nutzerverwaltung/Authentifizierung:** Die Anwendung verwaltet keine Nutzerkonten. Zugriffskontrolle obliegt der IT-Infrastruktur der Behörde (Netzwerk-ACL, Reverse Proxy mit Authentifizierung).
- **Keine Auditprotokollierung:** Schwärzungsaktionen werden nicht serverseitig protokolliert. Bei Bedarf kann ein Reverse Proxy (z.B. nginx) vorgelagert werden.
- **Keine Versionierung von Schwärzungsentscheidungen:** EasyRedact ist kein Dokumentenmanagementsystem. Exportierte Dateien müssen im DMS der Behörde nachgehalten werden.
- **Keine Dateigrößenbeschränkung:** Sehr große PDFs können die Browser-Performance beeinträchtigen. Empfehlung: < 100 MB pro Datei.

---


# IT-Sicherheitskonzept – EasyRedact

> 📥 [Alle Compliance-Dokumente als DOCX herunterladen](https://github.com/datenlabor-bmz/easy-redact/releases/download/compliance-docs/EasyRedact_Compliance.zip)

**Dokumentversion:** 1.0  
**Stand:** Februar 2026  
**Methodik:** BSI IT-Grundschutz (BSI-Standard 200-2), NIST SP 800-53 ergänzend  
**Erstellt durch:** datenlabor-bmz / IT-Sicherheitsbeauftragter  
**Gültigkeitsbereich:** EasyRedact v1.x, On-Premises-Betrieb

---

## 1. Einführung und Geltungsbereich

### 1.1 Zweck des Dokuments

Dieses IT-Sicherheitskonzept beschreibt die technischen und organisatorischen Sicherheitsmaßnahmen für den Betrieb von EasyRedact. Es dient als Grundlage für:
- Die Freigabe des Systems durch den IT-Sicherheitsbeauftragten (ISB) der Behörde
- Die fortlaufende Bewertung und Weiterentwicklung der Sicherheitsmaßnahmen
- Die Erfüllung der Anforderungen aus BSI IT-Grundschutz, DSGVO (Art. 32) und den IT-Sicherheitsrichtlinien der Behörde

### 1.2 Geltungsbereich

Das Konzept gilt für:
- Die EasyRedact-Anwendung (Docker-Container)
- Die zugrundeliegende Container-Hosting-Infrastruktur der Behörde
- Die Nutzung von Azure OpenAI (Microsoft) als externem Auftragsverarbeiter
- Die Arbeitsplatz-PCs der Sachbearbeiter (soweit durch IndexedDB-Nutzung relevant)

### 1.3 Schutzbedarf

Gemäß BSI IT-Grundschutz gilt folgender **Schutzbedarf**:

| Schutzziel | Schutzbedarf | Begründung |
|------------|-------------|------------|
| **Vertraulichkeit** | **Hoch** | Dokumente können besondere Datenkategorien (Art. 9 DSGVO) enthalten; IFG-relevante, möglicherweise behördenintern eingestufte Informationen |
| **Integrität** | **Hoch** | Korrekte Schwärzungsergebnisse sind kritisch; fehlerhafte Schwärzungen können zu Datenschutzverletzungen führen |
| **Verfügbarkeit** | **Normal** | Ausfälle sind unangenehm, aber vertretbar; Fallback auf manuelle Schwärzung möglich |

> Hinweis: Sollte EasyRedact für Dokumente mit VS-Einstufung (Verschlusssachen) genutzt werden, ist eine Neubewertung des Schutzbedarfs und ggf. eine gesonderte Zulassung nach VSA erforderlich.

---

## 2. Bedrohungsanalyse

### 2.1 Bedrohungslandschaft

| ID | Bedrohung | Quelle | Relevanz |
|----|-----------|--------|---------|
| T1 | Unbefugter Zugriff auf Anwendung | Interne Angreifer, kompromittierte Accounts | Mittel |
| T2 | XSS / Injection-Angriff auf Webanwendung | Externe Angreifer via Intranet | Mittel |
| T3 | Abfluss von Dokumentinhalt über unsicheren Transportkanal | Man-in-the-Middle im Intranet | Gering (TLS) |
| T4 | Kompromittierung des Docker-Containers | Angreifer mit Zugriff auf Container-Host | Gering-Mittel |
| T5 | Datenpanne beim Cloud-Auftragsverarbeiter (Azure OpenAI) | Microsoft-intern / Sicherheitslücke | Sehr gering |
| T6 | Abfluss von Daten aus Browser-IndexedDB | Physischer Zugriff auf Arbeitsplatz, XSS | Gering |
| T7 | Abhören der Azure OpenAI-Verbindung | Netzwerkangreifer | Sehr gering (TLS 1.3) |
| T8 | Angriff auf DOCX-Konvertierung (LibreOffice) | Präparierte DOCX-Dateien (Macro-Angriff) | Mittel |
| T9 | Supply-Chain-Angriff auf npm-Abhängigkeiten | Kompromittierte npm-Pakete | Mittel |
| T10 | Denial of Service (Ressourcenerschöpfung) | Interne Nutzer, Fehlbedienung | Gering |

### 2.2 Detailbewertung: T8 – LibreOffice DOCX-Angriff

LibreOffice wird verwendet, um DOCX-Dateien in PDF umzuwandeln. Präparierte DOCX-Dateien mit eingebetteten Makros, Skripten oder ausnutzbaren Parsing-Schwachstellen könnten den LibreOffice-Prozess kompromittieren.

**Mitigationsmaßnahmen:**
- LibreOffice wird mit `--headless`-Flag ausgeführt (kein UI, keine interaktiven Makros)
- LibreOffice läuft innerhalb des Docker-Containers mit eingeschränkten Rechten
- Der Container sollte ohne Root-Rechte laufen (siehe M-CON-02)

---

## 3. Sicherheitsmaßnahmen

### 3.1 Überblick: Maßnahmen nach BSI-Grundschutzklassen

#### Infrastruktur und Netzwerk

| ID | Maßnahme | BSI-Baustein | Status |
|----|---------|-------------|--------|
| M-NET-01 | EasyRedact ist **ausschließlich im Behörden-Intranet** zugänglich. Kein direkter Internet-Zugriff auf die Anwendung. | NET.1 | ✅ Architekturvorgabe |
| M-NET-02 | **TLS 1.3** für alle Verbindungen zwischen Nutzer und Anwendung (PKI-Zertifikat der Behörde am Reverse Proxy). | NET.3 | ⚠️ Konfiguration durch IT |
| M-NET-03 | **Firewall-Regeln**: Nur Port 443 von Intranet-Clients; ausgehend nur HTTPS an Azure OpenAI via Unternehmens-Proxy. | NET.3 | ⚠️ Konfiguration durch IT |
| M-NET-04 | **Unternehmens-Proxy** für ausgehende Azure OpenAI-Verbindungen. TLS-Inspection möglich (AVV-Klausel prüfen). | NET.3 | ⚠️ Konfiguration durch IT |
| M-NET-05 | **DNS-Sicherheit**: Kein öffentlicher DNS-Eintrag für EasyRedact-Endpunkt. | NET.1 | ✅ Architekturvorgabe |

#### Zugriffskontrolle

**Bewusste Architekturentscheidung: Keine nutzerspezifische Authentifizierung**

EasyRedact implementiert keine eigene Nutzerauthentifizierung. Dies ist eine dokumentierte, bewusste Designentscheidung mit folgender Begründung:

- Potenziell alle Beschäftigten der Behörde können mit IFG-Anfragen konfrontiert werden und benötigen Zugriff.
- Die Anwendung speichert keine Daten server-seitig; ein unauthentifizierter Intranet-Nutzer erhält keinen Zugriff auf Daten anderer Nutzer.
- Der einzige schützenswerte Server-seitige Wert ist der Azure OpenAI API-Key, der als Container-Secret verwaltet wird und für Endnutzer nie exponiert ist.
- Das Risiko eines unbefugten Zugriffs (z.B. durch Gäste im Intranet) wird durch die Netzwerkgrenze (Firewall, Intranet-only) auf akzeptables Maß reduziert.

Die Zugriffskontrolle erfolgt ausschließlich auf Netzwerkebene (M-NET-01 bis M-NET-03).

| ID | Maßnahme | BSI-Baustein | Status |
|----|---------|-------------|--------|
| M-AUTH-01 | **Netzwerkbasierte Zugriffskontrolle**: Zugriff nur aus dem Behörden-Intranet via Firewall. Keine nutzerspezifische Authentifizierung erforderlich (siehe Begründung oben). | ORP.4 | ✅ Architekturvorgabe |
| M-AUTH-02 | **Keine Standardpasswörter**: Azure OpenAI API-Key als Docker Secret oder Secrets-Vault, nicht im Klartext. | ORP.4 | ✅ Betriebsanforderung |

#### Anwendungssicherheit

| ID | Maßnahme | BSI-Baustein | Status |
|----|---------|-------------|--------|
| M-APP-01 | **Content Security Policy (CSP)**: Implementiert. Verhindert XSS-Ausführung aus fremden Quellen. | APP.3.1 | ✅ Implementiert |
| M-APP-02 | **X-Frame-Options: DENY**: Implementiert. Verhindert Clickjacking. | APP.3.1 | ✅ Implementiert |
| M-APP-03 | **X-Content-Type-Options: nosniff**: Implementiert. | APP.3.1 | ✅ Implementiert |
| M-APP-04 | **Referrer-Policy**: Implementiert. Verhindert Referrer-Leakage. | APP.3.1 | ✅ Implementiert |
| M-APP-05 | **Permissions-Policy**: Implementiert. Deaktiviert Kamera, Mikrofon, Geolocation. | APP.3.1 | ✅ Implementiert |
| M-APP-06 | **Input-Validierung**: Dokument-Uploads sind auf unterstützte Typen beschränkt (PDF/DOCX). | APP.3.1 | ✅ Implementiert |
| M-APP-07 | **Kein produktionsseitiges Logging von Dokumentinhalten**: Console-Logs in Produktion deaktiviert. | APP.3.1 | ✅ Implementiert |
| M-APP-08 | **Dependency-Scan**: Regelmäßiger Scan der npm-Abhängigkeiten auf bekannte CVEs (z.B. `npm audit`). | APP.3.1 | ⚠️ CI/CD-Integration erforderlich |
| M-APP-09 | Intranet-Deployment: Keine öffentliche DNS-Erreichbarkeit. | APP.3.1 | ✅ Implementiert |
| M-APP-10 | **CORS**: Keine CORS-Freigabe für externe Domains. | APP.3.1 | ✅ Next.js Standard |

#### Container und Betrieb

| ID | Maßnahme | BSI-Baustein | Status |
|----|---------|-------------|--------|
| M-CON-01 | **Container als Non-Root**: Docker-Container soll ohne Root-Rechte laufen (`USER node` im Dockerfile). | SYS.1.6 | ⚠️ Dockerfile-Anpassung erforderlich |
| M-CON-02 | **Read-only Root Filesystem**: Container-Dateisystem nur lesbar mounten; `/tmp` als tmpfs. | SYS.1.6 | Empfehlung |
| M-CON-03 | **Minimales Base Image**: Kein unnötiger Software-Ballast; nur notwendige Pakete installieren. | SYS.1.6 | ✅ `node:22-slim` als Base |
| M-CON-04 | **Container-Image-Signing**: Images sollten signiert werden (z.B. mit Cosign/Notary). | SYS.1.6 | Empfehlung |
| M-CON-05 | **Keine persistenten Volumes**: EasyRedact speichert keine persistenten Daten server-seitig. Kein persistentes Volume erforderlich. | SYS.1.6 | ✅ Architekturvorgabe |
| M-CON-06 | **Regelmäßige Image-Updates**: Container-Image bei CVEs in Abhängigkeiten neu bauen. | SYS.1.6 | ⚠️ Prozess erforderlich |
| M-CON-07 | **Secret-Management**: Azure OpenAI API-Key über Docker Secret oder HashiCorp Vault, nicht als Umgebungsvariable im Compose-File. | SYS.1.6 | ⚠️ Konfiguration |

#### Datenschutz und Datensicherheit

| ID | Maßnahme | BSI-Baustein | Status |
|----|---------|-------------|--------|
| M-DS-01 | **Lokale Dokumentenverarbeitung**: Alle PDF-Operationen im Browser (MuPDF WASM). Dokument-Binärdaten verlassen nie den Browser. | CON.2 | ✅ Implementiert |
| M-DS-02 | **Einwilligung vor KI-Verarbeitung**: Dokumenttext wird erst nach expliziter Nutzerbestätigung an KI-APIs gesendet. | CON.2 | ✅ Implementiert |
| M-DS-03 | **Azure OpenAI: Keine Datenspeicherung**: AVV mit Microsoft sichert Nicht-Speicherung und Nicht-Nutzung für Training ab. | CON.2 | ⚠️ AVV abzuschließen |
| M-DS-04 | **Temporäre Dateien**: DOCX-Konvertierungs-Temporärdateien werden sofort nach Verarbeitung gelöscht. | CON.2 | ✅ Implementiert |
| M-DS-05 | **Metadaten-Entfernung**: Nutzer können PDF-Metadaten vor Export entfernen. | CON.2 | ✅ Implementiert |

#### Organisatorische Maßnahmen

| ID | Maßnahme | BSI-Baustein | Status |
|----|---------|-------------|--------|
| M-ORG-01 | **Nutzungsrichtlinie**: Kurze Dienstanweisung, die die Prüfpflicht für KI-Vorschläge und den Umgang mit sensiblen Dokumenten regelt. | ORP.1 | ⚠️ Zu erstellen (siehe `docs/compliance/09_nutzungsrichtlinie.md`) |
| M-ORG-02 | **Onboarding-Dialog (Erstnutzer)**: Beim ersten Aufruf der App wird ein Hinweisdialog angezeigt (Prüfpflicht, Verarbeitungsmodi, VS-Einstufung). Muss mit Checkbox bestätigt werden, bevor die App nutzbar ist. Bestätigung wird in IndexedDB persistiert. Ersetzt eine formale Schulung. | ORP.3 | ✅ Implementiert |
| M-ORG-07 | **Bestätigungsdialog vor dem Herunterladen**: Beim Klick auf „Schwärzen und herunterladen" erscheint ein Dialog, der den Nutzer auf seine Verantwortung für die Vollständigkeit der Schwärzungen hinweist und eine bewusste Bestätigung erfordert. | APP.3.1 | ✅ Implementiert |
| M-ORG-03 | **Incident Response**: Prozess für Sicherheitsvorfälle (Datenpanne, Systemkompromittierung). | DER.2 | ⚠️ Bestehende Prozesse der Behörde anwenden |
| M-ORG-04 | **Patch-Management**: Regelmäßige Updates von Node.js, npm-Abhängigkeiten, LibreOffice, spaCy. | OPS.1.1.3 | ⚠️ Prozess definieren |

| M-ORG-06 | **Auditlogging**: Zugriffsprotokollierung am Reverse Proxy (Zeitstempel, Quell-IP, HTTP-Status — kein Dokumentinhalt, keine Nutzer-ID da keine Authentifizierung). | DER.1 | ⚠️ Konfiguration durch IT |

---

## 4. Residualrisiken

Nach Umsetzung aller Maßnahmen verbleiben folgende Restrisiken:

| Risiko | Residualrisiko | Akzeptanzentscheidung |
|--------|---------------|----------------------|
| Unvollständige KI-Schwärzung durch Modellfehler | 🟡 Mittel | Akzeptiert; Mitigation durch Onboarding-Hinweis (M-ORG-02), Nutzungsrichtlinie (M-ORG-01) und human-in-the-loop-Architektur |
| LibreOffice-Parsing-Schwachstelle | 🟡 Mittel | Akzeptiert; Mitigation durch Headless-Modus und eingeschränkte Container-Rechte |
| US Cloud Act für Azure-Daten | 🟢 Gering | Akzeptiert; abgemildert durch EU-Datenhaltung, AVV, Transfer Impact Assessment |
| Kompromittierung eines Arbeitsplatz-Browsers (IndexedDB-Zugriff) | 🟢 Gering | Akzeptiert; liegt im Verantwortungsbereich des generellen Endpoint-Schutzes der Behörde |

---

## 5. Notfall- und Wiederanlaufkonzept

### 5.1 Notfallszenarien

| Szenario | Auswirkung | Maßnahme |
|---------|-----------|---------|
| EasyRedact-Container nicht erreichbar | Ausfall KI-Schwärzungshilfe | Fallback auf manuelle Schwärzung (kein Betriebsausfall) |
| Azure OpenAI nicht erreichbar | Cloud-KI nicht verfügbar | Fallback auf Lokal-LLM oder manuelle Schwärzung |
| Sicherheitsvorfall (Datenpanne) | Mögliche Datenschutzverletzung | Sofortige Abschaltung, DSB informieren, ggf. Meldepflicht Art. 33 DSGVO (72h) |
| Kompromittierung des Container-Hosts | Mögliche Systemkompromittierung | Container-Isolation schützt weitgehend; Forensik, Neuaufbau |

### 5.2 Wiederanlauf

EasyRedact ist zustandslos (keine persistenten Server-Daten). Wiederanlauf durch:
1. Neustart des Docker-Containers
2. Ggf. Neu-Pull des Container-Images
3. Keine Datenmigration erforderlich

RTO (Recovery Time Objective): < 30 Minuten  
RPO (Recovery Point Objective): N/A (keine Server-Daten)

---

## 6. Konformität und Zertifizierungen

| Anforderung | Quelle | Status |
|-------------|--------|--------|
| BSI IT-Grundschutz (Basis-Absicherung) | BSI-Standard 200-2 | ⚠️ In Umsetzung |
| DSGVO Art. 32 (TOMs) | DSGVO | ✅ Implementiert (mit offenen Punkten) |
| NIST SP 800-53 (informell) | NIST | Teilweise |
| BSI TR-03161 (KI-Sicherheit, wenn anwendbar) | BSI | Prüfung empfohlen |
| OWASP ASVS Level 1 (Anwendungssicherheit) | OWASP | Zur Orientierung |

---

## 7. Verantwortlichkeiten

| Rolle | Name | Aufgabe |
|-------|------|---------|
| IT-Sicherheitsbeauftragter (ISB) | [Name einsetzen] | Freigabe, Überwachung, Incident Response |
| Datenschutzbeauftragter (DSB) | [Name einsetzen] | Datenschutz-Compliance, DSFA-Freigabe |
| Technischer Betrieb | IT-Referat der Behörde | Container-Betrieb, Patching, Monitoring |
| Anwendungsentwicklung | datenlabor-bmz | Sicherheits-Updates, Patches |
| Fachanwender | jeweiliges Referat | Nutzungsrichtlinie einhalten, Vorfälle melden |

---

## 8. Anhang: Sicherheitsbewertung von Drittkomponenten

### MuPDF (AGPL-3.0)

- Bekannte CVEs: Regelmäßige Prüfung unter https://nvd.nist.gov (Suche: „mupdf")
- Besonderheit: WASM-Version läuft im Browser-Sandbox; direkter Systemzugriff nicht möglich
- Empfehlung: Version 1.27+ nutzen; CVE-Monitoring einrichten

### LibreOffice (MPL-2.0)

- Bekannte CVE-Klasse: Macro-Exploits, Parsing-Schwachstellen in DOCX/OLE
- Mitigationsmaßnahme: `--headless` und Container-Isolation
- Empfehlung: Regelmäßige Updates

### Node.js 22 (MIT)

- LTS-Version: Langzeitunterstützung bis April 2027
- Empfehlung: `npm audit` in CI/CD-Pipeline; automatische Sicherheitsupdates

### Azure OpenAI (Externer Dienst)

- ISO 27001 zertifiziert
- SOC 2 Type 2 geprüft
- Microsoft Security Response Center (MSRC): https://msrc.microsoft.com
- Sicherheitszusagen in der Microsoft Online Services DPA

---


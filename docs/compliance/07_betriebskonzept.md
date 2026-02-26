# Betriebskonzept – EasyRedact

**Dokumentversion:** 1.0  
**Stand:** Februar 2026  
**Erstellt für:** IT-Infrastruktur und IT-Sicherheitsbeauftragter der Behörde

---

## 1. Überblick

Dieses Betriebskonzept beschreibt die Installation, Konfiguration, den laufenden Betrieb und die Wartung von EasyRedact in der On-Premises-Infrastruktur der Behörde. Es richtet sich an das IT-Referat der Behörde sowie an datenlabor-bmz als technischen Verantwortlichen der Anwendung.

---

## 2. Systemanforderungen

### 2.1 Server-Anforderungen (Container-Host)

| Ressource | Minimum | Empfehlung |
|-----------|---------|-----------|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB | 8 GB |
| Disk | 10 GB (für Image + Logs) | 20 GB |
| OS | Linux (Debian/Ubuntu LTS) | Ubuntu 24.04 LTS |
| Docker | 24.x | 27.x |

**Hinweis:** LibreOffice und spaCy erhöhen den Speicherbedarf des Container-Images erheblich (~2 GB komprimiert). Bei hoher gleichzeitiger Nutzung (>20 Benutzer) sollte RAM und CPU entsprechend skaliert werden.

### 2.2 Netzwerkanforderungen

| Verbindung | Protokoll | Port | Richtung | Zweck |
|-----------|-----------|------|---------|-------|
| Nutzer-Browser → Reverse Proxy | HTTPS/TLS | 443 | Eingehend | Web-Zugriff |
| Reverse Proxy → Container | HTTP | 3000 | Intern | Proxy-Forward |
| Container → Unternehmens-Proxy → Azure OpenAI | HTTPS/TLS | 443 | Ausgehend | Cloud-KI (optional) |
| Container → github.com CDN | HTTPS/TLS | 443 | Ausgehend | IFG-Regelwerk (optional; nur FOI-Modus) |
| Container → Lokaler LLM-Endpunkt | HTTP | konfigurierbar | Intern | Lokal-KI (optional) |

### 2.3 Client-Anforderungen (Arbeitsplatz)

| Anforderung | Details |
|-------------|---------|
| Browser | Google Chrome 120+ oder Microsoft Edge 120+ |
| JavaScript | Aktiviert (zwingend erforderlich) |
| WebAssembly | Unterstützt (in allen modernen Browsern der Fall) |
| IndexedDB | Aktiviert (Standardeinstellung) |
| Mindest-RAM | 4 GB empfohlen für große PDFs |

---

## 3. Deployment-Anleitung

### 3.1 Voraussetzungen

```bash
# Docker und Docker Compose müssen installiert sein
docker --version   # >= 24.0
docker compose version  # >= 2.20
```

### 3.2 Konfiguration

1. Repository klonen oder Image ziehen:

```bash
git clone https://github.com/datenlabor-bmz/easy-redact.git
cd easy-redact
```

2. Umgebungsvariablen konfigurieren:

```bash
cp .env.example .env
# .env bearbeiten:
# AZURE_OPENAI_API_KEY=<Secret aus dem Secrets-Vault>
# AZURE_OPENAI_API_BASE=https://<tenant>.openai.azure.com
# AZURE_OPENAI_DEPLOYMENT=gpt-5.2
# HTTPS_PROXY=http://proxy.behoerde.intern:8080
# HTTP_PROXY=http://proxy.behoerde.intern:8080
# NO_PROXY=localhost,127.0.0.1,*.intern
```


3. Docker-Image bauen:

```bash
docker compose build
```

4. Container starten:

```bash
docker compose up -d
```

5. Gesundheitsprüfung:

```bash
curl -f http://localhost:3000/de/about
```

### 3.3 Reverse-Proxy-Konfiguration (nginx)

```nginx
# /etc/nginx/conf.d/easy-redact.conf
server {
    listen 443 ssl http2;
    server_name easy-redact.intern.behoerde;  # Hostname anpassen

    ssl_certificate     /etc/ssl/behoerde/pki.crt;
    ssl_certificate_key /etc/ssl/behoerde/pki.key;
    ssl_protocols       TLSv1.3;
    ssl_ciphers         TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256;

    # LDAP-Authentifizierung (via nginx-auth-ldap Modul oder Vorauthentifizierung)
    auth_ldap "Login erforderlich";
    auth_ldap_servers ldap_behoerde;

    location / {
        proxy_pass         http://easy-redact-container:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;

        # SSE-Unterstützung (Server-Sent Events für Chat-Streaming)
        proxy_buffering    off;
        proxy_read_timeout 300s;
        proxy_send_timeout 300s;
        chunked_transfer_encoding on;
    }
}

# HTTP → HTTPS Redirect
server {
    listen 80;
    server_name easy-redact.intern.behoerde;
    return 301 https://$host$request_uri;
}
```

> **Wichtig für SSE (Server-Sent Events):** `proxy_buffering off` und erhöhte `proxy_read_timeout` sind zwingend erforderlich, da der Chat-Stream über SSE läuft und ohne diese Einstellungen der Stream frühzeitig abgebrochen wird.

---

## 4. Konfigurationsmanagement

### 4.1 Umgebungsvariablen-Referenz (Betrieb)

| Variable | Produktionswert | Pflicht |
|----------|----------------|---------|
| `NODE_ENV` | `production` | Ja (automatisch gesetzt) |
| `AZURE_OPENAI_API_KEY` | Aus Secrets-Vault | Ja (Cloud-KI) |
| `AZURE_OPENAI_API_BASE` | Azure-Endpunkt der Behörde | Ja (Cloud-KI) |
| `AZURE_OPENAI_DEPLOYMENT` | `gpt-5.2` oder spezifisches Deployment | Ja (Cloud-KI) |
| `HTTPS_PROXY` | Unternehmens-Proxy-URL | Ja (für ausgehende Verbindungen) |
| `NO_PROXY` | `localhost,127.0.0.1` | Ja |
| `NEXT_PUBLIC_LOCAL_LLM_ENABLED` | `false` (Standard) oder `true` wenn Ollama verfügbar | Nein |

### 4.2 Azure OpenAI Deployment einrichten

Im Azure-Portal für die Azure-Subscription der Behörde:

1. **Azure OpenAI-Ressource** in Region **Sweden Central** erstellen
2. **Deployment** anlegen: Modell `gpt-5.2`, Deployment-Name nach Konvention der Behörde
3. **API-Key** aus dem Azure-Portal in den Secrets-Vault speichern
4. **Netzwerkzugriff**: Private Endpoint oder IP-Restriktionen auf Unternehmens-Proxy-IPs konfigurieren
5. **Content Filter**: Ggf. anpassen (Standard-Filter können für Behördendokumente zu restriktiv sein)

---

## 5. Update- und Patch-Management

### 5.1 Aktualisierungsprozess

```
1. Entwicklung: datenlabor-bmz veröffentlicht neue Version im Repository
2. Test: IT-Referat und Datenlabor testen neue Version in Staging-Umgebung
3. Freigabe: ISB und DSB prüfen sicherheits- und datenschutzrelevante Änderungen
4. Deployment: `docker compose pull && docker compose up -d`
5. Verifikation: Smoke-Test und Gesundheitsprüfung
```

### 5.2 Kritische Update-Szenarien

| Szenario | Reaktionszeit | Prozess |
|---------|--------------|---------|
| Kritische CVE in Node.js/npm-Abhängigkeiten | < 48h | Notfall-Patch-Prozess |
| Kritische CVE in MuPDF oder LibreOffice | < 48h | Notfall-Patch-Prozess |
| Sicherheitsrelevante Änderung der Azure OpenAI API | < 1 Woche | Regulärer Update-Prozess |
| Feature-Update | Nach Freigabe | Regulärer Release-Zyklus |

### 5.3 Dependency-Scan (automatisiert)

```bash
# In CI/CD-Pipeline:
npm audit --production
# Oder mit strengerer Auswertung:
npm audit --audit-level=high
```

---

## 6. Monitoring und Betriebsüberwachung

### 6.1 Empfohlene Metriken

| Metrik | Schwellenwert | Alarmierung |
|--------|--------------|------------|
| Container-Status | Running | Sofort bei Down |
| HTTP 5xx-Fehler | > 5% in 5 Minuten | Warnung |
| Antwortzeit (p95) | > 30s | Warnung |
| Container-Memory | > 80% Limit | Warnung |
| Container-CPU | > 90% über 5 Minuten | Warnung |

### 6.2 Logging

**Anwendungs-Logs (Produktionsmodus):**
- Minimales Logging; keine Dokumentinhalte
- Fehlermeldungen ohne sensitive Daten
- Format: JSON-Strukturiert (für Log-Aggregation)

**Empfohlene Log-Aggregation:**
- SIEM der Behörde (Splunk/ELK o.ä.) für zentrales Logging
- Reverse-Proxy-Logs: Zugriffsprotokollierung (User-ID, Zeitstempel, HTTP-Status, URL ohne Query-Parameter)
- Aufbewahrung: Gemäß Protokollierungsrichtlinie der Behörde (typisch: 90 Tage)

### 6.3 Gesundheitsprüfung

```bash
# Basis-Healthcheck
curl -f https://easy-redact.intern.behoerde/de/about  # Hostname anpassen

# Chat-API-Check (ohne Dokumentinhalt)
curl -X POST https://easy-redact.intern.behoerde/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[],"model":"test","consent":null,"redactionMode":"pii","locale":"de"}'
```

---

## 7. Datensicherung und Wiederherstellung

### 7.1 Datensicherungsstrategie

EasyRedact speichert **keine persistenten Server-seitigen Daten**. Es sind daher folgende Datensicherungsmaßnahmen ausreichend:

| Artefakt | Sicherungsmethode | Häufigkeit |
|---------|------------------|-----------|
| Container-Image | Container-Registry mit Tags | Bei jedem Release |
| Konfiguration (nicht Secrets) | Git-Repository (ohne .env) | Kontinuierlich |
| Secrets | Secrets-Vault mit Backup | Nach Vault-Policy der Behörde |
| IFG-Regelwerk (GitHub) | Optionales lokales Caching im Container | Bei Bedarf |

### 7.2 Wiederherstellung nach Ausfall

1. Container aus gesichertem Image neu starten: ~5 Minuten
2. Konfiguration (Umgebungsvariablen) aus Secrets-Vault laden: ~5 Minuten
3. **Keine Datenmigration erforderlich** (zustandsloser Server)

Gesamte RTO: < 30 Minuten

---

## 8. Notfallkontakte

| Rolle | Kontakt | Eskalation bei |
|-------|---------|---------------|
| Technischer Betrieb | IT-Referat der Behörde, [Rufnummer] | Verfügbarkeit, Container-Probleme |
| Anwendungsentwicklung | datenlabor-bmz, [E-Mail] | Bugs, Sicherheitslücken in der Anwendung |
| IT-Sicherheitsbeauftragter (ISB) | [Kontakt], [E-Mail] | Sicherheitsvorfälle, Datenpannen |
| Datenschutzbeauftragter (DSB) | datenschutz@behoerde.intern | Datenschutzverletzungen, DSFA-Fragen |
| Microsoft Azure Support | Azure-Portal (P1-Ticket) | Azure OpenAI-Ausfälle oder Datenpannen |

---

## 9. Abnahme und Freigabeprozess

Vor der Produktionseinführung müssen folgende Dokumente/Freigaben vorliegen:

| Schritt | Zuständig | Status |
|---------|-----------|--------|
| Technische Systemdokumentation erstellt | datenlabor-bmz | ✅ (dieses Paket) |
| DSFA abgeschlossen und freigegeben | DSB | ⚠️ Ausstehend |
| IT-Sicherheitskonzept freigegeben | ISB | ⚠️ Ausstehend |
| AVV mit Microsoft Azure abgeschlossen | Beschaffung / Datenschutz | ⚠️ Ausstehend |
| Nutzungsrichtlinie / Dienstanweisung in Kraft | IT-Referat / DSB | ⚠️ Ausstehend |
| ISB-Freigabe erteilt | ISB | ⚠️ Ausstehend |
| DSB-Freigabe erteilt | DSB | ⚠️ Ausstehend |

---


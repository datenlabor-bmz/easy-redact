# KI-Klassifizierung nach EU AI Act – EasyRedact

**Dokumentversion:** 1.0  
**Stand:** Februar 2026  
**Rechtsgrundlage:** Verordnung (EU) 2024/1689 (EU AI Act), in Kraft seit 1. August 2024  
**Anwendbar ab:** 2. August 2026 (für Hochrisiko-KI-Systeme nach Annex III); 2. August 2025 (für verbotene KI-Systeme)

---

## 1. Zusammenfassung (Executive Summary)

EasyRedact ist als **KI-System mit geringem Risiko** (Artikel 50 EU AI Act: Transparenzpflichten) einzustufen. Es handelt sich **nicht** um ein Hochrisiko-KI-System im Sinne des Annex III der Verordnung. Als KI-System, das mit Beschäftigten einer Bundesbehörde interagiert und die KI-Natur erkennbar darstellt, unterliegt EasyRedact ausschließlich den Transparenzpflichten des Art. 50 EU AI Act.

Darüber hinaus ist der Einsatz von Azure OpenAI GPT-5.2 als **KI-Modell mit allgemeinem Verwendungszweck (GPAI-Modell)** zu beachten. Die Pflichten für GPAI-Modelle treffen den **Anbieter** (Microsoft/OpenAI), nicht den Einsatzbetrieb (Betreiber).

---

## 2. Anwendbarkeit des EU AI Act

### 2.1 Ist EasyRedact ein „KI-System" im Sinne des EU AI Act?

**Ja.** Art. 3 Nr. 1 EU AI Act definiert ein KI-System als:

> „maschinengestütztes System, das für einen oder mehrere der [definierten] Zwecke betrieben wird und das aus den erhaltenen Eingaben Ausgaben wie Vorhersagen, Empfehlungen, Entscheidungen oder Inhalte erzeugen kann, die physische oder virtuelle Umgebungen beeinflussen."

EasyRedact erfüllt diese Definition: Es nimmt Dokumenttexte als Eingabe und erzeugt Schwärzungsempfehlungen als Ausgabe, die vom Nutzer in der physischen/virtuellen Umgebung umgesetzt werden können.

### 2.2 Ist die Behörde „Betreiber" im Sinne des EU AI Act?

**Ja.** Die Behörde setzt EasyRedact im eigenen Betrieb ein und ist damit **Betreiber** (Deployer) gemäß Art. 3 Nr. 4 EU AI Act. Die Pflichten für Betreiber sind in Art. 26 EU AI Act geregelt.

### 2.3 Ist Microsoft/Azure OpenAI „Anbieter" des zugrunde liegenden KI-Systems?

**Ja**, für das GPAI-Modell (GPT-5.2). Microsoft/OpenAI ist Anbieter des Modells. Das datenlabor-bmz ist Entwickler/Anbieter der **Anwendung** EasyRedact, die das GPAI-Modell integriert.

---

## 3. Risikoklassifizierung

### 3.1 Prüfschema

```
Schritt 1: Verbotene KI-Praktiken (Art. 5 EU AI Act)?
│
└─► NEIN → weiter

Schritt 2: Hochrisiko-KI-System (Art. 6 + Annex III)?
│
└─► NEIN → weiter

Schritt 3: KI-System mit Transparenzpflichten (Art. 50)?
│
└─► JA → Transparenzpflichten einhalten

Schritt 4: Minimales Risiko?
│
└─► (Teilweise – für rein manuelle Schwärzungsfunktionen ohne KI)
```

### 3.2 Prüfung: Verbotene KI-Praktiken (Art. 5)

| Verbotene Praxis | Anwendbar? | Begründung |
|-----------------|-----------|------------|
| Unterschwellige Beeinflussung | Nein | EasyRedact gibt keine Verhaltensempfehlungen |
| Ausnutzung von Schwachstellen | Nein | Keine Ausrichtung auf vulnerable Gruppen |
| Social Scoring durch Behörden | Nein | Keine Bewertung natürlicher Personen |
| Echtzeitbiometrische Fernidentifizierung | Nein | Keine biometrischen Verfahren |
| Predictive Policing | Nein | Kein Strafverfolgungskontext |
| Emotionserkennung am Arbeitsplatz | Nein | Keine Emotionserkennung |
| Biometrische Kategorisierung | Nein | Keine Biometrie |

**Ergebnis: Keine verbotenen Praktiken.**

### 3.3 Prüfung: Hochrisiko-KI-System (Annex III)

Die acht Hochrisiko-Kategorien des Annex III werden geprüft:

| Kategorie (Annex III) | Anwendbar? | Begründung |
|----------------------|-----------|------------|
| 1. Biometrische Identifizierung | **Nein** | Keine biometrischen Verfahren |
| 2. Kritische Infrastruktur | **Nein** | Verwaltungsanwendung, keine kritische Infrastruktur |
| 3. Bildung und Ausbildung | **Nein** | Nicht im Bildungsbereich eingesetzt |
| 4. Beschäftigung und Personalverwaltung | **Nein** | Keine Einstellungs- oder Leistungsbewertung |
| 5. Wesentliche Dienste (z.B. Sozialleistungen, Kredit) | **Nein** | Betrifft nur interne Sachbearbeiterhilfe, keine Entscheidungen über Sozialleistungen |
| 6. Strafverfolgung | **Nein** | Keine Strafverfolgung |
| 7. Migration und Grenzverwaltung | **Nein** | Keine Migrationsentscheidungen |
| 8. Justiz und demokratische Prozesse | **Grenzfall, aber NEIN** – Begründung unten | |

**Detailprüfung Kategorie 8 (Justiz und demokratische Prozesse):**

Art. 6 Abs. 2 i.V.m. Annex III Nr. 8 erfasst KI-Systeme, die:
- bei der Justiz eingesetzt werden und Richter bei der Recherche, Interpretation von Fakten oder der Anwendung von Recht unterstützen, oder
- bei Wahlen und Abstimmungen eingesetzt werden.

EasyRedact unterstützt die **Verwaltungstätigkeit bei IFG-Anfragen** (administrative document redaction), nicht die **Rechtsanwendung durch Richter**. Die Schwärzungsentscheidung liegt beim Bearbeiter, nicht beim KI-System. EasyRedact hat keinen Einfluss auf Verwaltungsentscheidungen (z.B. Ablehnung einer IFG-Anfrage); es unterstützt nur die technische Umsetzung einer bereits getroffenen Entscheidung.

**Ergebnis: EasyRedact ist kein Hochrisiko-KI-System nach Annex III.**

> **Vorsorglicher Hinweis:** Sollte die Behörde EasyRedact zukünftig in einem Kontext einsetzen, der direkte Entscheidungsunterstützung für Verwaltungsakte beinhaltet (z.B. automatische Ablehnungsempfehlungen für IFG-Anfragen), ist die Klassifizierung zu überprüfen.

### 3.4 Prüfung: Transparenzpflichten (Art. 50)

Art. 50 Abs. 1 EU AI Act gilt für KI-Systeme, die mit natürlichen Personen interagieren (Chatbot-Systeme). EasyRedact enthält einen KI-Chat-Assistenten, der mit Sachbearbeitern interagiert.

**Pflicht:** Nutzer müssen informiert werden, dass sie mit einem KI-System interagieren.

**Status:** ✅ EasyRedact erfüllt diese Pflicht. Die KI-Natur ist durch die Benutzeroberfläche (Chat-Interface mit KI-Persona "EasyRedact", explizite Einwilligungsabfrage für KI-Verarbeitung) transparent und erkennbar. Keine Täuschung über die KI-Natur.

---

## 4. Pflichten für Betreiber nach Art. 26 EU AI Act

Da EasyRedact kein Hochrisiko-KI-System ist, entfällt der Großteil der Betreiberpflichten aus Art. 26. Die folgenden allgemeinen Pflichten verbleiben:

| Pflicht | Quelle | Status / Maßnahme |
|---------|--------|-------------------|
| Transparenz über KI-Interaktion | Art. 50 Abs. 1 | ✅ Chat-Interface macht KI-Natur erkennbar |
| Keine Täuschung über KI-Natur | Art. 50 Abs. 1 | ✅ EasyRedact identifiziert sich als KI-Assistent |
| Keine verbotenen Praktiken | Art. 5 | ✅ Keine verbotenen Praktiken |
| Human Oversight (intern) | Best Practice | ✅ Alle Vorschläge erfordern menschliche Bestätigung |
| GPAI-Modell: DPA mit Microsoft | Art. 28 (DSGVO analog) | ⚠️ Azure OpenAI DPA/AVV muss abgeschlossen sein |

---

## 5. Einordnung des GPAI-Modells (Azure OpenAI)

GPT-5.2 ist ein **KI-Modell mit allgemeinem Verwendungszweck (GPAI-Modell)** im Sinne des Art. 51 EU AI Act. Für GPAI-Modelle mit systemischen Risiken (> 10^25 FLOPs Rechenaufwand) gelten besondere Pflichten – diese treffen **Microsoft als Anbieter**, nicht die Behörde als Betreiber.

Microsoft/OpenAI veröffentlicht Transparenzberichte und Model Cards für Azure OpenAI-Modelle und erfüllt die GPAI-Pflichten nach dem EU AI Act. Der Betreiber muss die Einhaltung dieser Pflichten vertraglich absichern (DPA mit Microsoft Azure).

---

## 6. Beziehung zum DSGVO-Recht

Der EU AI Act ergänzt die DSGVO, ersetzt sie nicht. Für Verarbeitungen personenbezogener Daten durch EasyRedact gelten parallel:

- **EU AI Act:** Transparenzpflichten (Art. 50), keine Hochrisiko-Pflichten
- **DSGVO:** Alle anwendbaren Pflichten (Rechtsgrundlage, DSFA, AVV, Betroffenenrechte)

Hinweis: Eine **Datenschutz-Folgenabschätzung (Art. 35 DSGVO)** ist für EasyRedact durchzuführen, da die Anwendung potenziell besondere Kategorien personenbezogener Daten (§ 9 BDSG, Art. 9 DSGVO) in den zu schwärzenden Dokumenten verarbeitet (siehe separates DSFA-Dokument).

---

## 7. KI-Register (Art. 26 Abs. 6 EU AI Act)

Betreiber von Hochrisiko-KI-Systemen müssen diese in der EU-Datenbank registrieren. Da EasyRedact kein Hochrisiko-KI-System ist, entfällt diese Pflicht.

Empfehlung: EasyRedact sollte dennoch in einem internen KI-Inventar der Behörde dokumentiert werden (Best Practice, ggf. zukünftige gesetzliche Anforderungen).

---

## 8. Zusammenfassung der Klassifizierung

| Kriterium | Ergebnis |
|-----------|---------|
| KI-System nach Art. 3 Nr. 1 EU AI Act | **Ja** |
| Verbotene KI-Praxis (Art. 5) | **Nein** |
| Hochrisiko-KI-System (Annex III) | **Nein** |
| Transparenzpflichtig (Art. 50) | **Ja – bereits erfüllt** |
| GPAI-Modell im Einsatz | **Ja (Azure OpenAI GPT-5.2) – Pflichten treffen Microsoft** |
| Betreiberpflichten nach Art. 26 | **Minimale Pflichten, erfüllt** |
| Eintragungspflicht EU-Datenbank | **Nein** |

**Risikoklasse: Geringes Risiko (Limited Risk)**

---

## 9. Revisionshistorie und empfohlene Überprüfungsintervalle

- **Jährliche Überprüfung** dieser Klassifizierung, insbesondere bei:
  - Erweiterung der Funktionalität (z.B. automatische Entscheidungsempfehlungen)
  - Änderungen am EU AI Act (delegierte Rechtsakte zu Annex III)
  - Einsatz in neuen Kontexten (z.B. Migrationssachbearbeitung, justizielle Verfahren)
- **Aktualisierung** bei Wechsel des KI-Modells oder -Anbieters

---


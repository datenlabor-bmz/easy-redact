# /// script
# dependencies = [
#   "spacy>=3.8,<3.9",
#   "de_core_news_lg @ https://github.com/explosion/spacy-models/releases/download/de_core_news_lg-3.8.0/de_core_news_lg-3.8.0-py3-none-any.whl",
# ]
# ///
"""
stdin: JSON array of {pageIndex: number, text: string}
stdout: JSON array of RedactionSuggestion
"""
import json
import sys
import spacy

nlp = spacy.load("de_core_news_lg")

ENTITY_TYPES = {
    "PER": ("Personen", "high"),
    "ORG": ("Organisationen", "low"),
    "LOC": ("Orte", "low"),
}

def process(pages: list[dict]) -> list[dict]:
    suggestions = []
    for page in pages:
        text = page["text"]
        page_idx = page["pageIndex"]
        if not text.strip():
            continue
        doc = nlp(text)
        for ent in doc.ents:
            ent_type = ent.label_
            if ent_type not in ENTITY_TYPES:
                continue
            person_group, confidence = ENTITY_TYPES[ent_type]
            suggestions.append({
                "text": ent.text,
                "pageIndex": page_idx,
                "confidence": confidence,
                "personGroup": person_group,
                "person": ent.text if ent_type == "PER" else None,
                "reason": f"Erkannte Entität: {ent_type}",
            })
    return suggestions

if __name__ == "__main__":
    pages = json.load(sys.stdin)
    print(json.dumps(process(pages), ensure_ascii=False))

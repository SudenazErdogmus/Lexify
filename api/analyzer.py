import re
import requests
from nltk.stem import WordNetLemmatizer
from nltk.wsd import lesk
from deep_translator import GoogleTranslator
from api.models import CEFRWord
from api.ai_service import ollama_kelime_analiz_et, _ollama_json_cagir

lemmatizer = WordNetLemmatizer()

LEVEL_ORDER = {
    "A1": 1,
    "A2": 2,
    "B1": 3,
    "B2": 4,
    "C1": 5,
    "C2": 6,
}


def get_lemma_candidates(word: str) -> list[str]:
    w = word.lower()
    candidates = [
        w,
        lemmatizer.lemmatize(w, pos="v"),
        lemmatizer.lemmatize(w, pos="n"),
        lemmatizer.lemmatize(w, pos="a"),
    ]
    return list(dict.fromkeys(candidates))


def fetch_contextual_details(lemma: str, context_sentence: str, use_ollama: bool = True) -> tuple[str, str, str]:
    tr_trans = ""
    en_def = ""
    example = ""

    # 1. Yerel Ollama (Bağlamsal Türkçe + Tanım + Örnek)
    if use_ollama:
        ollama_res = ollama_kelime_analiz_et(lemma, context_sentence)
        if ollama_res:
            tr_trans = ollama_res.get("turkce_ceviri", "")
            en_def = ollama_res.get("ingilizce_tanim", "")
            example = ollama_res.get("ornek_cumle", "")
            if tr_trans and en_def and example:
                return tr_trans, en_def, example

    # 2. Yedek: NLTK Lesk
    if not en_def or not example:
        try:
            tokens = re.findall(r"[A-Za-z]+", context_sentence.lower())
            synset = lesk(tokens, lemma)
            if synset:
                if not en_def:
                    en_def = synset.definition()
                if not example and synset.examples():
                    example = synset.examples()[0]
        except Exception:
            pass

    # 3. Yedek: Free Dictionary API
    if not en_def or not example:
        try:
            resp = requests.get(
                f"https://api.dictionaryapi.dev/api/v2/entries/en/{lemma}",
                timeout=3,
            )
            if resp.status_code == 200:
                data = resp.json()
                for meaning in data[0].get("meanings", []):
                    for d in meaning.get("definitions", []):
                        if not en_def and d.get("definition"):
                            en_def = d["definition"]
                        if not example and d.get("example"):
                            example = d["example"]
                        if en_def and example:
                            break
                    if en_def and example:
                        break
        except Exception:
            pass

    # 4. Yedek: GoogleTranslator
    if not tr_trans:
        try:
            tr_trans = GoogleTranslator(source="en", target="tr").translate(lemma) or ""
        except Exception:
            tr_trans = ""

    return tr_trans, en_def, example


def analyze_text_hybrid(text: str, user_level: str = "B1", ai_fallback_fn=None) -> list[dict]:
    user_rank = LEVEL_ORDER.get(user_level.upper(), 3)
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())

    all_candidates = set()
    for sentence in sentences:
        for token in re.findall(r"[A-Za-z]+", sentence):
            if len(token) >= 3:
                all_candidates.update(get_lemma_candidates(token))

    cefr_map = {
        item.word.lower(): item
        for item in CEFRWord.objects.filter(word__in=all_candidates)
    }

    matched_items = []
    seen_lemmas = set()
    missing_tr_entries = []

    for sentence in sentences:
        for token in re.findall(r"[A-Za-z]+", sentence):
            if len(token) < 3:
                continue

            matched_entry = None
            for candidate in get_lemma_candidates(token):
                if candidate in cefr_map:
                    matched_entry = cefr_map[candidate]
                    break

            if not matched_entry:
                continue

            lemma = matched_entry.word.lower()
            if lemma in seen_lemmas:
                continue

            word_rank = LEVEL_ORDER.get(matched_entry.cefr_level.upper(), 4)
            if word_rank > user_rank:
                seen_lemmas.add(lemma)
                matched_items.append((token.lower(), matched_entry, sentence.strip()))
                if not matched_entry.turkish_translation:
                    missing_tr_entries.append(matched_entry)

    # Tüm eksik kelimeleri 15'erli gruplar halinde yerel Ollama'ya çevirt
    if missing_tr_entries:
        for i in range(0, len(missing_tr_entries), 15):
            batch = missing_tr_entries[i:i + 15]
            words_list = [entry.word for entry in batch]
            prompt = (
                "Translate these English words into short, natural Turkish meanings (1-3 words each). "
                "Return ONLY a JSON object where each key is the exact English word and the value is its Turkish translation.\n"
                f"Words: {words_list}"
            )
            try:
                tr_map = _ollama_json_cagir(prompt, timeout=30)
                if isinstance(tr_map, dict):
                    lower_map = {str(k).lower(): str(v).strip() for k, v in tr_map.items()}
                    for entry in batch:
                        tr = lower_map.get(entry.word.lower(), "")
                        if tr:
                            entry.turkish_translation = tr
                            entry.save(update_fields=["turkish_translation"])
            except Exception as e:
                print(f"⚠️ Ollama toplu çeviri hatası: {e}")

    found_words = []
    for token_lower, entry, ctx in matched_items:
        found_words.append(
            {
                "kelime": token_lower,
                "kok": entry.word.lower(),
                "seviye": entry.cefr_level,
                "turkce_ceviri": entry.turkish_translation or "",
                "ingilizce_tanim": entry.english_definition or "",
                "ornek_cumle": entry.example_sentence or "",
                "baglam": ctx,
            }
        )

    return found_words
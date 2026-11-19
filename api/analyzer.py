import re
import requests
from nltk.stem import WordNetLemmatizer
from nltk.wsd import lesk
from deep_translator import GoogleTranslator
from api.models import CEFRWord

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


def fetch_contextual_details(lemma: str, context_sentence: str) -> tuple[str, str, str]:
    """
    1) NLTK Lesk ile cümledeki bağlama en uygun tanım ve örnek cümleyi bulur.
    2) Eksikse Free Dictionary API'den Cambridge/Oxford tarzı tanım ve örnek çeker.
    3) deep-translator ile ücretsiz Türkçe çeviri alır.
    """
    en_def = ""
    example = ""
    tr_trans = ""

    # 1. NLTK Lesk (Bağlamsal Anlam Belirleme)
    try:
        tokens = re.findall(r"[A-Za-z]+", context_sentence.lower())
        synset = lesk(tokens, lemma)
        if synset:
            en_def = synset.definition()
            if synset.examples():
                example = synset.examples()[0]
    except Exception:
        pass

    # 2. Free Dictionary API (Daha temiz tanım/örnek cümle için)
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

    # 3. Ücretsiz Türkçe Çeviri
    try:
        tr_trans = GoogleTranslator(source="en", target="tr").translate(lemma) or ""
    except Exception:
        tr_trans = ""

    return tr_trans, en_def, example


def analyze_text_hybrid(text: str, user_level: str = "B1", ai_fallback_fn=None) -> list[dict]:
    user_rank = LEVEL_ORDER.get(user_level.upper(), 3)

    sentences = re.split(r"(?<=[.!?])\s+", text.strip())

    # 1) Metindeki tüm aday kökleri tek seferde topla
    all_candidates = set()
    for sentence in sentences:
        for token in re.findall(r"[A-Za-z]+", sentence):
            if len(token) >= 3:
                all_candidates.update(get_lemma_candidates(token))

    # 2) 172 bin kelimenin tamamını değil, sadece metinde geçenleri veritabanından çek
    cefr_map = {
        item.word.lower(): item
        for item in CEFRWord.objects.filter(word__in=all_candidates)
    }

    found_words = []
    seen_lemmas = set()

    for sentence in sentences:
        raw_tokens = re.findall(r"[A-Za-z]+", sentence)
        for token in raw_tokens:
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

                # Eksik anlam/örnek varsa anında çek ve veritabanına önbellekle
                if not matched_entry.turkish_translation or not matched_entry.english_definition or not matched_entry.example_sentence:
                    tr, en_def, ex = fetch_contextual_details(lemma, sentence)
                    updated = False
                    if not matched_entry.turkish_translation and tr:
                        matched_entry.turkish_translation = tr
                        updated = True
                    if not matched_entry.english_definition and en_def:
                        matched_entry.english_definition = en_def
                        updated = True
                    if not matched_entry.example_sentence and ex:
                        matched_entry.example_sentence = ex
                        updated = True
                    if updated:
                        matched_entry.save()

                found_words.append(
                    {
                        "kelime": token.lower(),
                        "kok": lemma,
                        "seviye": matched_entry.cefr_level,
                        "turkce_ceviri": matched_entry.turkish_translation,
                        "ingilizce_tanim": matched_entry.english_definition,
                        "ornek_cumle": matched_entry.example_sentence,
                        "baglam": sentence.strip(),
                    }
                )

    return found_words
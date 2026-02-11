#!/usr/bin/env python3
"""Generate pronunciation audio for all vocabulary words using ElevenLabs TTS API.
Designed to run in GitHub Actions CI environment."""

import os
import time
import requests

API_KEY = os.environ.get("ELEVENLABS_API_KEY")
VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"  # George - warm British male
MODEL_ID = "eleven_multilingual_v2"
OUTPUT_DIR = "audio"

WORDS = [
    "Amicable", "Benevolent", "Coherent", "Commensurate", "Commendable",
    "Congenial", "Conscientious", "Convivial", "Courageous", "Diligent",
    "Eloquent", "Empathetic", "Erudite", "Ethical", "Exemplary",
    "Fastidious", "Fortuitous", "Generous", "Gregarious", "Humble",
    "Impartial", "Indefatigable", "Inimitable", "Innovative", "Judicious",
    "Magnanimous", "Meticulous", "Munificent", "Objective", "Optimistic",
    "Perspicacious", "Philanthropic", "Pragmatic", "Prudent", "Sagacious",
    "Scrupulous", "Stalwart", "Steadfast", "Tenacious", "Trustworthy",
    "Venerable", "Veracious", "Virtuous",
    "Aberrant", "Abrasive", "Aloof", "Apathetic", "Arrogant",
    "Avaricious", "Bellicose", "Belligerent", "Cantankerous", "Capricious",
    "Conceited", "Conniving", "Curmudgeonly", "Dastardly", "Deceitful",
    "Derisive", "Dogmatic", "Duplicitous", "Egocentric", "Fallacious",
    "Glib", "Haughty", "Hubristic", "Hypocritical", "Imperious",
    "Impetuous", "Indolent", "Insolent", "Lascivious", "Malevolent",
    "Mendacious", "Miserly", "Narcissistic", "Nefarious", "Obsequious",
    "Obstinate", "Obtrusive", "Ostentatious", "Parsimonious", "Pedantic",
    "Perverse", "Petulant", "Pompous", "Pretentious", "Pugnacious",
    "Quarrelsome", "Querulous", "Rapacious", "Recalcitrant", "Sanctimonious",
    "Sardonic", "Slovenly", "Surreptitious", "Truculent", "Uncouth",
    "Unscrupulous", "Vacuous", "Vindictive",
    "Aberration", "Accentuate", "Adamant", "Alluring", "Anachronism",
    "Ardent", "Baleful", "Cacophony", "Chaotic", "Clandestine",
    "Cogent", "Congruent", "Convoluted", "Cornucopia", "Cryptic",
    "Decorous", "Discombobulated", "Ebullient", "Effervescent", "Enigmatic",
    "Ephemeral", "Ethereal", "Euphoric", "Florid", "Furtive",
    "Garrulous", "Haphazard", "Immaculate", "Impervious", "Incongruous",
    "Inscrutable", "Invidious", "Jocular", "Laconic", "Loquacious",
    "Luminous", "Mercurial", "Myriad", "Nebulous", "Opulent",
    "Palpable", "Penurious", "Placid", "Precarious", "Pristine",
    "Quaint", "Resplendent", "Scintillating", "Serendipitous", "Somnolent",
    "Stoic", "Succinct", "Superfluous", "Tawdry", "Tempestuous",
    "Torpid", "Ubiquitous", "Unctuous", "Undulating", "Vicarious",
    "Vivacious", "Volatile",
    "Altruism", "Ambiguity", "Anathema", "Autonomy", "Axiom",
    "Camaraderie", "Complacency", "Dichotomy", "Dogma", "Duality",
    "Elation", "Empathy", "Ennui", "Epiphany", "Epistemic",
    "Equanimity", "Ethos", "Expediency", "Fallacy", "Fortitude",
    "Hegemony", "Hubris", "Idealism", "Idiosyncrasy", "Incongruity",
    "Infamy", "Insouciance", "Introspection", "Levity", "Malfeasance",
    "Malaise", "Nuance", "Omnipotence", "Omniscience", "Optimism",
    "Paradigm", "Paradox", "Pathos", "Perseverance", "Pessimism",
    "Piety", "Pragmatism", "Proactivity", "Quintessence", "Recapitulation",
    "Reciprocity", "Resilience", "Reverence", "Sanctity", "Serendipity",
    "Solipsism", "Sophistry", "Synergy", "Temerity", "Tranquility",
    "Veracity", "Zeitgeist",
    "Abdicate", "Acquiesce", "Admonish", "Advocate", "Belittle",
    "Capitulate", "Circumscribe", "Coalesce", "Coerce", "Cogitate",
    "Condone", "Conflate", "Corroborate", "Decry", "Defenestrate",
    "Delineate", "Disseminate", "Elucidate", "Embroil", "Emulate",
    "Encroach", "Enervate", "Engender", "Envisage", "Espouse",
    "Exacerbate", "Exculpate", "Exonerate", "Explicate", "Facilitate",
    "Fomenting", "Galvanize", "Gesticulate", "Impinge", "Inculcate",
    "Ingratiate", "Instigate", "Inure", "Lambaste", "Obfuscate",
    "Perpetuate", "Peruse", "Placate", "Prevaricate", "Proclivity",
    "Refute", "Reiterate", "Renounce", "Undermine", "Usurp",
    "Validate", "Wane",
    "Ace", "Acumen", "Affinity", "Alacrity", "All-nighter",
    "Articulate", "Austerity", "Blighter", "Blighty", "Bloke",
    "Bluster", "Blustery", "Bonkers", "Brevity", "Candid",
    "Catharsis", "Cheeky", "Chuffed", "Dearth", "Decorum",
    "Dissonance", "Dodgy", "Efficacy", "Elusive", "Epitome",
    "Faff", "Fetching", "Finesse", "Fluctuate", "Gobsmacked",
    "Gutted", "Heinous", "Inept", "Inexorable", "Jargon",
    "Knackered", "Labyrinth", "Litany", "Loo", "Lull",
    "Mate", "Naff", "Nosh", "Nothingburger", "Peckish",
    "Pinny", "Pissed", "Plonk", "Poppycock", "Portmanteau",
    "Quid", "Resilient", "Sarnie", "Scally", "Skint",
    "Skittish", "Snatched", "Solace", "Tenuous", "Tosser",
    "Trifle", "Voluntold", "Waffle", "Whinge", "Wind up",
    "Zonked",
    "Adjudicate", "Ambiguous", "Ameliorate", "Approbation", "Assiduous",
    "Auspicious", "Autonomous", "Bellwether", "Circumspect", "Comport",
    "Conflagration", "Contrite", "Corpulent", "Deference", "Derision",
    "Discern", "Disparate", "Efficacious", "Emolument", "Expedient",
    "Flummoxed", "Incumbent", "Incontrovertible", "Insidious", "Mitigate",
    "Opprobrium", "Perfunctory", "Pernicious", "Promulgate", "Propriety",
    "Prosaic", "Remuneration", "Reticent", "Retrenchment", "Salient",
    "Secondment", "Stipulate", "Substantiate", "Sycophant", "Unilateral",
    "Unprecedented", "Verbatim", "Zealous",
    "Allegory", "Alliteration", "Allusion", "Analogy", "Anaphora",
    "Antithesis", "Aphorism", "Apostrophe", "Archetype", "Assonance",
    "Cliché", "Colloquialism", "Concision", "Connotation", "Denotation",
    "Diction", "Didactic", "Elegy", "Epigram", "Eponymous",
    "Euphemism", "Evocative", "Hyperbole", "Idiom", "Irony",
    "Juxtaposition", "Metaphor", "Motif", "Onomatopoeia", "Oxymoron",
    "Pejorative", "Personification", "Prose", "Simile", "Soliloquy",
    "Syntax", "Theme", "Trite", "Trope", "Understatement",
    "Vernacular", "Verisimilitude", "Vignette",
    "Algorithm", "Anomaly", "Catalyst", "Cognition", "Ecosystem",
    "Empirical", "Entropy", "Hypothesis", "Isotope", "Metamorphosis",
    "Osmosis", "Paradigm", "Photosynthesis", "Quantum", "Symbiosis",
    "Taxonomy", "Thermodynamics", "Kinetics", "Nanotechnology", "Serology",
    "Viscosity",
    "Accrual", "Amortisation", "Arbitrage", "Asset", "Bear market",
    "Bull market", "Capital", "Collateral", "Consolidation", "Dividend",
    "Equity", "Fiscal", "Hedge", "Insolvency", "Leverage",
    "Liquidity", "Margin", "Portfolio", "Prorate", "Revenue",
    "ROI", "Securities", "Solvency", "Subsidiary", "Stagflation",
    "Valuation", "Volatility",
    "Acquittal", "Affidavit", "Alibi", "Arbitration", "Collusion",
    "Caveat", "Defamation", "Deposition", "Due diligence", "Encumbrancer",
    "Indictment", "Injunction", "Jurisprudence", "Litigant", "Litigation",
    "Perjury", "Plaintiff", "Precedent", "Prosecution", "Subpoena",
    "Tort", "Tribunal", "Verdict", "Writ",
    "Antibiotic", "Antibody", "Biopsy", "Cardiology", "Dermatology",
    "Diagnosis", "Epidemiology", "Haemoglobin", "Immunology", "Neurology",
    "Oncology", "Pathology", "Pharmacology", "Physiology", "Prophylaxis",
    "Radiology", "Symptom", "Toxicology", "Vaccine", "Virology",
    "Ambivalence", "Anguish", "Anticipation", "Apathy", "Apprehension",
    "Awe", "Compunction", "Contentment", "Contrition", "Despondency",
    "Discomfiture", "Euphoria", "Exasperation", "Foreboding", "Gratification",
    "Listlessness", "Melancholy", "Misgiving", "Nostalgia", "Resentment",
    "Serenity", "Solace", "Trepidation", "Zeal",
    "Academia", "Accreditation", "Bibliography", "Curriculum", "Dissertation",
    "Epistemology", "Pedagogy", "Plagiarism", "Rote", "Scholarship",
    "Syllabus", "Thesis", "Tutorial", "Vocational", "Workshop",
    "Aesthetic", "Arbitrary", "Befuddled", "Beleaguered", "Boisterous",
    "Conundrum", "Enigma", "Felicity", "Harbinger", "Incorrigible",
    "Ineffable", "Insatiable", "Lethargy", "Linchpin", "Nonplussed",
    "Peculiar", "Quiescent", "Quixotic", "Quintessential", "Unfathomable",
    "Utopia", "Zenith",
]

def word_to_id(word):
    return word.lower().replace(" ", "_").replace("-", "_")

def generate_audio(word):
    word_id = word_to_id(word)
    filepath = os.path.join(OUTPUT_DIR, f"{word_id}.mp3")

    if os.path.exists(filepath):
        print(f"  Skipping {word} (already exists)")
        return True

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
    headers = {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }
    data = {
        "text": word,
        "model_id": MODEL_ID,
        "voice_settings": {
            "stability": 0.75,
            "similarity_boost": 0.85,
            "style": 0.4,
        },
    }

    try:
        resp = requests.post(url, json=data, headers=headers, timeout=30)
        if resp.status_code == 200:
            with open(filepath, "wb") as f:
                f.write(resp.content)
            print(f"  ✓ {word} ({len(resp.content)} bytes)")
            return True
        else:
            print(f"  ✗ {word} — HTTP {resp.status_code}: {resp.text[:200]}")
            return False
    except Exception as e:
        print(f"  ✗ {word} — Error: {e}")
        return False

def main():
    if not API_KEY:
        print("ERROR: ELEVENLABS_API_KEY environment variable not set")
        exit(1)

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    total = len(WORDS)
    success = 0
    failed = 0

    print(f"Generating audio for {total} words...")
    print(f"Voice: George ({VOICE_ID})")
    print(f"Model: {MODEL_ID}")
    print(f"Output: {OUTPUT_DIR}/")
    print()

    for i, word in enumerate(WORDS):
        print(f"[{i+1}/{total}]", end="")
        if generate_audio(word):
            success += 1
        else:
            failed += 1
        time.sleep(0.3)

    print()
    print(f"Done! {success} succeeded, {failed} failed out of {total}")
    if failed > 0:
        exit(1)

if __name__ == "__main__":
    main()

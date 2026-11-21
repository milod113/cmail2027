<?php

/*
|--------------------------------------------------------------------------
| Dictée vocale (transcription locale avec whisper.cpp — aucun service externe)
|--------------------------------------------------------------------------
| Le téléphone envoie un enregistrement WAV ; le serveur le transcrit en file
| d'attente, une dictée à la fois, avec quelques cœurs et une priorité basse
| pour ne jamais ralentir Cmail.
*/

return [
    'enabled' => env('DICTATION_ENABLED', true),

    // Exécutable whisper.cpp et modèle (ggml-small.bin conseillé ; ggml-base.bin plus rapide)
    'whisper_path' => env('WHISPER_PATH', 'whisper-cli'),
    'model_path' => env('WHISPER_MODEL'),

    // Ressources : nombre de cœurs utilisés (laisser le reste au serveur web et à MySQL)
    'threads' => (int) env('WHISPER_THREADS', 3),

    // Priorité basse du processus de transcription (Windows : « inférieure à la normale »)
    'low_priority' => env('WHISPER_LOW_PRIORITY', true),

    // Durée maximale d'une dictée (secondes) et délai maximal de transcription
    'max_seconds' => (int) env('DICTATION_MAX_SECONDS', 120),
    'timeout' => (int) env('DICTATION_TIMEOUT', 300),

    // Langues proposées (codes Whisper) ; « auto » = détection automatique
    'languages' => ['fr', 'ar', 'auto'],

    // Contexte donné au modèle : style et noms propres fréquents (améliore l'orthographe)
    'prompt' => env('WHISPER_PROMPT', 'Message administratif interne du CHU de Tlemcen. Bonjour, cordialement.'),

    // Les textes transcrits sont effacés après ce délai (heures)
    'keep_hours' => (int) env('DICTATION_KEEP_HOURS', 24),
];

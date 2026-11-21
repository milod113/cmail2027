<?php

/*
|--------------------------------------------------------------------------
| OCR des documents joints (100 % local, aucun service externe)
|--------------------------------------------------------------------------
| Poppler (pdftoppm / pdftotext) convertit les PDF ; Tesseract reconnaît le texte.
| Chemins configurables pour Windows (XAMPP) comme pour Linux.
*/

return [
    // Activer / désactiver l'analyse automatique des pièces jointes
    'enabled' => env('OCR_ENABLED', true),

    // Exécutable Tesseract (Linux : « tesseract » s'il est dans le PATH)
    'tesseract_path' => env('TESSERACT_PATH', 'tesseract'),

    // Dossier des langues (*.traineddata). null = dossier par défaut de Tesseract
    'tessdata_path' => env('TESSDATA_PATH'),

    // Poppler : conversion PDF → images, et lecture du texte des PDF non scannés
    'pdftoppm_path' => env('PDFTOPPM_PATH', 'pdftoppm'),
    'pdftotext_path' => env('PDFTOTEXT_PATH', 'pdftotext'),

    // Langues reconnues (codes Tesseract)
    'languages' => array_filter(explode('+', (string) env('OCR_LANGUAGES', 'fra+ara'))),

    // Qualité / limites
    'dpi' => (int) env('OCR_DPI', 300),
    'max_pages' => (int) env('OCR_MAX_PAGES', 30),
    'timeout' => (int) env('OCR_TIMEOUT', 600), // secondes par document

    // Un PDF « numérique » (déjà du texte) n'a pas besoin d'OCR au-delà de ce nombre de caractères
    'text_layer_min_chars' => 80,
];

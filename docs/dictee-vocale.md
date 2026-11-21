# Dictée vocale (transcription locale)

Dans l'application mobile, le bouton **🎙️** (réponse à un message) ou **Dicter** (écriture d'un message) enregistre la voix ; le serveur de l'hôpital la transcrit avec **whisper.cpp** et le texte apparaît dans le message, **à relire avant l'envoi**. Aucun service Google ni Internet.

## Fonctionnement

1. Le téléphone enregistre en WAV 16 kHz mono (2 minutes au maximum) et l'envoie : `POST /api/mobile/dictations`.
2. Un travail `TranscribeDictationJob` est mis en file d'attente.
3. Le worker lance `whisper-cli` :
   - **une seule transcription à la fois** (verrou) — les suivantes attendent leur tour ;
   - **3 cœurs** (`WHISPER_THREADS`) et priorité Windows **« inférieure à la normale »** : le site et l'API restent prioritaires ;
4. L'audio est **supprimé** dès la fin (réussite ou échec) ; le texte est effacé après 24 h (`dictations:prune`, chaque heure).
5. L'application interroge `GET /api/mobile/dictations/{id}` et insère le texte.

Mesuré sur le serveur actuel (Core i7-13620H, modèle *small*, 3 cœurs) : **14,5 s de dictée → 7,5 s de transcription**.

## Installation (déjà faite sur le serveur actuel)

| Élément | Emplacement |
|---|---|
| whisper.cpp (Windows x64) | `C:\cmail-tools\whisper\bin\Release\whisper-cli.exe` |
| Modèle *small* (466 Mo) | `C:\cmail-tools\whisper\models\ggml-small.bin` |

Nouveau serveur Windows : télécharger `whisper-bin-x64.zip` (dépôt `ggml-org/whisper.cpp`, Releases) et `ggml-small.bin` (Hugging Face `ggerganov/whisper.cpp`).
Linux : compiler whisper.cpp (`cmake -B build && cmake --build build -j`) et utiliser `build/bin/whisper-cli`.

## `.env`

```
DICTATION_ENABLED=true
WHISPER_PATH="C:/cmail-tools/whisper/bin/Release/whisper-cli.exe"
WHISPER_MODEL="C:/cmail-tools/whisper/models/ggml-small.bin"
WHISPER_THREADS=3
DICTATION_MAX_SECONDS=120
# Optionnel : contexte (noms propres, style) pour améliorer l'orthographe
WHISPER_PROMPT="Message administratif interne du CHU de Tlemcen. Bonjour, cordialement."
```

Puis : `php artisan config:clear`, `php artisan migrate`, et **relancer la file d'attente** (`demarrer-cmail.bat`).

## Réglages possibles

| Besoin | Réglage |
|---|---|
| Plus rapide, un peu moins précis | modèle `ggml-base.bin` (142 Mo) |
| Plus précis, plus lent (~2×) | modèle `ggml-medium.bin` (1,5 Go) |
| Serveur très sollicité | `WHISPER_THREADS=2` |
| Noms souvent mal écrits | les ajouter dans `WHISPER_PROMPT` |

## Limites

- Arabe classique correct ; **dialecte** et mélange français / arabe moins fiables.
- Environnement bruyant : dicter près du téléphone.
- La dictée nécessite la connexion au serveur (pas de transcription hors-ligne).

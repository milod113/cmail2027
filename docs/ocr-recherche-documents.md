# Recherche dans les documents scannés (OCR local)

Cmail extrait automatiquement le texte (français + arabe) des PDF scannés et des images joints aux messages, puis permet de retrouver un message en cherchant un mot **contenu dans le document**. Tout se fait sur le serveur de l'établissement : aucun service en ligne.

| Type de pièce jointe | Méthode |
|---|---|
| PDF scanné, images (JPG, PNG, TIFF, BMP, WebP) | OCR Tesseract (français + arabe) |
| PDF numérique (créé par un logiciel) | texte lu directement (`pdftotext`) |
| Word `.docx`, Excel `.xlsx`, PowerPoint `.pptx` | texte lu directement (tableaux, feuilles, diapositives, en-têtes) |
| LibreOffice `.odt` `.ods` `.odp`, texte `.txt` `.csv`, `.rtf` | texte lu directement |
| Anciens formats `.doc` `.xls` `.ppt`, vidéos, archives | non analysés (réenregistrer en `.docx` / `.xlsx`) |

## Fonctionnement

1. Un message avec une pièce jointe PDF / image est envoyé (web, mobile, programmé, groupé…).
2. Un travail `ProcessDocumentOcrJob` est mis en **file d'attente** — l'envoi n'attend pas.
3. Le worker (`php artisan queue:work`) :
   - lit directement le texte d'un PDF « numérique » (`pdftotext`) ;
   - sinon convertit chaque page en image 300 DPI (`pdftoppm`) et la lit avec **Tesseract** (`fra+ara`) ;
   - enregistre le texte nettoyé dans la table `attachment_texts` et **supprime aussitôt les images temporaires**.
4. La recherche (Réception web, écran *Recherche* de l'application) interroge l'index `FULLTEXT` ; un mot de moins de 3 caractères est cherché avec `LIKE`.

Une ligne `attachment_texts` par **fichier** (`attachment_texts.path = messages.fichier`) : un document envoyé à 12 personnes n'est analysé qu'une fois. Chacun ne trouve que les messages dont il est **expéditeur ou destinataire**.

## Installation — Windows (XAMPP)

Déjà en place sur le serveur actuel :

| Composant | Emplacement |
|---|---|
| Tesseract 5.4 | `C:\Program Files\Tesseract-OCR\tesseract.exe` |
| Langues `fra`, `ara`, `eng` | `C:\cmail-tools\tessdata` |
| Poppler 26.09 (`pdftoppm`, `pdftotext`) | `C:\cmail-tools\poppler-26.09.0\Library\bin` |

Sur un nouveau serveur Windows :

1. Installer Tesseract (installateur UB Mannheim) — ou copier le dossier.
2. Copier `fra.traineddata` et `ara.traineddata` (dépôt `tesseract-ocr/tessdata`) dans un dossier `tessdata`.
3. Décompresser Poppler pour Windows (`oschwartz10612/poppler-windows`).
4. Paquet PHP (déjà dans `composer.json`) :
   ```
   composer require thiagoalessio/tesseract_ocr
   ```

## Installation — Linux (Debian / Ubuntu)

```
sudo apt install tesseract-ocr tesseract-ocr-fra tesseract-ocr-ara poppler-utils
composer require thiagoalessio/tesseract_ocr
```

## Configuration `.env`

Windows :
```
QUEUE_CONNECTION=database
OCR_ENABLED=true
TESSERACT_PATH="C:/Program Files/Tesseract-OCR/tesseract.exe"
TESSDATA_PATH="C:/cmail-tools/tessdata"
PDFTOPPM_PATH="C:/cmail-tools/poppler-26.09.0/Library/bin/pdftoppm.exe"
PDFTOTEXT_PATH="C:/cmail-tools/poppler-26.09.0/Library/bin/pdftotext.exe"
OCR_LANGUAGES=fra+ara
```

Linux :
```
QUEUE_CONNECTION=database
OCR_ENABLED=true
TESSERACT_PATH=tesseract
PDFTOPPM_PATH=pdftoppm
PDFTOTEXT_PATH=pdftotext
OCR_LANGUAGES=fra+ara
```

Options : `OCR_DPI` (300), `OCR_MAX_PAGES` (30 pages analysées par document), `OCR_TIMEOUT` (600 s).

Puis :
```
php artisan config:clear
php artisan migrate
php artisan ocr:status          # vérifie outils + langues
```

## Mise en service

```
php artisan ocr:backfill        # analyse les pièces jointes déjà envoyées
php artisan queue:work --tries=3 --sleep=3
```
(ou `demarrer-cmail.bat`, qui lance serveur + file d'attente + planificateur).

| Commande | Rôle |
|---|---|
| `php artisan ocr:status` | Outils, langues et nombre de documents analysés / en attente / en échec |
| `php artisan ocr:backfill` | Met en file les documents jamais analysés |
| `php artisan ocr:backfill --failed` | Relance aussi les documents en échec |

## Limites

- La qualité dépend du scan : un document flou, penché ou en basse résolution donne des erreurs (ex. « 20% » lu « 2096 »). Le scanner de l'application (filtre *Document*) améliore nettement le résultat.
- Écriture manuscrite : très mal reconnue par Tesseract.
- Un document vient d'être envoyé ? Il est cherchable après son analyse (quelques secondes par page, si le worker tourne).
- Les réponses faites depuis l'ancien système (table `reponses`) ne sont pas analysées.
- Les pièces jointes gardent désormais leur extension d'origine (avant, un `.docx` pouvait être enregistré en `.bin` par Windows).
- Le planificateur (`schedule:work`) traite aussi la file d'attente chaque minute : il suffit qu'il tourne.

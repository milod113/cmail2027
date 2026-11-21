@echo off
REM ============================================================
REM  Demarrage de Cmail sur le PC serveur (reseau de l'hopital)
REM  Ouvre 3 fenetres : laisser les 3 ouvertes pendant l'utilisation.
REM ============================================================
cd /d "%~dp0"

REM 1. Le serveur (site web + API de l'application mobile)
start "Cmail - serveur" cmd /k php artisan serve --host=0.0.0.0 --port=8000

REM 2. File d'attente : e-mails, analyse des documents, dictee vocale...
REM    Relancee automatiquement apres chaque mise a jour (php artisan queue:restart)
start "Cmail - e-mails et taches" cmd /k "for /l %%i in (0,0,1) do php artisan queue:work --tries=3 --sleep=3 --timeout=420"

REM 3. Planificateur : messages programmes, recurrents, rappels, escalade
REM    (traite aussi la file d'attente chaque minute si la fenetre 2 est fermee)
start "Cmail - planificateur" cmd /k php artisan schedule:work

echo Cmail demarre. Fermez les 3 fenetres pour l'arreter.
timeout /t 5 >nul

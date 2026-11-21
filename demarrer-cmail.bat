@echo off
REM ============================================================
REM  Demarrage de Cmail sur le PC serveur (reseau de l'hopital)
REM  Ouvre 3 fenetres : laisser les 3 ouvertes pendant l'utilisation.
REM ============================================================
cd /d "%~dp0"

REM 1. Le serveur (site web + API de l'application mobile)
start "Cmail - serveur" cmd /k php artisan serve --host=0.0.0.0 --port=8000

REM 2. File d'attente : e-mails de nouveaux messages, invitations...
start "Cmail - e-mails et taches" cmd /k php artisan queue:work --tries=3 --sleep=3

REM 3. Planificateur : messages programmes, recurrents, rappels, escalade
start "Cmail - planificateur" cmd /k php artisan schedule:work

echo Cmail demarre. Fermez les 3 fenetres pour l'arreter.
timeout /t 5 >nul

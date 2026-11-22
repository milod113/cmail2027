@echo off
REM ============================================================
REM  Demarrage de Cmail sur le PC serveur (reseau de l'hopital)
REM
REM  Le site web et l'API mobile sont servis par APACHE (XAMPP),
REM  sur le port 8000 : http://<adresse-du-PC>:8000
REM  Ce script verifie Apache puis ouvre 3 fenetres a laisser ouvertes.
REM ============================================================
cd /d "%~dp0"

REM 0. MySQL (XAMPP) : la base de donnees de Cmail
tasklist /FI "IMAGENAME eq mysqld.exe" | find /I "mysqld.exe" >nul
if errorlevel 1 (
    echo Demarrage de MySQL...
    start "MySQL" /MIN /D "C:\xampp" "C:\xampp\mysql\bin\mysqld.exe" --defaults-file=mysql\bin\my.ini --standalone
    timeout /t 5 >nul
) else (
    echo MySQL tourne deja.
)

REM 1. Apache (XAMPP) : demarre s'il ne tourne pas deja
tasklist /FI "IMAGENAME eq httpd.exe" | find /I "httpd.exe" >nul
if errorlevel 1 (
    echo Demarrage d'Apache...
    start "Apache" /MIN /D "C:\xampp\apache" "C:\xampp\apache\bin\httpd.exe"
    timeout /t 3 >nul
) else (
    echo Apache tourne deja.
)

REM 2. File d'attente : e-mails, analyse des documents, dictee vocale...
REM    Relancee automatiquement apres chaque mise a jour (php artisan queue:restart)
start "Cmail - e-mails et taches" cmd /k "for /l %%i in (0,0,1) do php artisan queue:work --tries=3 --sleep=3 --timeout=420"

REM 3. Planificateur : messages programmes, recurrents, rappels, escalade
REM    (traite aussi la file d'attente chaque minute si la fenetre 2 est fermee)
start "Cmail - planificateur" cmd /k php artisan schedule:work

REM 4. Temps reel (Reverb) : discussions instantanees du web et de l'application mobile.
REM    Ecoute sur toutes les interfaces (port 6001) pour que les telephones puissent s'y connecter.
start "Cmail - temps reel" cmd /k php artisan reverb:start --host=0.0.0.0 --port=6001

echo.
echo Cmail demarre : http://localhost:8000  (Apache)
echo.
echo Adresse a saisir dans l'application mobile (pastille "Serveur") :
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4"') do for /f "tokens=*" %%b in ("%%a") do echo    http://%%b:8000/api/mobile
echo.
echo Fermez les 3 fenetres "Cmail" pour arreter les taches de fond.
timeout /t 6 >nul

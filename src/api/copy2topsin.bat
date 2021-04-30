@echo off
xcopy %cd%\*.js F:\tophttpserver\script\ghp-spumes-app\ /S /E /Y
xcopy tophttpserver.* F:\tophttpserver\1.1.9\config\ /Y
pause

@echo off
@REM xcopy %cd%\*.js F:\tophttpserver\script\ghp-wms-app\ /S /E /Y
@REM xcopy tophttpserver.* F:\tophttpserver\1.1.9\config\ /Y

@REM xcopy %cd%\*.js F:\tophttp\script\ghp-wms-app\ /S /E /Y
@REM xcopy tophttp.* F:\tophttp\1.1.9\config\ /Y
xcopy %cd%\*.js F:\tophttp\script\ghp-wms-app\ /S /E /Y
xcopy tophttp.* F:\tophttp\1.1.9\config\ /Y
pause

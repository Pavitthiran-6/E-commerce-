@REM ====================================================================
@REM Maven Wrapper Runner Script for BELLEDONNE
@REM ====================================================================
@echo off
set "DIR=%~dp0"
if "%DIR:~-1%"=="\" set "DIR=%DIR:~0,-1%"
java "-Dmaven.multiModuleProjectDirectory=%DIR%" -cp "%DIR%\.mvn\wrapper\maven-wrapper.jar" org.apache.maven.wrapper.MavenWrapperMain %*

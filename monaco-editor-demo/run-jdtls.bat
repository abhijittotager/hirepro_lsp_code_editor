@echo off
SET JDTLS_HOME=%~dp0jdtls
SET WORKSPACE=%~dp0workspace

echo Starting Eclipse JDT Language Server...
echo JDTLS_HOME: %JDTLS_HOME%
echo WORKSPACE: %WORKSPACE%

java -Declipse.application=org.eclipse.jdt.ls.core.id1 ^
  -Dosgi.bundles.defaultStartLevel=4 ^
  -Declipse.product=org.eclipse.jdt.ls.core.product ^
  -Dlog.level=ALL ^
  -Xmx1G ^
  --add-modules=ALL-SYSTEM ^
  --add-opens java.base/java.util=ALL-UNNAMED ^
  --add-opens java.base/java.lang=ALL-UNNAMED ^
  -jar "%JDTLS_HOME%\plugins\org.eclipse.equinox.launcher_*.jar" ^
  -configuration "%JDTLS_HOME%\config_win" ^
  -data "%WORKSPACE%"

echo JDT.LS server stopped.

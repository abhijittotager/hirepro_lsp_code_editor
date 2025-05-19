@echo off
SET JDTLS_HOME=c:\Users\whooa\Music\java\monaco-editor-demo\jdtls
SET WORKSPACE=c:\Users\whooa\Music\java\monaco-editor-demo\workspace

java -Declipse.application=org.eclipse.jdt.ls.core.id1 ^
  -Dosgi.bundles.defaultStartLevel=4 ^
  -Declipse.product=org.eclipse.jdt.ls.core.product ^
  -Dlog.level=ALL ^
  -Xmx1G ^
  --add-modules=ALL-SYSTEM ^
  --add-opens java.base/java.util=ALL-UNNAMED ^
  --add-opens java.base/java.lang=ALL-UNNAMED ^
  -jar %JDTLS_HOME%\plugins\org.eclipse.equinox.launcher_*.jar ^
  -configuration %JDTLS_HOME%\config_win ^
  -data %WORKSPACE%
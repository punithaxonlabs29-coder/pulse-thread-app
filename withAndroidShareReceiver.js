const { withMainActivity } = require('@expo/config-plugins');

module.exports = function withAndroidShareReceiver(config) {
  return withMainActivity(config, (config) => {
    let contents = config.modResults.contents;

    if (!contents.includes('handleShareIntent')) {
      // 1. Add required imports after package declaration
      const imports = `import android.content.Intent\nimport android.net.Uri\n`;
      contents = contents.replace(/^(package\s+[^\r\n]+)/m, `$1\n${imports}`);

      // 2. Add handleShareIntent method
      const handleIntentMethod = `
  private fun handleShareIntent(intent: Intent?) {
    if (intent == null) return
    val action = intent.action
    val type = intent.type ?: return

    if (Intent.ACTION_SEND == action) {
      val uri = intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
      val text = intent.getStringExtra(Intent.EXTRA_TEXT)
      if (uri != null) {
        val fileJson = "[{\\"path\\":\\"\${uri}\\",\\"mimeType\\":\\"\${type}\\"}]"
        val encodedFiles = Uri.encode(fileJson)
        val encodedText = if (text != null) Uri.encode(text) else ""
        intent.data = Uri.parse("pulsethread://forward?sharedFiles=\${encodedFiles}&sharedText=\${encodedText}")
      } else if (!text.isNullOrEmpty()) {
        intent.data = Uri.parse("pulsethread://forward?sharedText=\${Uri.encode(text)}")
      }
    } else if (Intent.ACTION_SEND_MULTIPLE == action) {
      val uris = intent.getParcelableArrayListExtra<Uri>(Intent.EXTRA_STREAM)
      if (uris != null && uris.isNotEmpty()) {
        val filesJson = uris.joinToString(prefix = "[", postfix = "]") { u ->
          "{\\"path\\":\\"\${u}\\",\\"mimeType\\":\\"\${type}\\"}"
        }
        intent.data = Uri.parse("pulsethread://forward?sharedFiles=\${Uri.encode(filesJson)}")
      }
    }
  }
`;

      // 3. Inject handleShareIntent method into MainActivity class
      contents = contents.replace(
        'class MainActivity : ReactActivity() {',
        'class MainActivity : ReactActivity() {' + handleIntentMethod
      );

      // 4. Inject handleShareIntent(intent) call in onCreate
      if (contents.includes('super.onCreate(savedInstanceState)')) {
        contents = contents.replace(
          'super.onCreate(savedInstanceState)',
          'super.onCreate(savedInstanceState)\n    handleShareIntent(intent)'
        );
      }

      // 5. Inject handleShareIntent(intent) call in onNewIntent
      if (contents.includes('super.onNewIntent(intent)')) {
        contents = contents.replace(
          'super.onNewIntent(intent)',
          'super.onNewIntent(intent)\n    handleShareIntent(intent)'
        );
      }
    }

    config.modResults.contents = contents;
    return config;
  });
};

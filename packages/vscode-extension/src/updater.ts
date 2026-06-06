import * as vscode from "vscode";

const GITHUB_RAW_URL =
  "https://raw.githubusercontent.com/Ixotic27/The-Leetcode-City/main/packages/vscode-extension/package.json";

const RELEASE_DOWNLOAD_URL =
  "https://github.com/Ixotic27/The-Leetcode-City/tree/main/packages/vscode-extension";

/**
 * Compare two semver strings.  Returns  1 if a > b, -1 if a < b, 0 if equal.
 */
function compareSemver(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const va = pa[i] ?? 0;
    const vb = pb[i] ?? 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
}

/**
 * Runs once on activation – silently checks if a newer version exists on the
 * main branch and shows an update notification if so.
 *
 * The check is debounced: it will only run at most once every 6 hours by
 * persisting the last-check timestamp in globalState.
 */
export async function checkForUpdates(context: vscode.ExtensionContext) {
  const DEBOUNCE_MS = 6 * 60 * 60 * 1000; // 6 hours
  const lastCheck = context.globalState.get<number>("leetcodecity.lastUpdateCheck", 0);
  if (Date.now() - lastCheck < DEBOUNCE_MS) return;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await (globalThis as any).fetch(GITHUB_RAW_URL, {
      signal: controller.signal,
      headers: { "Cache-Control": "no-cache" },
    });
    clearTimeout(timeoutId);

    if (!res.ok) return;

    const remote = await res.json();
    const remoteVersion: string = remote.version;
    const ext = vscode.extensions.getExtension("leetcode-city.leetcode-city-pulse");
    if (!ext) return;

    const localVersion: string = ext.packageJSON.version;

    context.globalState.update("leetcodecity.lastUpdateCheck", Date.now());

    if (compareSemver(remoteVersion, localVersion) > 0) {
      const action = await vscode.window.showInformationMessage(
        `🏙️ LeetCode City: Pulse v${remoteVersion} is available! (you have v${localVersion})`,
        "Download Update",
        "Dismiss"
      );

      if (action === "Download Update") {
        vscode.env.openExternal(vscode.Uri.parse(RELEASE_DOWNLOAD_URL));
      }
    }
  } catch {
    // Network error or timeout – fail silently, don't bother the user.
  }
}

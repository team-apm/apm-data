// > yarn run check-links
//
// src/ 以下の YAML に書かれた配布 URL を実際に叩き、到達できなかったものを
// Markdown で報告する。データは書き換えない。
//
// 何のためか: check-update.ts が見ているのは「既知パッケージの新しいバージョン」
// だけで、配布元そのものが消えたことは誰も見ていない。実際、2 年かけて 1 割の
// パッケージが静かに導入不能になっていた。これはその腐敗を検知するためだけの
// スクリプトで、直すのは人間の仕事(配布元の移転先を確定する判断が要るため)。

import chalk from 'chalk';
import { existsSync, readdirSync, readFileSync } from 'fs-extra';
import yaml from 'js-yaml';

const { red, yellow, green, gray } = chalk;

const SRC_DIR = 'src/';
const CONCURRENCY = 8;
const TIMEOUT_MS = 25_000;
// 証明書チェーンが不完全なサイトで Node の fetch だけが失敗する理由。
// apm は Electron(Chromium)で動き、足りない中間証明書を自分で取りに行くため、
// これに当たるものは利用者からは到達できる。配布終了と混ぜてはいけない。
const TLS_CHAIN_ERRORS = [
  'unable to get local issuer certificate',
  'unable to verify the first certificate',
  'self-signed certificate',
  'self signed certificate',
];

// 一時的な不調と恒久的な消滅を区別するための待ち時間
const RETRY_DELAYS_MS = [3_000, 15_000];

// apm 本体は Electron のセッションでダウンロードするため、ブラウザとして扱われる。
// User-Agent を揃えないと、bot を弾くだけのホストを「配布終了」と誤検知する
// (実測で OneDrive が 403 になった)。利用者が実際に受け取る結果に合わせる。
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

type Target = {
  /** パッケージ ID、または本体・スクリプト一覧を指す擬似 ID */
  owner: string;
  /** downloadURLs の何番目か。pageURL などは undefined */
  index?: number;
  kind: 'download' | 'page';
  url: string;
};

type Result = Target & { status: number; error?: string; tls?: boolean };

/**
 * Collects every probeable distribution URL from the YAML sources.
 * @returns {Target[]} The URLs to probe.
 */
function collectTargets(): Target[] {
  const targets: Target[] = [];

  const packagesDir = `${SRC_DIR}packages/`;
  for (const developer of readdirSync(packagesDir, { withFileTypes: true })) {
    if (!developer.isDirectory()) continue;
    const developerPath = `${packagesDir}${developer.name}`;
    for (const pkg of readdirSync(developerPath, { withFileTypes: true })) {
      if (!pkg.isDirectory()) continue;
      const yamlPath = `${developerPath}/${pkg.name}/package.yaml`;
      if (!existsSync(yamlPath)) continue;
      const obj = yaml.load(readFileSync(yamlPath, 'utf-8')) as {
        id?: string;
        pageURL?: string;
        downloadURLs?: string[];
      };
      const owner = obj.id ?? `${developer.name}/${pkg.name}`;
      obj.downloadURLs?.forEach((url, index) => {
        if (isProbeable(url))
          targets.push({ owner, index, kind: 'download', url });
      });
      if (obj.pageURL && isProbeable(obj.pageURL))
        targets.push({ owner, kind: 'page', url: obj.pageURL });
    }
  }

  const webpagePath = `${SRC_DIR}scripts/webpage.yaml`;
  if (existsSync(webpagePath)) {
    const pages = yaml.load(readFileSync(webpagePath, 'utf-8')) as {
      url?: string;
      developer?: string;
    }[];
    for (const page of pages)
      if (page.url && isProbeable(page.url))
        targets.push({
          owner: `scripts:${page.developer ?? '?'}`,
          kind: 'page',
          url: page.url,
        });
  }

  for (const core of ['aviutl', 'exedit']) {
    const corePath = `${SRC_DIR}core/${core}.yaml`;
    if (!existsSync(corePath)) continue;
    const obj = yaml.load(readFileSync(corePath, 'utf-8')) as {
      releases?: { url?: string }[];
    };
    obj.releases?.forEach((release, index) => {
      if (release.url && isProbeable(release.url))
        targets.push({
          owner: `core:${core}`,
          index,
          kind: 'download',
          url: release.url,
        });
    });
  }

  return targets;
}

/**
 * Returns whether a URL can be requested as-is.
 * @param {string} url - The URL to test.
 * @returns {boolean} False for glob patterns and non-http schemes.
 */
function isProbeable(url: string): boolean {
  return /^https?:\/\//.test(url) && !url.includes('*');
}

/**
 * Requests a URL once and reports the resulting status.
 * @param {string} url - The URL to request.
 * @returns {Promise<{ status: number; error?: string }>} 0 on a network failure.
 */
async function requestOnce(
  url: string,
): Promise<{ status: number; error?: string }> {
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    // 本文は不要。読まずに捨てないと接続が開いたままになる
    await response.body?.cancel();
    return { status: response.status };
  } catch (e) {
    // fetch の失敗理由は cause 側にしか入らない
    const cause =
      e instanceof Error ? (e.cause as Error | undefined) : undefined;
    const message =
      cause?.message ?? (e instanceof Error ? e.message : String(e));
    return {
      status: 0,
      error: message,
      tls: TLS_CHAIN_ERRORS.some((t) => message.includes(t)),
    };
  }
}

/**
 * Probes a URL, retrying with a delay so a hiccup is not reported as rot.
 * @param {Target} target - The URL to probe.
 * @returns {Promise<Result>} The probe result.
 */
async function probe(target: Target): Promise<Result> {
  let last = await requestOnce(target.url);
  // ネットワーク断と 5xx は相手側の一時的な不調でも起きる。週次で issue を
  // 立てる以上、1 回の揺らぎを「配布終了」と報告してはいけない。
  //
  // 間を空けずに試し直しても意味が無い: 実測で purinka.work が一度だけ
  // fetch failed になり、連続した再試行も同じく失敗したが、数秒後には 200 に
  // 戻っていた。相手が立ち直る時間を与えるため、待ってから試し直す。
  for (const waitMs of RETRY_DELAYS_MS) {
    if (last.tls) break; // 証明書の問題は待っても変わらない
    if (last.status !== 0 && last.status < 500) break;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    last = await requestOnce(target.url);
  }
  return { ...target, ...last };
}

/**
 * Runs an async mapper over items with a fixed concurrency.
 * @param {T[]} items - The items to process.
 * @param {number} limit - Maximum number of in-flight operations.
 * @param {(item: T) => Promise<R>} fn - The mapper.
 * @returns {Promise<R[]>} The results, in input order.
 */
async function pool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      for (;;) {
        const i = next++;
        if (i >= items.length) return;
        results[i] = await fn(items[i]);
      }
    }),
  );
  return results;
}

/**
 * Renders the Markdown report to stdout.
 * @param {Result[]} results - Every probe result.
 */
function report(results: Result[]): void {
  const reachable = (r: Result) => r.status >= 200 && r.status < 400;
  // 証明書チェーンの問題は「配布が消えた」ではないので、失敗として数えない
  const tlsOnly = results.filter((r) => !reachable(r) && r.tls);
  const failed = results.filter((r) => !reachable(r) && !r.tls);

  // apm は downloadURLs[0] しか使わず、2 番目以降にフォールバックしない
  // (apm の src/main/services/packageInstall.ts)。先頭が死んでいるものだけが
  // 「導入できない」で、それ以外は掃除の対象。
  const blocking = failed.filter((r) => r.kind === 'download' && r.index === 0);
  const unusedMirror = failed.filter(
    (r) => r.kind === 'download' && r.index !== 0,
  );
  const pages = failed.filter((r) => r.kind === 'page');

  const out: string[] = [];
  out.push(
    `検査した URL: ${results.length} 件 / 到達できなかったもの: ${failed.length} 件`,
  );
  out.push('');
  if (failed.length === 0 && tlsOnly.length === 0) {
    out.push('すべての配布 URL に到達できました。');
    console.log(out.join('\n'));
    return;
  }

  const table = (rows: Result[]) => {
    out.push('| 対象 | HTTP | URL |');
    out.push('| --- | --- | --- |');
    for (const r of rows)
      out.push(
        `| \`${r.owner}\` | ${r.status === 0 ? `接続失敗(${r.error ?? ''})` : r.status} | ${r.url} |`,
      );
    out.push('');
  };

  if (blocking.length) {
    out.push(`## 導入できない — ${blocking.length} 件`);
    out.push('');
    out.push(
      'apm は `downloadURLs[0]` しか使わず、2 番目以降にフォールバックしません。' +
        'ここに並んでいるものは利用者がインストールできない状態です。',
    );
    out.push('');
    table(blocking);
  }
  if (unusedMirror.length) {
    out.push(`## 使われていないミラーが死んでいる — ${unusedMirror.length} 件`);
    out.push('');
    out.push(
      'apm は読まない位置なので実害はありませんが、配布場所を指していないエントリです。',
    );
    out.push('');
    table(unusedMirror);
  }
  if (pages.length) {
    out.push(`## 配布ページに飛べない — ${pages.length} 件`);
    out.push('');
    table(pages);
  }
  if (tlsOnly.length) {
    out.push(`## 参考: 証明書チェーンが不完全 — ${tlsOnly.length} 件`);
    out.push('');
    out.push(
      'このスクリプトの Node からは検証できませんでしたが、apm は Electron(Chromium)で ' +
        '動き、足りない中間証明書を自分で取りに行くため、利用者からは到達できるはずです。' +
        '配布が消えたわけではありません。',
    );
    out.push('');
    table(tlsOnly);
  }
  console.log(out.join('\n'));
}

/**
 * Entry point.
 */
async function main(): Promise<void> {
  const targets = collectTargets();
  console.error(gray(`${targets.length} 件の URL を検査します...`));
  const results = await pool(targets, CONCURRENCY, async (t) => {
    const r = await probe(t);
    const ok = r.status >= 200 && r.status < 400;
    console.error(
      `${ok ? green('ok  ') : r.status === 0 ? red('err ') : yellow(String(r.status))} ${r.owner} ${gray(r.url)}`,
    );
    return r;
  });
  report(results);
}

void main();

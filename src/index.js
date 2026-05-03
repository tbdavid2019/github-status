import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getConfig } from "./env.js";
import {
  collectLanguageBytes,
  filterRepositories,
  getAccount,
  getCurrentYearContributions,
  listOwnerRepositories,
} from "./github.js";
import { aggregateStats } from "./stats.js";
import { renderLanguagesCard, renderStatsCard, renderTopReposCard } from "./render/cards.js";
import { renderAnimatedStatusGif } from "./render/gif.js";

async function writeOutputFiles(outputDir, stats) {
  await mkdir(outputDir, { recursive: true });

  const files = {
    "stats.svg": renderStatsCard(stats),
    "languages.svg": renderLanguagesCard(stats),
    "top-repos.svg": renderTopReposCard(stats),
    "stats.json": `${JSON.stringify(stats, null, 2)}\n`,
    "status.gif": await renderAnimatedStatusGif(stats),
  };

  for (const [fileName, content] of Object.entries(files)) {
    await writeFile(join(outputDir, fileName), content);
  }
}

async function main() {
  const config = getConfig();

  console.log(`Generating static GitHub stats for repository owner: ${config.targetLogin}`);
  console.log(`Output directory: ${config.outputDir}`);
  console.log(`Policy: includeForks=${config.includeForks}, includeArchived=${config.includeArchived}`);

  const account = await getAccount(config.targetLogin, { token: config.token });
  const allOwnedRepos = await listOwnerRepositories(account, { token: config.token });
  const selectedRepos = filterRepositories(allOwnedRepos, {
    includeForks: config.includeForks,
    includeArchived: config.includeArchived,
  });

  const languageBytes = await collectLanguageBytes(selectedRepos, {
    token: config.token,
    maxRepos: config.maxLanguageRepos,
  });

  const contributions = await getCurrentYearContributions(account, {
    token: config.token,
    allowFailure: config.allowGraphqlFailure,
  });

  const stats = aggregateStats(account, allOwnedRepos, selectedRepos, languageBytes, contributions, config);
  await writeOutputFiles(config.outputDir, stats);

  console.log(`Wrote stats for ${stats.owner.login}.`);
  console.log(`Selected repositories: ${stats.repositoryPolicy.selectedRepoCount}`);
  console.log(`Total stars: ${stats.totals.stars}`);
  console.log(`Total forks: ${stats.totals.forks}`);
  if (stats.contributions) {
    console.log(`${stats.contributions.year} contributions: ${stats.contributions.totalContributions}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

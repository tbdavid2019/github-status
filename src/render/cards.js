import {
  escapeXml,
  formatBytesFromKB,
  formatDate,
  formatNumber,
  metricCell,
  progressBar,
  svgDocument,
  text,
  truncate,
} from "./svg.js";

function contributionValue(stats, key) {
  if (!stats.contributions) return "n/a";
  return formatNumber(stats.contributions[key]);
}

export function renderStatsCard(stats) {
  const width = 560;
  const height = 330;
  const ownerName = stats.owner.displayName || stats.owner.login;
  const title = `${ownerName}'s GitHub Stats`;
  const subtitle = `@${stats.owner.login} · updated ${formatDate(stats.generatedAt)}`;
  const latestPush = formatDate(stats.totals.latestPushAt);
  const contributionLabel = stats.contributions ? `Contributions ${stats.contributions.year}` : "Contributions";

  const children = `
    ${text(28, 38, title, "title")}
    ${text(28, 60, subtitle, "subtitle")}

    ${metricCell({ x: 28, y: 105, label: "Selected repos", value: formatNumber(stats.repositoryPolicy.selectedRepoCount) })}
    ${metricCell({ x: 190, y: 105, label: "Source repos", value: formatNumber(stats.repositoryPolicy.sourceRepoCount) })}
    ${metricCell({ x: 352, y: 105, label: "Forked repos", value: formatNumber(stats.repositoryPolicy.forkedRepoCount) })}

    ${metricCell({ x: 28, y: 170, label: "Stars", value: formatNumber(stats.totals.stars) })}
    ${metricCell({ x: 190, y: 170, label: "Forks", value: formatNumber(stats.totals.forks) })}
    ${metricCell({ x: 352, y: 170, label: "Open issues", value: formatNumber(stats.totals.openIssues) })}

    ${metricCell({ x: 28, y: 235, label: "Followers", value: formatNumber(stats.owner.followers) })}
    ${metricCell({ x: 190, y: 235, label: contributionLabel, value: contributionValue(stats, "totalContributions") })}
    ${metricCell({ x: 352, y: 235, label: "Latest push", value: latestPush })}

    ${text(28, 300, `Storage footprint: ${formatBytesFromKB(stats.totals.sizeKB)} · archived repos: ${formatNumber(stats.repositoryPolicy.archivedRepoCount)}`, "small")}
  `;

  return svgDocument({ width, height, children, label: title });
}

export function renderLanguagesCard(stats) {
  const width = 560;
  const rowHeight = 29;
  const height = 92 + Math.max(1, stats.languages.length) * rowHeight;
  const ownerName = stats.owner.displayName || stats.owner.login;
  const title = `${ownerName}'s Top Languages`;
  const subtitle = `Detailed language bytes from ${stats.repositoryPolicy.selectedRepoCount} selected repositories`;

  const rows = stats.languages.length
    ? stats.languages
        .map((language, index) => {
          const y = 93 + index * rowHeight;
          return `
            ${text(28, y, truncate(language.name, 22), "label")}
            ${progressBar({ x: 185, y: y - 10, width: 290, percent: language.percent })}
            ${text(490, y, `${language.percent.toFixed(1)}%`, "small")}
          `;
        })
        .join("\n")
    : text(28, 95, "No language data available", "label");

  const children = `
    ${text(28, 38, title, "title")}
    ${text(28, 60, subtitle, "subtitle")}
    ${rows}
  `;

  return svgDocument({ width, height, children, label: title });
}

export function renderTopReposCard(stats) {
  const width = 560;
  const rowHeight = 55;
  const height = 92 + Math.max(1, stats.topRepos.length) * rowHeight;
  const ownerName = stats.owner.displayName || stats.owner.login;
  const title = `${ownerName}'s Top Repositories`;
  const subtitle = "Ranked by stars, forks, watchers, and recent activity";

  const rows = stats.topRepos.length
    ? stats.topRepos
        .map((repo, index) => {
          const y = 100 + index * rowHeight;
          const badges = [
            repo.language ? repo.language : "Unknown",
            `★ ${formatNumber(repo.stars)}`,
            `⑂ ${formatNumber(repo.forks)}`,
            repo.archived ? "archived" : "active",
          ].join(" · ");
          return `
            ${text(28, y, truncate(repo.name, 36), "repo")}
            ${text(28, y + 21, truncate(repo.description || badges, 72), "desc")}
            ${text(28, y + 39, badges, "small")}
          `;
        })
        .join("\n")
    : text(28, 95, "No repositories available", "label");

  const children = `
    ${text(28, 38, title, "title")}
    ${text(28, 60, subtitle, "subtitle")}
    ${rows}
  `;

  return svgDocument({ width, height, children, label: title });
}

export function renderSummaryMarkdown(stats) {
  const lines = [
    `# Generated GitHub stats for ${stats.owner.login}`,
    "",
    `Generated at: ${stats.generatedAt}`,
    "",
    `- Selected repositories: ${stats.repositoryPolicy.selectedRepoCount}`,
    `- Source repositories: ${stats.repositoryPolicy.sourceRepoCount}`,
    `- Forked repositories: ${stats.repositoryPolicy.forkedRepoCount}`,
    `- Total stars: ${stats.totals.stars}`,
    `- Total forks: ${stats.totals.forks}`,
  ];

  if (stats.contributions) {
    lines.push(`- ${stats.contributions.year} contributions: ${stats.contributions.totalContributions}`);
  }

  lines.push("", "This file is generated by GitHub Actions.");
  return `${lines.map(escapeXml).join("\n")}\n`;
}

import fs from 'fs';
import path from 'path';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node/index.js';
import { Octokit } from '@octokit/rest';

const GITHUB_TOKEN = process.argv[2];
const REPO_NAME = process.argv[3] || 'foa-platform';

if (!GITHUB_TOKEN) {
  console.error('ERROR: Please provide your GitHub Personal Access Token as the first argument.');
  process.exit(1);
}

const dir = path.resolve('.');

async function main() {
  console.log('[1/4] Authenticating with GitHub API...');
  const octokit = new Octokit({ auth: GITHUB_TOKEN });
  const { data: user } = await octokit.users.getAuthenticated();
  console.log(`Authenticated as GitHub user: @${user.login}`);

  console.log(`[2/4] Creating repository "${REPO_NAME}" on @${user.login}...`);
  let repo;
  try {
    const res = await octokit.repos.createForAuthenticatedUser({
      name: REPO_NAME,
      description: 'Friends of Animals (FOA) — Full-Stack Social Impact Platform',
      private: false,
      auto_init: false
    });
    repo = res.data;
    console.log(`Repository created: ${repo.html_url}`);
  } catch (err) {
    if (err.status === 422) {
      console.log(`Repository "${REPO_NAME}" already exists on your account, using existing repo.`);
      const res = await octokit.repos.get({ owner: user.login, repo: REPO_NAME });
      repo = res.data;
    } else {
      throw err;
    }
  }

  console.log('[3/4] Staging and committing files...');
  await git.init({ fs, dir });

  const matrix = await git.statusMatrix({ fs, dir });
  for (const [filepath, , worktree] of matrix) {
    if (worktree === 1 || worktree === 2) {
      await git.add({ fs, dir, filepath });
    }
  }

  const sha = await git.commit({
    fs,
    dir,
    author: {
      name: user.name || user.login,
      email: user.email || `${user.login}@users.noreply.github.com`
    },
    message: 'Initial commit: Friends of Animals (FOA) full-stack web platform'
  });
  console.log(`Committed files (Commit SHA: ${sha.substring(0, 7)})`);

  console.log('[4/4] Pushing to GitHub (main branch)...');
  await git.push({
    fs,
    http,
    dir,
    remote: 'origin',
    ref: 'main',
    url: repo.clone_url,
    onAuth: () => ({ username: GITHUB_TOKEN, password: '' }),
    force: true
  });

  console.log(`\n🎉 SUCCESS! Project uploaded to GitHub:`);
  console.log(`👉 ${repo.html_url}`);
}

main().catch(err => {
  console.error('\nUpload error:', err);
  process.exit(1);
});

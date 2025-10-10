# Phase 21 — E2E Evidence CI Artifacts

**Date**: October 10, 2025  
**Branch**: `phase21/e2e-artifacts-ci`  
**Status**: ✅ Complete

## Overview

Added an **optional, non-blocking** GitHub Actions workflow that boots the E2E preview stack, runs Playwright evidence snapshots, and uploads the results as PR artifacts. This workflow does not affect merge status or block CI pipeline completion.

## What the Workflow Does

The `E2E Evidence (Playwright)` workflow performs the following steps:

1. **Boots E2E Stack**: Starts `docker-compose.e2e.yml` with full-stack services
2. **Installs Playwright**: Installs browsers inside the `stackmotive-e2e-frontend` container
3. **Runs Evidence Snapshot**: Executes `npm run e2e:snap` to capture UI screenshots
4. **Archives Evidence**: Creates `e2e-evidence.tar.gz` from `docs/qa/evidence/`
5. **Uploads Artifact**: Publishes artifact to PR for download

## Triggers

### Automatic (Pull Request)
The workflow runs automatically on PRs to `main`:
```yaml
on:
  pull_request:
    branches: [ "main" ]
```

### Manual (Workflow Dispatch)
Can be manually triggered from GitHub Actions UI:
1. Navigate to **Actions** → **E2E Evidence (Playwright)**
2. Click **Run workflow**
3. Select branch
4. Click **Run workflow** button

## Downloading Artifacts

### From Pull Request View

1. Open the PR on GitHub
2. Scroll to the **Checks** section at the bottom
3. Find **e2e-evidence** job in the check runs
4. Click **Details** → **Summary**
5. Scroll to **Artifacts** section
6. Click **e2e-evidence** to download `e2e-evidence.tar.gz`

### From Actions Tab

1. Navigate to **Actions** tab
2. Select the workflow run
3. Scroll to **Artifacts** section
4. Download **e2e-evidence** (tar.gz file)

### Extract Evidence

```bash
# Download e2e-evidence.tar.gz from GitHub
tar -xzf e2e-evidence.tar.gz
# Evidence files will be in docs/qa/evidence/
```

## Workflow Configuration

**File**: `.github/workflows/e2e-evidence.yml`

**Key Features:**
- **Optional**: `continue-on-error: true` prevents blocking merge
- **60-minute timeout**: Prevents hung workflows
- **30-day retention**: Artifacts kept for 1 month
- **Graceful failures**: Uses `|| true` for non-critical steps

**Non-Blocking Behavior:**
- If E2E stack fails to boot → workflow completes without error
- If Playwright fails → workflow continues and uploads partial results
- If no evidence files → warning only, no failure
- **Never blocks PR merge or CI status**

## Evidence Contents

The `docs/qa/evidence/` folder typically contains:
- **Screenshots**: PNG files from Playwright snapshots
- **Test Results**: JSON files with test execution data
- **Reports**: Markdown summaries of test runs
- **Metadata**: Timestamps, environment info

## Testing Locally

### Run E2E Stack

```bash
# Start stack
docker compose -f docker-compose.e2e.yml up -d --build

# Wait for services to be ready
sleep 30

# Install Playwright browsers
docker exec stackmotive-e2e-frontend npx playwright install --with-deps

# Run evidence snapshot
docker exec stackmotive-e2e-frontend npm run e2e:snap

# Check evidence
ls -la docs/qa/evidence/

# Stop stack
docker compose -f docker-compose.e2e.yml down
```

### Manual Workflow Trigger

1. Go to https://github.com/scarramanga/StackMotive-V12/actions
2. Select **E2E Evidence (Playwright)** workflow
3. Click **Run workflow**
4. Select your branch
5. Monitor execution and download artifact when complete

## Files Created

1. **`.github/workflows/e2e-evidence.yml`**
   - GitHub Actions workflow definition
   - 47 lines of YAML configuration

2. **`docs/audit/README_PHASE21.md`**
   - This documentation file

## Files Modified

**None** - This phase only adds files, no modifications to existing code.

## Non-Production Impact

✅ **Zero production changes**:
- No app logic modified
- No dependencies added or changed
- No environment variables required
- No database migrations
- No API endpoints affected

✅ **CI Independence**:
- Does not affect existing `ci.yml` workflow
- Runs in parallel, does not block other jobs
- Optional execution (can be disabled)

## Usage Notes

### When to Use

**Use this workflow when:**
- Validating UI changes visually
- Documenting E2E test coverage
- Creating evidence for QA review
- Archiving snapshot history

**Not needed for:**
- Standard PR reviews (optional)
- Quick bug fixes
- Backend-only changes
- CI validation (main ci.yml handles this)

### Artifact Retention

- **Retention**: 30 days
- **Size**: Typically 1-10 MB (screenshots + reports)
- **Auto-cleanup**: GitHub deletes after 30 days

### Troubleshooting

**If workflow fails:**
1. Check Docker Compose logs in workflow output
2. Verify `docker-compose.e2e.yml` is valid
3. Check `npm run e2e:snap` script exists in client/package.json
4. Ensure evidence directory has write permissions

**If artifact is empty:**
- Evidence snapshot may have failed silently
- Check workflow logs for Playwright errors
- Verify `docs/qa/evidence/` exists in repo

## Acceptance Criteria Met

- ✅ Workflow appears on PRs as "E2E Evidence (Playwright)"
- ✅ Produces artifact named `e2e-evidence` containing `docs/qa/evidence/**`
- ✅ No other workflows or application code changed
- ✅ CI stays fully green (workflow is optional)
- ✅ Can be manually triggered via workflow_dispatch

## Summary

Phase 21 successfully added an optional E2E evidence workflow that provides screenshot artifacts for visual validation without affecting the CI pipeline or merge requirements. The workflow is fully isolated, non-blocking, and designed for QA documentation purposes.

---

**Phase Status**: ✅ Complete  
**Workflow**: Optional and non-blocking  
**Impact**: Zero production changes  
**Next Phase**: Ready for Phase 22


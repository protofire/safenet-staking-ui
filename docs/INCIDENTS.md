# Incident log

Incidents affecting the deployed Safenet Staking UI. Each entry is updated as
the incident progresses, one commit per update, so that git history records
the timeline. Secrets are never recorded here.

The application is published to IPFS. A build is identified by its CID and
the timestamp at which that CID was published, not by the package version,
since a configuration change produces a new CID without a version change.

## INC-001: Rewards claim empty for all users

| Field    | Value                                            |
| -------- | ------------------------------------------------ |
| Status   | Resolved                                         |
| Severity | S2. Rewards claim unavailable. No funds at risk. |
| Detected | 2026-10-19                                       |
| Resolved | 2026-10-21                                       |
| Version  | 1.0.1 (both builds; code unchanged)              |

### Timeline

| Date       | Event                                                                        |
| ---------- | ---------------------------------------------------------------------------- |
| 2026-10-19 | Detected and reported via internal channels                                  |
| 2026-10-21 | Fixed build published: `bafybeidzcog3z3cnuwcccb6dyrqzkpulnuyrlxhphisjukxetzy3zlxumi` |

<details>
<summary>Details</summary>

### Symptom

Every connected wallet was shown as having no rewards to claim, including
addresses with a valid proof in the rewards dataset. No error was displayed.

### Cause

The affected build was configured with

    VITE_REWARDS_BASE_URL=https://raw.githubusercontent.com/safe-fndn/safenet-data/tree/main/assets/rewards

`raw.githubusercontent.com` accepts any branch, tag or commit as the ref
segment (`/main/`, `/refs/heads/main/`, a SHA), but it does not serve the
`tree/` form used by the github.com web interface. Every proof request
therefore returned 404.

`src/hooks/useRewardProof.ts` treats a 404 as "no proof exists for this
address" and returns `null`, which the UI renders as an empty claim list.
The misconfiguration was therefore indistinguishable from a user with no
rewards.

### Origin

The value was changed outside the repository. `.env` is gitignored and no
commit modifies environment values. The publish time of the affected CID is
the earliest point at which the bad value can have been live.

### Resolution

`VITE_REWARDS_BASE_URL` was corrected to

    https://raw.githubusercontent.com/safe-fndn/safenet-data/refs/heads/main/assets/rewards

and the application rebuilt and published to IPFS on 2026-10-21.

| Build    | IPFS CID                                                      |
| -------- | ------------------------------------------------------------- |
| Affected | `bafybeicynk54j6w2kwwcrrrkvvvc5fuh7652kbe5ztptn6vhao2ff6q2vi` |
| Fixed    | `bafybeidzcog3z3cnuwcccb6dyrqzkpulnuyrlxhphisjukxetzy3zlxumi` |

### Follow-up

Planned for release 1.2.

- Move `VITE_REWARDS_BASE_URL` from the GitHub raw host to the new rewards
  dataset location.
- Check that the rewards dataset is reachable on load, and show an error
  state instead of an empty claim list when it is not.
- Validate `VITE_REWARDS_BASE_URL` at build time.
- Update the proof fetch tests to match the new error state.

</details>

## INC-002: Validator list fails to load

| Field    | Value                                                                 |
| -------- | --------------------------------------------------------------------- |
| Status   | Resolved                                                              |
| Severity | S1. Validator list, staking and portfolio unavailable. No funds at risk. |
| Detected | 2026-10-21                                                            |
| Resolved | 2026-10-21                                                            |
| Version  | 1.0.2 and earlier (affected), 1.0.3 (fix)                             |

### Timeline

| Date       | Event                                                                                |
| ---------- | ------------------------------------------------------------------------------------ |
| 2026-10-21 | Detected: validators unavailable due to a `null` value from the data source; page shows "Failed to load validators: unexpected data format." |
| 2026-10-21 | Fix implemented in 1.0.3                                                             |
| 2026-10-21 | Fixed build published: `bafybeiavc2jpuqo5rby7e3ga4mh27ybcqrld2o4v3sgr7teqb7cz3qyhd4` |

<details>
<summary>Details</summary>

### Symptom

The validators page showed the error

    Failed to load validators: unexpected data format.

instead of the validator list. Staking requires selecting a validator, and
the portfolio positions table is built from the same list, so both were
unavailable as well. The rewards claim was unaffected.

### Cause

The validator feed at `VITE_VALIDATOR_INFO_URL`
(`safe-fndn/safenet-data`, `assets/validator-info.json`) started returning
`"participation_rate_14d": null` for every validator. Earlier revisions of
the file carried numeric values in the range 0 to 1.

`src/hooks/useValidators.ts` validated the payload with a schema that
required `participation_rate_14d` to be a number. A single `null` value
therefore failed validation of the whole payload, and the hook surfaced the
generic data format error for the entire list. The official Safe Foundation
UI treats the field as optional and renders a dash when it is missing.

### Origin

The change is in the upstream dataset, outside this repository. No build or
configuration of this application changed between the field being numeric
and being `null`.

### Resolution

Release 1.0.3 accepts `null` for `participation_rate_14d`. A validator whose
rate is missing is displayed with a dash in the participation column of the
validator table, the mobile validator list and the portfolio positions table.
All other fields are validated as before.

| Build    | IPFS CID |
| -------- | -------- |
| Affected | `bafybeidzcog3z3cnuwcccb6dyrqzkpulnuyrlxhphisjukxetzy3zlxumi` |
| Fixed    | `bafybeiavc2jpuqo5rby7e3ga4mh27ybcqrld2o4v3sgr7teqb7cz3qyhd4` |

### Follow-up

- Treat other per-validator metrics (commission) as optional as well, so a
  single missing value never takes down the whole list.

</details>

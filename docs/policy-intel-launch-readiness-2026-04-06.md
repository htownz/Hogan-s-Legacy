# Policy Intel Launch Readiness

Date: 2026-04-06

## Purpose

This document records the most important launch-facing gaps after the current flagship `Policy Market` pass.

It focuses on:

- committee-intel trust
- evidence quality
- future subscription and access requirements
- operational discipline for shipping safely

## Bottom Line

The product is already structurally closer to a launchable government-affairs platform than it may appear at first glance.

Why:

- most core tables are workspace-scoped
- client profiles already exist
- report templates already exist
- client actions already exist
- session and relationship infrastructure already exists
- deliverable generation already exists

The biggest blockers are not “we need a new architecture.”
They are:

- trust quality in committee intelligence
- stronger evidence presentation
- external-grade auth and tenancy
- disciplined release and environment practices

## Readiness Review

### 1. Committee-intel trust

Status: `highest product risk`

What is strong now:

- sessions are real objects
- transcript sync exists
- manual segments exist
- analysis exists
- focused briefs exist
- post-hearing recap exists
- hearing memo generation can use committee-intel context

What still threatens credibility:

- speaker identity resolution noise
- malformed or unmatched names
- committee names or other artifacts being treated like people
- not enough visible confidence marking for uncertain entities

What should happen before external launch:

- add explicit entity-quality states like `matched`, `low_confidence`, and `unresolved`
- improve committee roster and witness matching
- add stronger alias resolution for Texas legislators
- surface confidence and provenance inside committee views instead of hiding uncertainty

## 2. Evidence quality

Status: `high risk`

What is strong now:

- the deliverable pipeline already records source quality distinctions
- hearing memos can distinguish transcript-backed vs weaker source states
- digest, issue rooms, and committee intelligence already share source context

What still feels weak:

- generated outputs can still read as structured templates instead of premium analysis
- evidence hierarchy is not strong enough on flagship pages
- users cannot always drill cleanly from summary to source moment to exact evidence

What should happen before external launch:

- make evidence chains explicit in flagship and deliverable views
- expose transcript-backed status more prominently
- show exact source counts and provenance on all generated outputs
- add stronger citation blocks and “why this conclusion follows” structure

## 3. Subscription and tenancy foundations

Status: `partially prepared, not productized`

What already helps:

- `policy_intel_workspaces`
- workspace-scoped watchlists, alerts, issue rooms, stakeholders, sessions, predictions, relationships, client profiles, report templates, and client actions

What that means:

- the data model is already oriented toward firm-level tenancy
- this is a strong foundation for long-term firm subscriptions

What is still missing for a real external product:

- firm and user membership model
- workspace invitation and role system
- clear per-workspace access control
- user-facing onboarding and workspace provisioning
- subscription and billing integration
- quota and usage controls

## 4. Authentication and authorization

Status: `not ready for external subscriptions`

Current state:

- `server/policy-intel/auth.ts` supports a single bearer token gate via `POLICY_INTEL_API_TOKEN`
- if the token is unset, policy-intel routes are effectively open
- production requires the token, but this is still system-level access, not tenant-aware access

What this is good for:

- internal service protection
- private staging or ops access

What it is not sufficient for:

- firm subscriptions
- individual subscriptions
- per-user permissions
- auditable tenant isolation

Recommended next auth phase:

- add real user identity and session/JWT handling for policy-intel
- introduce workspace membership and roles
- enforce workspace-level authorization for reads and writes
- define admin, analyst, reviewer, and client-viewer role boundaries

## 5. Billing and plan model

Status: `not implemented`

No real subscription or billing layer appears to exist yet.

Before launch, decide:

- firm-first only
- firms plus limited individuals
- internal beta with manual provisioning

Practical recommendation:

- launch firm-first
- keep individual subscriptions out of the first commercial version unless there is a very clear use case

Why:

- the workflow, navigation, and deliverables are optimized for operators inside firms
- firm workspaces map naturally to the existing schema
- individual self-serve adds billing, onboarding, entitlement, and support complexity too early

## 6. Environment and operational readiness

Status: `needs discipline, not reinvention`

Strengths:

- devcontainer flow exists
- compose flows exist
- validation commands exist
- production-style compose exists
- rate limiting and security headers exist
- metrics and scheduler history exist

Weaknesses:

- git/push workflow is not documented in-repo
- repo docs do not fully explain how source-of-truth editing works in the container
- some runtime features may be environment-fragile, especially premium relationship data if the schema is incomplete in a given database

Recommended operating rules:

- continue local-first development for now
- do not rely on remote push success as the save signal
- verify database migrations before testing premium features
- keep one active baseline document and one active implementation brief per major push

## Suggested Launch Sequence

### Phase 1. Internal flagship hardening

- finish the Policy Market pass
- improve committee evidence visibility
- tighten empty states and failure tolerance

### Phase 2. Trust hardening

- fix entity resolution
- improve speaker matching
- add confidence markers and evidence drill-down

### Phase 3. Tenant and auth layer

- workspace membership
- user roles
- external authentication
- auditability

### Phase 4. Commercial packaging

- client profile workflows
- reporting templates
- subscriptions and billing
- support and onboarding materials

## Launch Recommendation

If the goal is a durable long-term product, the best commercialization order is:

1. polish the flagship market workflow
2. harden committee-intel credibility
3. add workspace-aware auth and roles
4. launch to firms first
5. decide later whether an individual tier is strategically worthwhile

That sequence fits the current architecture much better than trying to launch broad self-serve access immediately.

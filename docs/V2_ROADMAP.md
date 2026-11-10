# V2 roadmap — Mars: The New Frontier

Status: planning document, not an implementation claim or fixed delivery schedule.

Goal: evolve the current colony builder into a connected network of Martian settlements, where colonist wellbeing, infrastructure, and transport create meaningful decisions.

This document records the requested direction: a new health system, multiple colonies, and future updates. Detailed mechanics below are recommendations to review before implementation. Update this file as decisions are accepted, shipped, or deferred.

## Current baseline

The current update branch includes six building families, utility connections, worker assignments, aggregate health/morale, policies, storms, wear/repair, an eight-stage campaign, local saves, layout editing, foundation supports, and a save menu. These are the starting point for V2, not new roadmap features.

Release safeguard: future work must preserve existing colonies, provide an exportable backup, and explain migrations. Product version V2 is separate from the current save schema version 3; increase save versions only when the data format changes.

## Delivery order

| Order | Milestone | Player outcome | Depends on |
| --- | --- | --- | --- |
| 1 | Stability and simulation foundations | Trustworthy terrain clearance, previews, saves, and diagnostics | Current playable build |
| 2 | Health and life support | Understand why colonists become ill and how to treat and prevent it | Stable simulation and migration |
| 3 | Colony identity and regional map | Establish and switch between distinct settlements | Per-colony state and save migration |
| 4 | Logistics and trade | Transport resources and people between colonies | Multiple colonies and local inventories |
| 5 | Specialization and campaign expansion | Develop complementary settlements with long-term goals | Health, colonies, and logistics |
| 6 | V2 release hardening | Complete a reliable campaign across several settlements | All core milestones |

Build one playable milestone at a time. Do not add several disconnected systems before their shared loop is usable.

## 1. Stability and simulation foundations

- [ ] Validate terrain clearance across every model level on slopes, crater rims, and moved plots. Pillars should appear only under real gaps, terminate at the ground/deck, and avoid doors and utility ports.
- [ ] Review placement and utility previews for valid, blocked, unaffordable, and out-of-range actions; preview results must match committed actions.
- [ ] Keep menu/save controls accessible on desktop and mobile. Test reload, invalid imports, storage failure, export, and migration from older saves.
- [ ] Add a colony event log showing production interruptions, shortfalls, weather, repairs, and arrivals with actionable explanations.
- [ ] Establish render and simulation budgets using a repeatable benchmark colony. Choose target hardware and settlement sizes before making performance promises.
- [ ] Keep gameplay rules outside rendering components. Use a shared simulation clock and central validation for player actions.

Done when: a settlement can be built, rearranged, saved, restored, and advanced through storms without unexplained resource changes or buried model geometry.

## 2. New health and life-support system

Replace the single aggregate health score with a model that explains causes, treatment, and recovery. Start with small colonist cohorts grouped by residence and job; avoid simulating thousands of fully detailed individuals until profiling supports it.

### Causes and prevention

- [ ] Track nutrition, clean water, oxygen supply, shelter temperature, rest, and radiation protection as distinct service coverage measures.
- [ ] Add fatigue and workplace safety. Overwork, harsh conditions, and poorly maintained equipment increase risk; adequate staffing and rest reduce it.
- [ ] Separate physical health from morale. Recreation supports morale; it should not directly cure physical injuries.
- [ ] Use deterministic, seeded events for injuries and illness. Publish risk factors and warnings; avoid unexplained random penalties.
- [ ] Introduce oxygen production and life-support equipment through a guided objective, with a generous migration grace period for existing settlements.

### Treatment and facilities

- [ ] Add a clinic, then an upgrade path to a hospital. Beds, medical workers, medicine, power, clean water, and access determine treatment capacity.
- [ ] Model healthy → at risk → ill/injured → treatment → recovery states, with emergency triage for severe cases.
- [ ] Ill or recovering colonists reduce available workforce; provide reassignment tools and prevent negative or duplicate assignments.
- [ ] Add medical supplies through a simple production/import route before introducing complex pharmaceutical chains.
- [ ] Provide a Health panel with patients, available beds, untreated cases, supply coverage, trends, and the specific action needed to improve each problem.

Recommended initial mode: recoverable illness and injury. Keep permanent deaths as an explicit future survival-difficulty decision, with clear warnings and an option that preserves a forgiving mode. This changes the current no-permanent-death behavior and must be agreed before shipping.

Done when: a player can identify a health problem, restore its missing services, provide treatment, and observe recovery and workforce effects. Tests must cover shortages, treatment capacity, recovery, worker limits, and save/load during an emergency.

## 3. Multiple colonies and regional expansion

- [ ] Give each settlement a stable ID, name, founding site, local resources, buildings, utility graphs, population, policies, health services, and objectives.
- [ ] Introduce a regional map with surveyed landing sites, resource potential, environmental hazards, and travel distance.
- [ ] Let players found an outpost by paying an explicit equipment/resource cost and assigning a crew. Founding must transfer people and cargo rather than duplicate them.
- [ ] Provide a colony switcher, rename controls, and a summary of shortages or emergencies in other settlements.
- [ ] Keep inactive settlements advancing on the shared clock. Switching views must not pause shortages, reset storms, or produce resources twice.
- [ ] Migrate the existing settlement into the first colony without losing its identity, inventory, structures, or campaign progress.
- [ ] Separate local research facilities from any shared research unlocks; clearly label which benefits apply across the expedition.

Done when: at least two settlements maintain independent inventories and services, continue simulating while not viewed, and survive a save/reload without cross-colony leakage or duplication.

## 4. Logistics, transport, and trade

- [ ] Add cargo depots, rover routes, and explicit source/destination inventories.
- [ ] Plan routes with travel times, cargo capacities, loading requirements, energy/fuel costs, and storm-related delays.
- [ ] Support manual shipments first, then recurring deliveries with reserve thresholds and delivery priorities.
- [ ] Track cargo as in transit: deduct it once at departure and credit it once at arrival. Define cancellation, rerouting, and recovery rules before enabling them.
- [ ] Add passenger transport only after resource transfers are reliable. Travelling colonists cannot work or occupy beds in both colonies.
- [ ] Show route status, expected arrival, shortages, and cargo manifests on the regional map.
- [ ] Treat Earth resupply as a limited, priced safety net with travel time. Decide the economy and recovery rules before adding a market or contracts.

Done when: a mining outpost can supply metal to an agricultural settlement through a repeatable delivery, with correct accounting during delays, cancellation, and save/reload.

## 5. Specialization, progression, and world events

- [ ] Create complementary research paths for medicine, life support, transport, automation, agriculture, and radiation protection.
- [ ] Let site advantages encourage industrial, agricultural, scientific, and residential settlements without forcing a single winning layout.
- [ ] Expand the campaign from first settlement to a resilient regional network with medical coverage and dependable deliveries.
- [ ] Add readable environmental events such as cold snaps, radiation alerts, and equipment incidents after their countermeasures exist.
- [ ] Reward preparing for and resolving crises; keep critical failure warnings early enough for a practical response.
- [ ] Add optional contracts and longer-term achievements after the core multi-colony loop is balanced.

Done when: one settlement cannot efficiently do everything, and specialization creates useful transport and research decisions rather than obligatory busywork.

## V2 release gates

- [ ] Existing saves migrate with a preserved backup; interrupted or malformed imports cannot damage the current game.
- [ ] No resource, cargo, population, worker, or reward duplication through switching colonies, loading saves, or cancelling actions.
- [ ] Utilities and inventories remain local unless an explicit transfer connects them.
- [ ] Automated tests cover health transitions, treatment, regional ticking, logistics accounting, migrations, and campaign completion.
- [ ] Browser tests cover complete player flows, keyboard access, menus, previews, layout tools, and narrow screens.
- [ ] Benchmark representative colonies and a multi-settlement save on agreed hardware; document practical limits.
- [ ] Publish updated in-game guidance, a migration note, and a player-facing changelog.

## Decision log

| Topic | Recommended starting position | Status |
| --- | --- | --- |
| Next implementation | Stability review, then health/life support | Proposed |
| Colonist detail | Residence/job cohorts first; detailed individuals later if useful | Proposed |
| Mortality | Recoverable illness by default; lethal difficulty requires a separate decision | Unresolved |
| Colony map | Regional overview with separate local scenes and inventories | Proposed |
| Transport | Visible scheduled shipments before free-moving vehicle simulation | Proposed |
| Research ownership | Local production with clearly defined shared unlocks | Unresolved |
| Earth economy | Limited resupply safety net before a full trade market | Unresolved |
| Release timing | Scope/acceptance driven; no fixed dates yet | Unscheduled |

## Deferred beyond core V2

Multiplayer, combat, a fully simulated planetary economy, unrestricted terraforming, and detailed individual colonist life stories are not core V2 commitments. Revisit them only after the health–settlements–logistics loop is stable.

## Keeping this roadmap current

For each milestone, record accepted design decisions, link its implementation PR, check completed items only after validation, and note any changes to scope. Keep reported bugs in a separate issue list and link the fixes here when they unblock a milestone.

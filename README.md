# MARS: THE NEW FRONTIER

**A browser-based 3D Mars colony-building and management simulator.**

Build a settlement on procedurally generated Martian terrain, manage essential resources, upgrade infrastructure, and support a growing population. *MARS: THE NEW FRONTIER* combines free-camera city building with a resource economy and colony survival simulation.

> **Project status:** Version 1.0 release candidate — playable locally. Core systems are implemented; full end-to-end balance and gameplay testing is ongoing.

## Overview

Your mission is to establish and expand a sustainable settlement on Mars. Place buildings on a terrain grid, invest in power generation and resource extraction, and balance housing capacity against the colony's food, water, and electricity needs. Research technologies and upgrade infrastructure to improve production.

The project is currently **single-player and local-first**. It runs in a web browser and does not require a hosted backend or external database.

## Features

- **Interactive 3D Martian world:** Procedural terrain, rock formations, atmospheric effects, and an expandable settlement boundary.
- **Free strategy camera:** Pan, rotate, and zoom around the colony.
- **Grid-based construction:** Place buildings on valid plots with collision checks and translucent placement previews.
- **Six building types:** Habitats, solar arrays, water plants, greenhouses, mining facilities, and research centres.
- **Upgradeable infrastructure:** Building-specific upgrade limits and resource costs, including habitats with up to 15 levels.
- **Resource management:** Track metal, energy, water, food, and research points.
- **Per-sol simulation:** Generate resources, consume electricity, and supply colonists with food and water.
- **Population and wellbeing:** Housing, supplies, and power affect population support, health, growth, and citizen satisfaction.
- **Technology upgrades:** Unlock production bonuses for power, water, agriculture, mining, and research.
- **Net production dashboard:** Inspect projected changes to resources per Martian sol.
- **Local saves:** Colony progress is automatically stored in the browser.

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | React |
| Development/build tool | Vite |
| 3D rendering | Three.js and React Three Fiber |
| 3D utilities and controls | `@react-three/drei` |
| Persistence | Browser `localStorage` |

No Python backend, database, NASA API key, or paid hosting account is required to run this version.

## Requirements

- **Node.js** and **npm** installed on your computer (use a current Node.js LTS release compatible with the project's Vite version).
- A modern browser with WebGL support.
- Git, if you want to clone the repository.

Check your installation:

```bash
node --version
npm --version
```

## Installation and launch

### 1. Clone the repository

```bash
git clone https://github.com/devnathpathirana123-web/mars-the-new-frontier.git
cd mars-the-new-frontier
```

Alternatively, download the repository ZIP from GitHub and extract it.

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open the **Local** address shown in your terminal (often `http://localhost:5173/`). The exact port may differ if another application is using it.

To stop the server, press **Ctrl+C** in the terminal.

### 4. Create a production build

```bash
npm run build
```

Vite writes the production files to `dist/` by default. To preview that build locally:

```bash
npm run preview
```

> **Note:** Run these commands from the directory containing `package.json`. If your checkout places the Vite application inside a `frontend/` directory, first run `cd frontend` and execute the npm commands there.

## How to play

1. Launch the game and choose **Survival** or **Sandbox** mode.
2. Inspect your starting habitat and the available construction territory.
3. Select a building in the **Build** tab.
4. Move the cursor over the terrain to see its translucent placement preview. A valid plot is indicated in green; invalid plots are marked in red.
5. Click an available plot to construct the building.
6. Use the **Inspect** tab to view and upgrade selected buildings.
7. Use the **Research** tab to unlock production improvements.
8. Monitor your resources, net production, colony health, housing, and citizen satisfaction.
9. Advance the simulation manually or allow it to progress automatically.

### Camera controls

| Input | Action |
| --- | --- |
| Left mouse drag | Pan camera |
| Right mouse drag | Rotate camera |
| Mouse wheel / scroll | Zoom |
| `W`, `A`, `S`, `D` | Move camera |
| `Q` / `E` | Rotate camera |
| `R` | Reset camera |

## Game modes

### Survival

Construction and upgrades consume resources. Each Martian sol, the simulation attempts to operate the colony's infrastructure, generate resources, and meet colonists' needs. Resource shortages can disrupt operations and reduce colony health.

### Sandbox

Build and upgrade without construction resource costs. By default, sandbox advances the sol counter **without running survival consumption and production**. Use the **Survival Systems** toggle to enable the full resource and population simulation while remaining in sandbox mode.

## Buildings and their roles

| Building | Primary function | Maximum level |
| --- | --- | ---: |
| Habitat | Provides housing capacity | 15 |
| Solar Array | Generates electricity | 10 |
| Water Plant | Produces water using electricity | 15 |
| Greenhouse | Produces food using electricity and water | 10 |
| Mining Facility | Produces metal using electricity | 15 |
| Research Centre | Generates research points using electricity | 15 |

Upgrades increase output or capacity according to each building's progression rules. They may also increase energy demand and require metal and research points.

## How the colony simulation works

A **sol** is one simulation step. In the current implementation, automatic progression occurs approximately every **five seconds** while the simulation is running. You can also use **Advance One Sol**.

During a simulated sol, the game processes:

1. **Solar generation:** Solar arrays add energy, subject to storage limits.
2. **Powered housing:** Habitats draw energy and contribute powered housing capacity when sufficient energy is available.
3. **Water extraction:** Water plants use electricity to produce water.
4. **Food production:** Greenhouses use electricity and water to produce food.
5. **Mining and research:** Facilities use electricity to generate metal or research points.
6. **Colonist consumption:** Each colonist requires food and water.
7. **Population and health:** Adequate supplies and powered housing support health and eventual population growth; shortages harm colony health.

The processing order matters: buildings may not operate if earlier systems have already used the available energy. Stored resources also have capacity limits.

### Understanding the dashboards

- **Resource totals** show how much metal, energy, water, food, and research is currently stored.
- **Net production** estimates the change in each resource over the next simulated sol based on the current colony state. It is a projection, not a guarantee of long-term production.
- **Citizen satisfaction** currently reflects housing, food and water security, and energy reliability. Healthcare and recreation are placeholders for future systems.
- **Colony status** reports population, housing capacity, health, current sol, and territory size.

## Technology research

The initial research system includes five upgrades:

- **Solar Efficiency:** Increases solar power output.
- **Water Recycling:** Improves water extraction.
- **Advanced Agriculture:** Improves greenhouse output.
- **Automated Mining:** Improves metal production.
- **Research Optimization:** Improves research point production.

Research is purchased with accumulated research points in Survival mode.

## Project structure

The main application is organized around a game controller and reusable 3D building models:

```text
mars-the-new-frontier/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── components/
│       ├── MarsWorld.jsx
│       └── buildings/
│           ├── HabitatModel.jsx
│           ├── SolarModel.jsx
│           ├── WaterModel.jsx
│           ├── GreenhouseModel.jsx
│           ├── MineModel.jsx
│           └── ResearchModel.jsx
├── package.json
└── README.md
```

`MarsWorld.jsx` contains the colony state, simulation rules, construction and upgrade logic, camera/world integration, and interface panels. The `buildings/` components define the procedural 3D architecture.

## Saving and resetting

The game automatically saves its current state to your browser's `localStorage`. Returning to the game in the same browser and origin should restore your progress.

- Saves are **local to that browser and website address**; they do not automatically sync between devices.
- Clearing browser site data may remove your saved colony.
- **Reset Colony** starts a new colony in the current mode and discards existing progress after confirmation.
- Save compatibility is not guaranteed across future major changes to the save format.

## Troubleshooting

**`npm` or `node` is not recognized**  
Install Node.js and reopen your terminal.

**`package.json` cannot be found**  
Run npm commands from the Vite application directory, not a parent folder.

**The page is blank or a component import fails**  
Check the terminal and browser console for the exact error. Confirm that filenames in `src/components/buildings/` match the imports in `MarsWorld.jsx`, including capitalization and `.jsx` extensions.

**The development port is already in use**  
Use the alternative Local URL that Vite prints, or stop the other process using the port.

**A building cannot be placed**  
Check that the preview indicates a valid plot, the plot is within unlocked territory, no building occupies it, and the colony can afford construction in Survival mode.

**Resources do not change in Sandbox mode**  
Enable **Survival Systems** if you want normal production and consumption to run.

**A colony save does not appear**  
Check that you are using the same browser and origin. Browser storage may have been cleared or the save format may have changed.

## Current limitations

Version 1 is an early playable simulation, not a scientifically validated Mars mission model.

- Terrain is **procedurally generated**, not reconstructed from NASA elevation datasets.
- Resource output and population behavior are gameplay approximations.
- Electricity is treated as a shared stored resource; there is no physical power-grid or cable network simulation.
- Mining does not currently model individual ore deposits or depletion.
- Healthcare and recreation are not yet implemented in the satisfaction calculation.
- There is no multiplayer, cloud save, or dedicated backend.
- The economy and balance still need extended playtesting.

## Future development ideas

Potential directions include richer terrain, roads and transport, ore deposits, power-grid constraints, specialized colonist jobs, medical and recreation facilities, additional technologies, more sophisticated population dynamics, and performance improvements.

These are **planned possibilities**, not features included in the current version.

## Contributing

Issues and constructive suggestions are welcome. If you propose a change, describe the problem, how to reproduce it, and the expected behavior. For code contributions, keep changes focused and verify that `npm run build` succeeds.

## License

Check the repository for a `LICENSE` file and its terms before reusing or redistributing the code. If no license is present, permission to reuse the source is **not automatically granted**.

---

**MARS: THE NEW FRONTIER** — Build a colony. Balance its resources. Make the next sol possible.

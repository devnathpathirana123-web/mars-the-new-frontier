# Building a connected Martian colony

Start a survival colony to play the campaign, or use sandbox to plan a settlement. New colonies start paused so you can inspect the objectives and prepare before resources are consumed. Use **Advance one sol** to step through the simulation, or **Resume simulation** to let it run.

## Your first working settlement

1. Open **Build** and place a solar array near the starting habitat. A construction preview shows whether the plot is clear; **Escape** cancels construction.
2. Open **Operations → Utilities**. Choose **Power**, select the solar array and habitat in the endpoint lists, and connect them. You can also enable the surface connection tool and choose the two buildings on the map.
3. Return to **Mission** and claim the completed objective's reward. Objectives guide the next stages of the colony and each reward can be claimed once.
4. Build a water plant and greenhouse. Connect their power, then run water pipes from the plant to the greenhouse and habitat. Read each facility's status if production is blocked.
5. Use pressurized **Corridor** connections to connect work sites to a habitat. Under **Crew**, assign available colonists to improve facility output.

Links have a maximum span and a metal cost. A route cannot pass through a third building: connect through that building with two links instead. Removing a link can interrupt everything that relied on it.

## Surviving Mars

**Mission** shows the weather forecast and colony alerts. Dust storms reduce solar generation and increase equipment wear. Build resource reserves and enable **Storm preparation** under **Maintenance** before bad weather arrives. Preparation has a per-sol upkeep cost, so check the displayed policy cost and resource balances.

Facilities lose condition as they work. **Maintenance** lists their condition and repair price; repair damaged equipment before it fails. Ore and ice yield vary with location, so check site information when placing mines and water plants.

Food, water, powered housing, health, and morale determine whether the settlement is supporting its colonists. **Crew** contains healthcare and recreation policies with explicit upkeep costs. Assignments cannot exceed the available population, and corridors are required for colonists to reach a workplace. Reduced automation allows facilities to start before every job is staffed.

The campaign progresses from first power to water, food, staffing, storm preparation, and sustained self-sufficiency. Watch the actual next-sol resource balances instead of only the nominal output of a building.

## Saving and review

The game autosaves after actions. Existing saves are migrated to the new simulation format. Use **Export colony backup** to keep an additional copy before major experiments. Sandbox survival systems can be toggled independently of the building tools.

The model review page remains available during local development at `/tests/model-review.html`.

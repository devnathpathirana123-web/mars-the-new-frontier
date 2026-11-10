import { useMemo, useState } from "react";
import {
  CATALOG,
  campaignObjectives,
  energyCost,
  getColonyReport,
  output,
  repairCost,
  upgradeCost,
} from "../game/colony";
import { validateLink } from "../game/networks";
import "./ColonyOperations.css";

const KINDS = [
  { id: "power", label: "Power", noun: "cable", className: "power" },
  { id: "water", label: "Water", noun: "pipe", className: "water" },
  {
    id: "corridor",
    label: "Corridor",
    noun: "corridor",
    className: "corridor",
  },
];
const POLICY_NAMES = {
  healthcare: "Healthcare",
  recreation: "Recreation",
  stormPrep: "Storm preparation",
};
const RESOURCE_NAMES = {
  metal: "metal",
  energy: "energy",
  food: "food",
  water: "water",
  research: "research",
};

function number(value, digits = 1) {
  return Number.isFinite(Number(value))
    ? Number(Number(value).toFixed(digits))
    : 0;
}
function name(building) {
  return `${CATALOG[building.type]?.name || building.type} #${building.id}`;
}
function costLabel(cost) {
  return (
    Object.entries(cost || {})
      .filter(([, amount]) => amount > 0)
      .map(([key, amount]) => `${number(amount)} ${RESOURCE_NAMES[key] || key}`)
      .join(" · ") || "No resource cost"
  );
}
function hasResources(game, cost) {
  return (
    game.mode === "sandbox" ||
    Object.entries(cost || {}).every(
      ([key, amount]) => (game.resources[key] || 0) >= amount,
    )
  );
}
function Meter({ label, value, suffix = "%", tone }) {
  const safe = Math.min(100, Math.max(0, Number(value) || 0));
  return (
    <div className={`co-meter ${tone || (safe < 35 ? "co-danger" : "")}`}>
      <div className="co-spread">
        <span>{label}</span>
        <strong>
          {number(safe, 0)}
          {suffix}
        </strong>
      </div>
      <progress aria-label={label} value={safe} max="100" />
    </div>
  );
}

function Policy({ policyKey, report, dispatch }) {
  const policy = report.policies?.[policyKey];
  if (!policy) return null;
  return (
    <div className="co-policy">
      <label className="co-spread co-policy-label">
        <span>{POLICY_NAMES[policyKey]}</span>
        <input
          type="checkbox"
          aria-label={POLICY_NAMES[policyKey]}
          checked={Boolean(policy.enabled)}
          onChange={(event) =>
            dispatch({
              type: "policy",
              key: policyKey,
              value: event.target.checked,
            })
          }
        />
      </label>
      <p>{policy.description}</p>
      <div className="co-caption">
        {costLabel(policy.cost || policy.upkeep)} / sol
      </div>
      {policy.enabled && (
        <div
          className={`co-caption ${policy.active ? "co-positive" : "co-warning"}`}
        >
          {policy.active ? "Supplied and active" : "Waiting for supplies"}
        </div>
      )}
    </div>
  );
}

function SelectedBuilding({ building, status, game, dispatch }) {
  if (!building || !status)
    return (
      <p className="co-hint">
        Select a building on the surface to inspect its connections, crew, and
        upgrade.
      </p>
    );
  const definition = CATALOG[building.type];
  const canUpgrade = building.level < definition.max;
  const price = canUpgrade ? upgradeCost(building) : {};
  const resource = {
    habitat: "residents",
    solar: "energy",
    extractor: "water",
    greenhouse: "food",
    mine: "metal",
    research: "research",
  }[building.type];
  return (
    <section className="co-card co-selected" aria-label="Selected building">
      <div className="co-eyebrow">Selected structure</div>
      <div className="co-spread">
        <h3>{name(building)}</h3>
        <span className="co-level">L{building.level}</span>
      </div>
      <p className={status.operating ? "co-positive" : "co-warning"}>
        {status.reason || (status.operating ? "Operational" : "Offline")}
      </p>
      <div className="co-tags">
        <span className={status.powered ? "co-tag on power" : "co-tag"}>
          Power {status.powered ? "connected" : "offline"}
        </span>
        <span className={status.waterConnected ? "co-tag on water" : "co-tag"}>
          Water {status.waterConnected ? "connected" : "offline"}
        </span>
        <span
          className={status.corridorConnected ? "co-tag on corridor" : "co-tag"}
        >
          Corridor {status.corridorConnected ? "connected" : "offline"}
        </span>
      </div>
      <dl className="co-facts">
        <div>
          <dt>Condition</dt>
          <dd>{number(status.condition, 0)}%</dd>
        </div>
        <div>
          <dt>Crew</dt>
          <dd>
            {status.workers} / {status.maxWorkers}
          </dd>
        </div>
        <div>
          <dt>Output efficiency</dt>
          <dd>{number(status.efficiency * 100, 0)}%</dd>
        </div>
        <div>
          <dt>Energy demand</dt>
          <dd>{number(status.energyDemand)} / sol</dd>
        </div>
      </dl>
      {canUpgrade ? (
        <>
          <div className="co-upgrade">
            <span>Next level base {resource}</span>
            <strong>
              {number(output(building, game.technologies))} →{" "}
              {number(
                output(
                  { ...building, level: building.level + 1 },
                  game.technologies,
                ),
              )}
            </strong>
          </div>
          <div className="co-caption">
            Energy demand: {energyCost(building)} →{" "}
            {energyCost({ ...building, level: building.level + 1 })} / sol
          </div>
          <button
            className="co-button"
            type="button"
            disabled={!hasResources(game, price)}
            aria-label={`Upgrade ${name(building)}`}
            onClick={() => dispatch({ type: "upgrade", id: building.id })}
          >
            Upgrade · {costLabel(price)}
          </button>
        </>
      ) : (
        <p className="co-caption">Maximum architectural level reached.</p>
      )}
    </section>
  );
}

function Mission({ game, report, dispatch }) {
  const current = report.campaign?.current;
  const objectives = campaignObjectives(game);
  const complete = report.campaign?.finished;
  const target = Math.max(1, current?.target || 1);
  const progress = Math.max(0, current?.progress || 0);
  return (
    <>
      <section className="co-card co-mission" aria-label="Campaign mission">
        <div className="co-eyebrow">
          {complete
            ? "Settlement established"
            : `Mission ${number(report.campaign?.index, 0) + 1} / ${objectives.length}`}
        </div>
        <h3>
          {complete
            ? "A permanent foothold"
            : current?.title || "Establish your colony"}
        </h3>
        <p>
          {complete
            ? "Your colony has completed its settlement programme. Keep expanding and protecting its infrastructure."
            : current?.description}
        </p>
        {current && !complete && (
          <>
            <div className="co-spread co-caption">
              <span>{current.goal || "Objective progress"}</span>
              <strong>
                {number(progress)} / {target}
              </strong>
            </div>
            <progress
              aria-label="Mission progress"
              value={Math.min(progress, target)}
              max={target}
            />
            <div className="co-reward">Reward: {costLabel(current.reward)}</div>
            <button
              className="co-button co-primary"
              type="button"
              disabled={!current.complete}
              onClick={() => dispatch({ type: "claim" })}
            >
              Claim reward
            </button>
          </>
        )}
        <details className="co-details">
          <summary>Settlement programme</summary>
          <ol>
            {objectives.map((objective) => (
              <li
                key={objective.id}
                className={objective.claimed ? "co-positive" : ""}
              >
                {objective.title}
                {objective.claimed ? " ✓" : ""}
              </li>
            ))}
          </ol>
        </details>
      </section>
      <section className="co-card" aria-label="Mars weather forecast">
        <div className="co-eyebrow">Surface forecast</div>
        <div className="co-spread">
          <h3>{report.weather?.label || "Clear skies"}</h3>
          <span className="co-level">Sol {game.sol}</span>
        </div>
        <p>{report.weather?.description}</p>
        <div className="co-caption">
          Solar yield: {number((report.weather?.solarFactor ?? 1) * 100, 0)}% of
          clear-sky output
        </div>
        <div className="co-forecast">
          {(report.forecast || []).map((day) => (
            <div key={day.sol} className={day.kind === "storm" ? "storm" : ""}>
              <span>Sol {day.sol}</span>
              <strong>{day.label}</strong>
            </div>
          ))}
        </div>
        <Policy policyKey="stormPrep" report={report} dispatch={dispatch} />
      </section>
      {(report.alerts || []).length > 0 && (
        <section className="co-card" aria-label="Colony alerts">
          <div className="co-eyebrow">Operations advisory</div>
          {report.alerts.map((alert) => (
            <div key={alert.id} className={`co-alert ${alert.severity}`}>
              <strong>{alert.title}</strong>
              <p>{alert.message}</p>
            </div>
          ))}
        </section>
      )}
      <div className="co-guide">
        <strong>Your first infrastructure loop</strong>
        <p>
          Build solar, connect power to a water plant, then supply a greenhouse
          with power and water. Connect your habitat by corridor to assign crew.
          Keep food, water, and housing ahead of population growth.
        </p>
      </div>
    </>
  );
}

function Utilities({
  game,
  report,
  dispatch,
  networkMode,
  onNetworkMode,
  onSelect,
}) {
  const [kind, setKind] = useState("power");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const proposed = { kind, from: Number(from), to: Number(to) };
  const validation = validateLink(game, proposed);
  const affordable = hasResources(game, validation.cost);
  return (
    <>
      <section className="co-card">
        <div className="co-eyebrow">Utility construction</div>
        <h3>Connect the colony</h3>
        <div className="co-kind-buttons" aria-label="Utility type">
          {KINDS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`co-kind ${item.className} ${kind === item.id ? "active" : ""}`}
              aria-pressed={kind === item.id}
              onClick={() => setKind(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p>
          {kind === "power"
            ? "Power cables connect facilities to solar generation and stored energy."
            : kind === "water"
              ? "Water pipes distribute water from a powered extraction plant."
              : "Pressurized corridors connect work sites to habitats so colonists can staff them."}
        </p>
        <button
          type="button"
          className={`co-button ${networkMode === kind ? "co-primary" : ""}`}
          onClick={() => onNetworkMode(networkMode === kind ? null : kind)}
        >
          {networkMode === kind
            ? "Cancel surface connection"
            : `Draw ${KINDS.find((item) => item.id === kind).noun} on surface`}
        </button>
        {networkMode && (
          <p className="co-hint">
            Select a start building, then a destination on the surface. Cancel
            the connection tool to return to inspection.
          </p>
        )}
        <div className="co-divider" />
        <label className="co-field">
          From building
          <select
            aria-label="From building"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
          >
            <option value="">Choose a start</option>
            {game.buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {name(building)}
              </option>
            ))}
          </select>
        </label>
        <label className="co-field">
          To building
          <select
            aria-label="To building"
            value={to}
            onChange={(event) => setTo(event.target.value)}
          >
            <option value="">Choose a destination</option>
            {game.buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {name(building)}
              </option>
            ))}
          </select>
        </label>
        {from && to && (
          <div className="co-link-quote" aria-live="polite">
            <strong>
              {number(validation.length)} units · {costLabel(validation.cost)}
            </strong>
            <p
              className={
                validation.valid && affordable ? "co-positive" : "co-warning"
              }
            >
              {!validation.valid
                ? validation.reason
                : !affordable
                  ? "Not enough resources for this connection."
                  : "Route clear. Ready to connect."}
            </p>
          </div>
        )}
        <button
          type="button"
          className="co-button co-primary"
          disabled={!validation.valid || !affordable || !from || !to}
          onClick={() => dispatch({ type: "connect", ...proposed })}
        >
          Connect utility
        </button>
        <p className="co-caption">
          Routes can span up to 24 units. If a structure blocks the route,
          connect through it using two links.
        </p>
      </section>
      <section className="co-card" aria-label="Building utility status">
        <div className="co-eyebrow">Network coverage</div>
        {game.buildings.map((building) => {
          const status = report.byBuilding?.[building.id] || {};
          return (
            <div
              key={building.id}
              className="co-building-row"
              data-testid={`building-status-${building.id}`}
            >
              <button
                type="button"
                className="co-text-button"
                onClick={() => onSelect(building.id)}
              >
                {name(building)}
              </button>
              <div className="co-tags">
                {KINDS.map((item) => (
                  <span
                    key={item.id}
                    className={`co-tag ${item.className} ${status[{ power: "powered", water: "waterConnected", corridor: "corridorConnected" }[item.id]] ? "on" : ""}`}
                  >
                    {item.label}{" "}
                    {status[
                      {
                        power: "powered",
                        water: "waterConnected",
                        corridor: "corridorConnected",
                      }[item.id]
                    ]
                      ? "✓"
                      : "—"}
                  </span>
                ))}
              </div>
              <p className={status.operating ? "co-positive" : "co-warning"}>
                {status.reason}
              </p>
            </div>
          );
        })}
      </section>
      <section className="co-card" aria-label="Constructed connections">
        <div className="co-eyebrow">
          Installed connections · {game.links?.length || 0}
        </div>
        {!game.links?.length && (
          <p>
            No connections yet. Build a cable from your solar array to another
            facility to start.
          </p>
        )}
        {(game.links || []).map((link) => {
          const start = game.buildings.find(
            (building) => building.id === link.from,
          );
          const end = game.buildings.find(
            (building) => building.id === link.to,
          );
          return (
            <div className="co-installed-link" key={link.id}>
              <div>
                <strong className={link.kind}>
                  {KINDS.find((item) => item.id === link.kind)?.label}
                </strong>
                <p>
                  {start ? name(start) : `#${link.from}`} →{" "}
                  {end ? name(end) : `#${link.to}`}
                </p>
              </div>
              <button
                type="button"
                className="co-icon-button"
                aria-label={`Remove ${link.kind} connection ${link.id}`}
                onClick={() => dispatch({ type: "disconnect", id: link.id })}
              >
                ×
              </button>
            </div>
          );
        })}
      </section>
    </>
  );
}

function Crew({ game, report, dispatch, onSelect }) {
  return (
    <>
      <section className="co-card">
        <div className="co-eyebrow">Colony wellbeing</div>
        <div className="co-stats">
          <div>
            <strong>{game.colony.population}</strong>
            <span>Residents</span>
          </div>
          <div>
            <strong>{report.availableWorkers}</strong>
            <span>Available crew</span>
          </div>
        </div>
        <Meter label="Morale" value={report.morale} />
        <Meter label="Health" value={report.health} />
        <div className="co-divider" />
        <Meter label="Food security" value={report.needs?.food} />
        <Meter label="Water security" value={report.needs?.water} />
        <Meter label="Housing coverage" value={report.needs?.housing} />
        <Meter label="Power reliability" value={report.needs?.power} />
        <div className="co-caption">
          Powered accommodation: {report.poweredHousing} residents
        </div>
        <Policy policyKey="healthcare" report={report} dispatch={dispatch} />
        <Policy policyKey="recreation" report={report} dispatch={dispatch} />
      </section>
      <section className="co-card">
        <div className="co-eyebrow">Work assignments</div>
        <p>
          Connected corridors let colonists reach their jobs. A skeleton
          automation system keeps essential equipment running at reduced output.
        </p>
        {game.buildings
          .filter(
            (building) =>
              (report.byBuilding?.[building.id]?.maxWorkers || 0) > 0,
          )
          .map((building) => {
            const status = report.byBuilding[building.id];
            return (
              <div className="co-building-row" key={building.id}>
                <button
                  type="button"
                  className="co-text-button"
                  onClick={() => onSelect(building.id)}
                >
                  {name(building)}
                </button>
                <div className="co-spread">
                  <span className="co-caption">
                    {status.workers} / {status.maxWorkers} assigned
                  </span>
                  <div className="co-stepper">
                    <button
                      type="button"
                      className="co-icon-button"
                      aria-label={`Unassign worker from ${name(building)}`}
                      disabled={status.workers <= 0}
                      onClick={() =>
                        dispatch({
                          type: "assign",
                          id: building.id,
                          workers: status.workers - 1,
                        })
                      }
                    >
                      −
                    </button>
                    <button
                      type="button"
                      className="co-icon-button"
                      aria-label={`Assign worker to ${name(building)}`}
                      disabled={
                        report.availableWorkers <= 0 ||
                        status.workers >= status.maxWorkers ||
                        !status.corridorConnected
                      }
                      onClick={() =>
                        dispatch({
                          type: "assign",
                          id: building.id,
                          workers: status.workers + 1,
                        })
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
                {!status.corridorConnected && (
                  <p className="co-warning">
                    Connect a corridor to a habitat before assigning crew.
                  </p>
                )}
                <div className="co-caption">
                  Output efficiency: {number(status.efficiency * 100, 0)}%
                </div>
              </div>
            );
          })}
      </section>
    </>
  );
}

function Maintenance({ game, report, dispatch, onSelect }) {
  return (
    <>
      <section className="co-card">
        <div className="co-eyebrow">Preventive maintenance</div>
        <h3>Keep the colony running</h3>
        <p>
          Working equipment wears each sol. Dust storms accelerate wear and
          reduce solar generation. Repair facilities before their condition
          becomes critical.
        </p>
        <Policy policyKey="stormPrep" report={report} dispatch={dispatch} />
      </section>
      {game.buildings.map((building) => {
        const status = report.byBuilding?.[building.id];
        if (!status) return null;
        const price = status.repairCost || repairCost(building);
        return (
          <section className="co-card" key={building.id}>
            <button
              type="button"
              className="co-text-button"
              onClick={() => onSelect(building.id)}
            >
              {name(building)}
            </button>
            <Meter
              label={`${name(building)} condition`}
              value={status.condition}
            />
            <p className={status.operating ? "co-positive" : "co-warning"}>
              {status.reason}
            </p>
            {["mine", "extractor"].includes(building.type) && (
              <div className="co-caption">
                Site yield:{" "}
                {number(
                  (building.type === "mine"
                    ? status.site?.ore
                    : status.site?.ice) * 100,
                  0,
                )}
                % · Roughness {number(status.site?.roughness * 100, 0)}%
              </div>
            )}
            <button
              type="button"
              className="co-button"
              aria-label={`Repair ${name(building)}`}
              disabled={status.condition >= 100 || !hasResources(game, price)}
              onClick={() => dispatch({ type: "repair", id: building.id })}
            >
              {status.condition >= 100
                ? "Condition optimal"
                : `Repair · ${costLabel(price)}`}
            </button>
          </section>
        );
      })}
    </>
  );
}

export default function ColonyOperations({
  game,
  dispatch,
  selectedId,
  onSelect,
  networkMode,
  onNetworkMode,
}) {
  const [tab, setTab] = useState("mission");
  const report = useMemo(() => getColonyReport(game), [game]);
  const selected = game.buildings.find(
    (building) => building.id === selectedId,
  );
  return (
    <div className="colony-operations">
      <div className="co-eyebrow">Settlement operations</div>
      <nav className="co-tabs" role="tablist" aria-label="Operations sections">
        {["mission", "utilities", "crew", "maintenance"].map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`co-tab-${id}`}
            aria-controls="co-operation-panel"
            aria-selected={tab === id}
            tabIndex={tab === id ? 0 : -1}
            onKeyDown={(event) => {
              const ids = ["mission", "utilities", "crew", "maintenance"];
              const index = ids.indexOf(id);
              const next =
                event.key === "ArrowRight"
                  ? ids[(index + 1) % ids.length]
                  : event.key === "ArrowLeft"
                    ? ids[(index + ids.length - 1) % ids.length]
                    : event.key === "Home"
                      ? ids[0]
                      : event.key === "End"
                        ? ids[ids.length - 1]
                        : null;
              if (!next) return;
              event.preventDefault();
              event.currentTarget.parentElement
                .querySelector(`#co-tab-${next}`)
                ?.focus();
              setTab(next);
            }}
            className={tab === id ? "active" : ""}
            onClick={() => setTab(id)}
          >
            {id[0].toUpperCase() + id.slice(1)}
          </button>
        ))}
      </nav>
      <div
        role="tabpanel"
        id="co-operation-panel"
        aria-labelledby={`co-tab-${tab}`}
      >
        {tab === "mission" && (
          <Mission game={game} report={report} dispatch={dispatch} />
        )}
        {tab === "utilities" && (
          <Utilities
            game={game}
            report={report}
            dispatch={dispatch}
            networkMode={networkMode}
            onNetworkMode={onNetworkMode}
            onSelect={onSelect}
          />
        )}
        {tab === "crew" && (
          <Crew
            game={game}
            report={report}
            dispatch={dispatch}
            onSelect={onSelect}
          />
        )}
        {tab === "maintenance" && (
          <Maintenance
            game={game}
            report={report}
            dispatch={dispatch}
            onSelect={onSelect}
          />
        )}
      </div>
      <SelectedBuilding
        building={selected}
        status={report.byBuilding?.[selectedId]}
        game={game}
        dispatch={dispatch}
      />
    </div>
  );
}

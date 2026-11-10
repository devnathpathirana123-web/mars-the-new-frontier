import { useRef, useState } from "react";
export default function GameMenu({
  game,
  saveError,
  onRestore,
  onNotify,
  onTitle,
}) {
  const dialog = useRef(null),
    input = useRef(null);
  const [supports, setSupports] = useState(true);
  const save = () => {
    try {
      localStorage.setItem("mars-new-frontier-save-v2", JSON.stringify(game));
      onNotify(
        "Colony saved in this browser. Export a backup to keep a separate copy.",
      );
    } catch {
      onNotify(
        "Save failed: browser storage is unavailable. Export a backup now.",
      );
    }
  };
  const exportSave = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(game, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `mars-colony-sol-${game.sol}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return (
    <>
      <div className="mars-game-toolbar">
        <button onClick={save}>SAVE COLONY</button>
        <button onClick={() => dialog.current.showModal()}>MENU</button>
      </div>
      <dialog
        ref={dialog}
        className="mars-menu"
        onKeyDown={(e) => e.stopPropagation()}
      >
        <h2>Colony menu</h2>
        <p>
          {saveError ||
            "Actions autosave locally in this browser. Export a file to move your colony between devices or hosting URLs."}
        </p>
        <button onClick={() => dialog.current.close()}>RESUME GAME</button>
        <button onClick={save}>SAVE NOW</button>
        <button onClick={exportSave}>EXPORT SAVE FILE</button>
        <button onClick={() => input.current.click()}>IMPORT SAVE FILE</button>
        <input
          ref={input}
          type="file"
          accept=".json,application/json"
          aria-label="Import colony save"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            try {
              if (file.size > 2000000) throw Error("Save file is too large.");
              const data = JSON.parse(await file.text());
              if (onRestore(data)) dialog.current.close();
            } catch {
              onNotify("Invalid save file. Your current colony was kept.");
            }
          }}
        />
        <label>
          <input
            type="checkbox"
            checked={supports}
            onChange={(e) => {
              setSupports(e.target.checked);
              window.dispatchEvent(
                new CustomEvent("mars-support-visibility", {
                  detail: e.target.checked,
                }),
              );
            }}
          />{" "}
          Show adaptive support pillars
        </label>
        <p>
          Platforms always clear the terrain. Pillars appear only where there is
          a height gap. This switch changes their visibility.
        </p>
        <button
          onClick={() => {
            dialog.current.close();
            onTitle();
          }}
        >
          RETURN TO TITLE
        </button>
      </dialog>
    </>
  );
}

import { FL } from "../data/flavors.js";

export default function Flavors({ selectedFlavor, onSelectFlavor, onAdd }) {
  return (
    <section id="flavors">
      <div className="right">
        <h2 className="rv">
          Pick your <em>flavor</em>
        </h2>
        <div className="list rv">
          {FL.map((flavor, index) => (
            <button
              key={flavor.n}
              className="fl"
              aria-pressed={index === selectedFlavor}
              onClick={() => onSelectFlavor(index)}
            >
              <div>
                <b>{flavor.n}</b>
                <span>{flavor.d}</span>
              </div>
              <i>${flavor.p}</i>
            </button>
          ))}
        </div>
        <p className="flavor-add">
          <button className="btn" onClick={onAdd}>
            Add {FL[selectedFlavor].n}
          </button>
        </p>
      </div>
    </section>
  );
}

const steps = [
  { label: "Oven", stages: ["to-oven", "baking"] },
  { label: "On the way", stages: ["pickup", "delivering"] },
  { label: "Delivered", stages: ["delivered"] },
];

const copy = {
  "to-oven": ["Order confirmed", "Your pizza is heading to the oven."],
  baking: ["Fresh from the oven", "Wood-fired and blistered just right."],
  pickup: ["Handing off to your rider", "Securing your order for the trip."],
  delivering: ["Out for delivery", "Your pizza is on its way."],
  delivered: ["Delivered", "Freshly made, headed your way. Enjoy!"],
};

export default function DeliveryStatus({ stage, onSkip }) {
  const [title, description] = copy[stage];

  return (
    <aside className="delivery-status" aria-live="polite" aria-atomic="true">
      <div className="delivery-status__topline">CRUSTÉ DELIVERY</div>
      <div className="delivery-status__message">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <button
          className="delivery-status__action"
          onClick={onSkip}
          aria-label={stage === "delivered" ? "Close delivery status" : "Skip delivery animation"}
        >
          {stage === "delivered" ? "Done" : "Skip"}
        </button>
      </div>
      <ol className="delivery-status__steps">
        {steps.map((step) => (
          <li
            key={step.label}
            className={
              step.stages.includes(stage)
                ? "is-current"
                : steps.findIndex((candidate) =>
                      candidate.stages.includes(stage),
                    ) > steps.indexOf(step)
                  ? "is-complete"
                  : ""
            }
          >
            <span aria-hidden="true" />
            {step.label}
          </li>
        ))}
      </ol>
    </aside>
  );
}

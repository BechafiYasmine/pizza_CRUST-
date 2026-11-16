export default function Order({ cartQuantity, onPlaceOrder, disabled }) {
  return (
    <section id="order">
      <div className="cta rv">
        <div className="cart">{cartQuantity}</div>
        <p>
          {cartQuantity
            ? "pizzas in your order. Hot from the oven in about 25 minutes."
            : "Your order is empty. Choose a flavor and we’ll fire the oven."}
        </p>
        <div className="row">
          <a className="btn ghost" href="#flavors">
            Choose flavors
          </a>
          <button className="btn" disabled={disabled} onClick={onPlaceOrder}>
            {disabled ? "Order in progress" : "Place order"}
          </button>
        </div>
      </div>
    </section>
  );
}

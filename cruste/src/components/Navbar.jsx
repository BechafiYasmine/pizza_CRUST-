export default function Navbar({ cartQuantity }) {
  return (
    <nav>
      <a className="logo" href="#top">
        Crusté
      </a>
      <div className="links">
        <a href="#flavors">Flavors</a>
        <a href="#craft">The craft</a>
        <a className="ord" href="#order">
          Order · {cartQuantity}
        </a>
      </div>
    </nav>
  );
}

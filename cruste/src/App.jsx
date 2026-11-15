import { useEffect, useRef, useState } from "react";
import Navbar from "./components/Navbar.jsx";
import Scene from "./components/Scene.jsx";
import Hero from "./components/Hero.jsx";
import Flavors from "./components/Flavors.jsx";
import Craft from "./components/Craft.jsx";
import Order from "./components/Order.jsx";
import Toast from "./components/Toast.jsx";
import { FL } from "./data/flavors.js";

export default function App() {
  const [selectedFlavor, setSelectedFlavor] = useState(0);
  const [cartQuantity, setCartQuantity] = useState(0);
  const [message, setMessage] = useState("");
  const toastTimerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("in");
        });
      },
      { threshold: 0.2 },
    );
    document.querySelectorAll(".rv").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  useEffect(
    () => () => {
      window.clearTimeout(toastTimerRef.current);
    },
    [],
  );

  const showToast = (nextMessage) => {
    setMessage(nextMessage);
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setMessage(""), 2200);
  };

  const addToOrder = () => {
    setCartQuantity((quantity) => quantity + 1);
    showToast(`${FL[selectedFlavor].n} added to your order`);
  };

  const placeOrder = () => {
    if (!cartQuantity) {
      showToast("Add a pizza first");
      return;
    }
    showToast("Order placed. The oven is on.");
    setCartQuantity(0);
  };

  return (
    <>
      <div id="glow" />
      <Scene flavor={selectedFlavor} />
      <Navbar cartQuantity={cartQuantity} />
      <main id="top">
        <Hero />
        <Flavors
          selectedFlavor={selectedFlavor}
          onSelectFlavor={setSelectedFlavor}
          onAdd={addToOrder}
        />
        <Craft />
        <Order cartQuantity={cartQuantity} onPlaceOrder={placeOrder} />
      </main>
      <Toast message={message} />
    </>
  );
}

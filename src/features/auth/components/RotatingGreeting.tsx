import { useEffect, useState } from "react";

const GREETINGS = [
  "안녕하세요",
  "Hello",
  "Bonjour !",
  "Hola",
  "こんにちは",
  "你好",
  "Guten Tag",
  "Olá",
  "Namaste",
  "Ciao",
];

export default function RotatingGreeting() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let transitionTimer: number | undefined;
    const greetingTimer = window.setInterval(() => {
      setVisible(false);
      transitionTimer = window.setTimeout(() => {
        setIndex((current) => (current + 1) % GREETINGS.length);
        setVisible(true);
      }, 250);
    }, 2_200);

    return () => {
      window.clearInterval(greetingTimer);
      window.clearTimeout(transitionTimer);
    };
  }, []);

  return (
    <span
      className={`inline-block transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
      }`}
      aria-live="polite"
    >
      {GREETINGS[index]}
    </span>
  );
}

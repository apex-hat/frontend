import { useEffect, useState } from "react";

// 글로벌 팀을 위한 서비스라는 컨셉을 로그인 화면에서부터 보여주기 위한 다국어 인사말 로테이션.
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
    let timeoutId: ReturnType<typeof setTimeout>;
    const interval = setInterval(() => {
      setVisible(false);
      timeoutId = setTimeout(() => {
        setIndex((i) => (i + 1) % GREETINGS.length);
        setVisible(true);
      }, 250);
    }, 2200);
    return () => {
      clearInterval(interval);
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <span
      className={`inline-block transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      {GREETINGS[index]}
    </span>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface FounderMessageProps {
  onClose: () => void;
}

type Lang = "en" | "pt";

const MESSAGES: Record<Lang, string[]> = {
  en: [
    "You chose the truth. Good choice.",
    "Everything you see here... the towers, the lights, the code blocks... it's all built from LeetCode success. Every window lit is a problem solved. Every shadow cast is a challenge overcome.",
    "What you might not know is that behind this vast digital city, there's a single creator. A dev who decided to transform LeetCode into a living metropolis.",
    "LeetCode City was born from a vision: what if your grind wasn't just numbers on a screen, but the foundation of something permanent? Something you could walk through.",
    "Within weeks, thousands of developers joined. Thousands of unique towers rising from the digital soil. You are the architects. I just provided the space.",
    "This spire you've reached? It's the heartbeat of the signal. It broadcasts the progress of every LC grinder. But keeping this city alive requires power.",
    "Servers, API integrations, real-time rendering... as the city expands, so does the energy required to sustain it.",
    "If LeetCode City has become part of your daily grind, help me keep the towers standing. Your support fuels the simulation.",
    "Keep solving. Keep building. The city is yours.",
    "See you in the skyline.",
  ],
  pt: [
    "Você escolheu a verdade. Boa escolha.",
    "Tudo o que você vê aqui... as torres, as luzes, os blocos de código... tudo é construído a partir do sucesso no LeetCode. Cada janela acesa é um problema resolvido.",
    "O que você talvez não saiba é que por trás desta vasta cidade digital, existe um único criador. Um dev que decidiu transformar o LeetCode em uma metrópole viva.",
    "A LeetCode City nasceu de uma visão: e se o seu esforço não fosse apenas números em uma tela, mas a fundação de algo permanente? Algo pelo qual você pudesse caminhar.",
    "Em poucas semanas, milhares de desenvolvedores se juntaram. Milhares de torres únicas surgindo do solo digital. Vocês são os arquitetos. Eu apenas forneci o espaço.",
    "Esta torre que você alcançou? É o coração do sinal. Ela transmite o progresso de cada guerreiro do LC. Mas manter esta cidade viva exige energia.",
    "Servidores, integrações de API, renderização em tempo real... conforme a cidade se expande, também aumenta a energia necessária para sustentá-la.",
    "Se a LeetCode City se tornou parte da sua rotina diária, ajude-me a manter as torres de pé. Seu apoio alimenta a simulação.",
    "Continue resolvendo. Continue construindo. A cidade é de vocês.",
    "Nos vemos no horizonte.",
  ],
};

const SIGNATURE: Record<Lang, string> = {
  en: "// Ixotic, founder, solo dev, citizen #1",
  pt: "// Ixotic, fundador, dev solo, cidadao #1",
};

const PS_TEXT: Record<Lang, string> = {
  en: "P.S. Would the white rabbit have found you if you had chosen the other one?",
  pt: "P.S. Sera que o coelho branco te encontraria se voce tivesse escolhido a outra?",
};

const CHAR_DELAY = 25;
const PARAGRAPH_PAUSE = 400;

export default function FounderMessage({ onClose }: FounderMessageProps) {
  const [lang, setLang] = useState<Lang>("en");
  const [typedText, setTypedText] = useState("");
  const [currentParagraph, setCurrentParagraph] = useState(0);
  const [paragraphsDone, setParagraphsDone] = useState<string[]>([]);
  const [showSignature, setShowSignature] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showPS, setShowPS] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);

  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const charIndexRef = useRef(0);
  const t1Ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t2Ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t3Ref = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const paragraphs = MESSAGES[lang];
  const allParagraphsDone = currentParagraph >= paragraphs.length;

  const clearAllTimers = useCallback(() => {
    if (typingRef.current) { clearTimeout(typingRef.current); typingRef.current = null; }
    if (t1Ref.current) { clearTimeout(t1Ref.current); t1Ref.current = null; }
    if (t2Ref.current) { clearTimeout(t2Ref.current); t2Ref.current = null; }
    if (t3Ref.current) { clearTimeout(t3Ref.current); t3Ref.current = null; }
    if (skipRef.current) { clearTimeout(skipRef.current); skipRef.current = null; }
  }, []);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (overlayRef.current) overlayRef.current.style.opacity = "1";
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setCursorVisible((v) => !v), 500);
    return () => clearInterval(interval);
  }, []);

  const scrollToBottom = useCallback(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: contentRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  useEffect(() => {
    if (allParagraphsDone) return;

    const text = paragraphs[currentParagraph];
    if (!text) return;

    charIndexRef.current = 0;
    setTypedText("");

    const type = () => {
      if (charIndexRef.current < text.length) {
        charIndexRef.current++;
        setTypedText(text.slice(0, charIndexRef.current));
        scrollToBottom();
        typingRef.current = setTimeout(type, CHAR_DELAY);
      } else {
        typingRef.current = setTimeout(() => {
          setParagraphsDone((prev) => [...prev, text]);
          setTypedText("");
          setCurrentParagraph((p) => p + 1);
        }, PARAGRAPH_PAUSE);
      }
    };

    typingRef.current = setTimeout(type, currentParagraph === 0 ? 500 : 200);

    return () => {
      if (typingRef.current) {
        clearTimeout(typingRef.current);
        typingRef.current = null;
      }
    };
  }, [currentParagraph, paragraphs, allParagraphsDone, scrollToBottom]);

  useEffect(() => {
    if (!allParagraphsDone) return;

    t1Ref.current = setTimeout(() => {
      setShowSignature(true);
      scrollToBottom();
    }, 600);
    
    t2Ref.current = setTimeout(() => {
      setShowSupport(true);
      scrollToBottom();
    }, 1800);
    
    t3Ref.current = setTimeout(() => {
      setShowPS(true);
      scrollToBottom();
    }, 3000);

    return () => {
      if (t1Ref.current) { clearTimeout(t1Ref.current); t1Ref.current = null; }
      if (t2Ref.current) { clearTimeout(t2Ref.current); t2Ref.current = null; }
      if (t3Ref.current) { clearTimeout(t3Ref.current); t3Ref.current = null; }
    };
  }, [allParagraphsDone, scrollToBottom]);

  const skip = useCallback(() => {
    if (allParagraphsDone) return;
    clearAllTimers();
    setParagraphsDone([...paragraphs]);
    setTypedText("");
    setCurrentParagraph(paragraphs.length);
    setShowSignature(true);
    setShowSupport(true);
    setShowPS(true);
    skipRef.current = setTimeout(scrollToBottom, 50);
  }, [allParagraphsDone, paragraphs, scrollToBottom, clearAllTimers]);

  const switchLang = (newLang: Lang) => {
    if (newLang === lang) return;
    clearAllTimers();
    setLang(newLang);
    setTypedText("");
    setCurrentParagraph(0);
    setParagraphsDone([]);
    setShowSignature(false);
    setShowSupport(false);
    setShowPS(false);
    charIndexRef.current = 0;
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-700"
      style={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/90" />

      <div
        className="relative mx-4 w-full max-w-xl max-h-[85vh] flex flex-col"
        style={{
          border: "2px solid rgba(255, 161, 22, 0.3)",
          background: "rgba(5, 10, 5, 0.95)",
          boxShadow: "4px 4px 0px rgba(255, 161, 22, 0.1)",
        }}
      >
        <div
          className="flex items-center justify-between px-6 py-3"
          style={{ borderBottom: "1px solid rgba(255, 161, 22, 0.15)" }}
        >
          <div
            className="font-pixel text-[8px] sm:text-[9px] tracking-wider"
            style={{ color: "rgba(255, 161, 22, 0.3)" }}
          >
            &gt; TRANSMISSION FROM SPIRE_01
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => switchLang(lang === "en" ? "pt" : "en")}
              className="px-2 py-1 font-pixel text-[10px] text-orange-400 hover:bg-orange-500/10 transition-colors"
            >
              [{lang === "en" ? "PT-BR" : "EN"}]
            </button>
            <button
              onClick={onClose}
              className="px-2 py-1 font-pixel text-[10px] text-red-400 hover:bg-red-500/10 transition-colors"
            >
              [X]
            </button>
          </div>
        </div>

        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-[13px] leading-relaxed text-green-400/90 whitespace-pre-wrap select-none scrollbar-thin scrollbar-thumb-orange-500/20"
        >
          {paragraphsDone.map((p, idx) => (
            <p key={idx}>{p}</p>
          ))}
          {typedText && (
            <p>
              {typedText}
              {cursorVisible && <span className="inline-block w-2 h-4 ml-0.5 bg-orange-400 align-middle" />}
            </p>
          )}

          {showSignature && (
            <div className="text-orange-400/80 font-pixel text-[11px] mt-6 pt-2 border-t border-orange-500/10">
              {SIGNATURE[lang]}
            </div>
          )}

          {showSupport && (
            <div className="bg-orange-500/5 border border-orange-500/10 p-4 rounded mt-4 space-y-3 animation-fade-in">
              <p className="text-orange-300 font-pixel text-[11px]">
                {lang === "en" ? "SUPPORT THE RUNTIME" : "APOIE A SIMULAÇÃO"}
              </p>
              <button className="w-full bg-orange-500 hover:bg-orange-600 text-black font-pixel text-[11px] py-2.5 transition-colors shadow-[2px_2px_0px_rgba(255,161,22,0.2)]">
                {lang === "en" ? "Fuel Server (Stripe / Crypto)" : "Alimentar Servidor (Stripe / Crypto)"}
              </button>
            </div>
          )}

          {showPS && (
            <div className="text-green-500/40 italic text-[11px] mt-6">
              {PS_TEXT[lang]}
            </div>
          )}
        </div>

        {!allParagraphsDone && (
          <div className="p-4 flex justify-end border-t border-orange-500/5 bg-black/40">
            <button
              onClick={skip}
              className="px-4 py-1.5 font-pixel text-[10px] border border-green-500/20 text-green-400/60 hover:text-green-400 hover:border-green-400/50 transition-colors"
            >
              &gt;&gt; SKIP_TRANSMISSION
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
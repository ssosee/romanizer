"use client"

import {useState} from "react"
import {isOnlyKorean, romanize} from "./utils/romanizer"
import "./App.css"

function App() {
    const [input, setInput] = useState("");
    const [result, setResult] = useState("");
    const [copied, setCopied] = useState(false);

    const handleRomanize = () => {
        if (!isOnlyKorean(input)) {
            alert('한글만 입력해주세요.');
        }

        const romanized = romanize(input);
        setResult(romanized);
    }

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            handleRomanize();
        }
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText('[' + result + ']');
            setCopied(true);
            setTimeout(() => setCopied(false), 3000); // 2초 후 복사 완료 메시지 제거
        } catch (err) {
            console.error("복사 실패:", err);
        }
    };

    return (
        <div className="app">
            <div className="container">
                <div className="card">
                    <div className="header">
                        <h1>🇰🇷 한글 발음기호 생성기</h1>
                        <p>Korean to Romanization Generator</p>
                    </div>

                    <div className="content">
                        <div className="input-group">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="한글 입력"
                                className="text-input"
                            />
                            <button onClick={handleRomanize} className="btn">
                                변환하기
                            </button>
                        </div>

                        <div className="result-box">
                            <span className="result-label">결과: </span>
                            <span className="result-text">{`[` + result + `]`}</span>
                            <button onClick={handleCopy} className={`copy-btn ${copied ? "copied" : ""}`}>
                                {copied ? "복사완료!" : "복사하기"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default App

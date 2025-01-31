import { useState } from 'react';
import './App.css';
import { Scanner } from "./parse";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { dom, fundAndGamma, lt, Options, termToString } from './code';

type Operation = "fund" | "dom" | "less_than";

function App() {
  const [inputA, setInputA] = useState("");
  const [inputB, setInputB] = useState("");
  const [output, setOutput] = useState("入力：\n\n出力：");
  const [outputError, setOutputError] = useState("");
  const [options, setOptions] = useState<Options>({
    checkOnOffo: false,
    checkOnOffO: false,
    checkOnOffI: false,
    checkOnOffA: false,
    checkOnOffB: false,
    checkOnOffC: false,
    checkOnOffT: false,
  });
  const [showHide, setShowHide] = useState(false);

  const compute = (operation: Operation) => {
    setOutput("");
    setOutputError("");
    try {
      const x = inputA ? new Scanner(inputA).parse_term() : null;
      if (x === null) throw Error("Aの入力が必要です");

      const inputStrx = termToString(x, options);
      let inputStry: string;
      let inputStr: string;
      if (operation === "dom") {
        inputStr = options.checkOnOffT ? `入力：$\\textrm{dom}(${inputStrx})$` : `入力：dom(${inputStrx})`;
        let strTerm = termToString(dom(x), options);
        strTerm = `\n\n出力：${options.checkOnOffT ? `$${strTerm}$` : strTerm}`;
        setOutput(`${inputStr}${strTerm}`);
        return;
      } else {
        const y = inputB ? new Scanner(inputB).parse_term() : null;
        if (y === null) throw Error("Bの入力が必要です");
        inputStry = termToString(y, options);
        if (operation === "fund") {
          inputStr = options.checkOnOffT ? `入力：$${inputStrx}[${inputStry}]$` : `入力：${inputStrx}[${inputStry}]`;
          const strT = fundAndGamma(x, y);
          let strGamma = termToString(strT.gamma, options);
          strGamma = `\n\nBadpart：${options.checkOnOffT ? `$${strGamma}$` : strGamma}`;
          let strTerm = termToString(strT.fund, options);
          strTerm = `\n\n出力：${options.checkOnOffT ? `$${strTerm}$` : strTerm}`;
          setOutput(`${inputStr}${strGamma}${strTerm}`);
          return;
        } else if (operation === "less_than") {
          inputStr = options.checkOnOffT ? `入力：$${inputStrx} \\lt ${inputStry}$` : `入力：${inputStrx} < ${inputStry}`;
          setOutput(`${inputStr}\n\n出力：${lt(x, y) ? "真" : "偽"}`);
          return;
        } else {
          throw new Error("不明な操作");
        }
      }
    } catch (error) {
      if (error instanceof Error) setOutputError(error.message);
      else setOutputError("不明なエラー");
      console.error("Error in compute:", error);
    }
  };

  const handleCheckboxChange = (key: keyof Options) => {
    setOptions((prevOptions) => ({
      ...prevOptions,
      [key]: !prevOptions[key],
    }));
  };

  return (
    <div className="app">
      <header>SROψ計算機</header>
      <main>
        <p className="rdm">
          入力はψ(a,b), ψ_&#123;a&#125;(b), ψ_a(b), ψ&#123;a&#125;(b), ψa(b), M(a)の形式で行ってください。<br />
          a=0の時はψ(b)としても大丈夫です。<br />
          略記として、1 := ψ(0,0), n := 1 + 1 + ...(n個の1)... + 1, ω := ψ(0,1), Ω := ψ(1,0), I := ψ(M(0),0)が使用可能。<br />
          ψはpで、Mはmで、ωはwで、ΩはW、Iはiで代用可能です。
        </p>
        A:
        <input
          className="input is-primary"
          value={inputA}
          onChange={(e) => setInputA(e.target.value)}
          type="text"
          placeholder="入力A"
        />
        B:
        <input
          className="input is-primary"
          value={inputB}
          onChange={(e) => setInputB(e.target.value)}
          type="text"
          placeholder="入力B"
        />
        <div className="block">
          <button className="button is-primary" onClick={() => compute("fund")}>
            A[B]を計算
          </button>
          <button className="button is-primary" onClick={() => compute("dom")}>
            dom(A)を計算
          </button>
          <button className="button is-primary" onClick={() => compute("less_than")}>
            A &lt; Bか判定
          </button>
        </div>
        <input type="button" value="オプション" onClick={() => setShowHide(!showHide)} className="button is-primary is-light is-small" />
        {showHide && (
          <ul>
            <li><label className="checkbox">
              <input type="checkbox" checked={options.checkOnOffo} onChange={() => handleCheckboxChange('checkOnOffo')} />
              &nbsp;ψ{options.checkOnOffC ? `(1)` : `${options.checkOnOffA ? `${options.checkOnOffB ? `_{0}(1)` : `_0(1)`}` : `(0,1)`}`}をωで出力
            </label></li>
            <li><label className="checkbox">
              <input type="checkbox" checked={options.checkOnOffO} onChange={() => handleCheckboxChange('checkOnOffO')} />
              &nbsp;ψ{options.checkOnOffA ? `${options.checkOnOffB ? `_{1}(0)` : `_1(0)`}` : `(1,0)`}をΩで出力
            </label></li>
            <li><label className="checkbox">
              <input type="checkbox" checked={options.checkOnOffI} onChange={() => handleCheckboxChange('checkOnOffI')} />
              &nbsp;ψ{options.checkOnOffA ? `_{M(0)}(0)` : `(M(0),0)`}をIで出力
            </label></li>
            <li><label className="checkbox">
              <input type="checkbox" checked={options.checkOnOffA} onChange={() => handleCheckboxChange('checkOnOffA')} />
              &nbsp;ψ(a,b)をψ_{options.checkOnOffB ? `{a}` : `a`}(b)で表示
            </label></li>
            {options.checkOnOffA && (
              <li><ul><li><label className="checkbox">
                <input type="checkbox" checked={options.checkOnOffB} onChange={() => handleCheckboxChange('checkOnOffB')} />
                &nbsp;全ての&#123; &#125;を表示
              </label></li></ul></li>
            )}
            <li><label className="checkbox">
              <input type="checkbox" checked={options.checkOnOffC} onChange={() => handleCheckboxChange('checkOnOffC')} />
              &nbsp;ψ{options.checkOnOffA ? `${options.checkOnOffB ? `_{0}(b)` : `_0(b)`}` : `(0,b)`}をψ(b)で表示
            </label></li>
            <li><label className="checkbox">
              <input type="checkbox" checked={options.checkOnOffT} onChange={() => handleCheckboxChange('checkOnOffT')} />
              &nbsp;TeXで出力
            </label></li>
          </ul>
        )}
        <div className="box is-primary">
          {outputError !== "" ? (
            <div className="notification is-danger">{outputError}</div>
          ) : (
            <div>
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {output}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </main>
      <footer>
        <a href="https://googology.fandom.com/ja/wiki/%E3%83%A6%E3%83%BC%E3%82%B6%E3%83%BC%E3%83%96%E3%83%AD%E3%82%B0:%E7%AB%B9%E5%8F%96%E7%BF%81/SRO%CF%88%E9%96%A2%E6%95%B0" target="_blank" rel="noreferrer">ユーザーブログ:竹取翁/SROψ関数 | 巨大数研究 Wiki | Fandom</a>(2024/11/24 閲覧)<br />
        このページは<a href="https://creativecommons.org/licenses/by-sa/3.0/legalcode" target="_blank" rel="noreferrer">Creative Commons Attribution-ShareAlike 3.0 Unported License</a>の下に公開されます。<br />
      </footer>
    </div>
  );
}

export default App;
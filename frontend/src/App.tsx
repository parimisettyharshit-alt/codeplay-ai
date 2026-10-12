import { useEffect, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import {
  Bot,
  BrainCircuit,
  Copy,
  Crosshair,
  Download,
  Gamepad2,
  Gauge,
  Play,
  RotateCcw,
  Save,
  Sparkles,
  Sword,
  Trophy,
  Zap,
} from 'lucide-react';
import { defaultLanguage, starterSamples } from './data/languages';
import type { ExecutionResult, SupportedLanguage } from './types';

const gameIdeas = [
  {
    name: 'Number Guessing',
    description: 'Guess the secret number and boost your logic skills.',
    xp: 120,
    difficulty: 'Beginner',
  },
  {
    name: 'Quiz Quest',
    description: 'Answer fast and build confidence in conditional logic.',
    xp: 160,
    difficulty: 'Beginner',
  },
  {
    name: 'Memory Match',
    description: 'Train pattern recognition and attention.',
    xp: 210,
    difficulty: 'Intermediate',
  },
  {
    name: 'Debugging Challenge',
    description: 'Fix broken logic and learn from errors.',
    xp: 260,
    difficulty: 'Intermediate',
  },
];

const getInitialFiles = (language: string) => {
  const mainName =
    language === 'python'
      ? 'main.py'
      : language === 'javascript'
        ? 'main.js'
        : language === 'bash'
          ? 'run.sh'
          : language === 'html'
            ? 'index.html'
            : language === 'css'
              ? 'styles.css'
              : language === 'sql'
                ? 'query.sql'
                : 'main.txt';

  const helperName = language === 'python' ? 'helper.py' : language === 'javascript' ? 'helper.js' : 'notes.txt';

  return {
    [mainName]: starterSamples[language] ?? starterSamples.python,
    [helperName]: `# ${language.toUpperCase()} helper\n# Use this file for support functions or extra notes.`,
  };
};

function App() {
  const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState(defaultLanguage);
  const [files, setFiles] = useState<Record<string, string>>(getInitialFiles(defaultLanguage));
  const [activeFile, setActiveFile] = useState('main.py');
  const [inputValue, setInputValue] = useState('');
  const [output, setOutput] = useState('No execution yet. Click Run Code to test your program.');
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error' | 'timeout'>('idle');
  const [executionTime, setExecutionTime] = useState(0);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [gameMode, setGameMode] = useState<'Run Mode' | 'Game Mode'>('Run Mode');
  const [selectedGame, setSelectedGame] = useState(gameIdeas[0]);
  const [xp, setXp] = useState(1280);
  const [coins, setCoins] = useState(95);
  const [streak, setStreak] = useState(7);
  const [guessNumber, setGuessNumber] = useState('');
  const [guessFeedback, setGuessFeedback] = useState('');
  const [guessScore, setGuessScore] = useState(0);

  const fileTabs = Object.keys(files);

  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const res = await fetch('/api/health');
        const payload = await res.json();
        const available = payload.supportedLanguages || [];
        setLanguages(available);

        if (available.length) {
          const firstReady = available.find((item: SupportedLanguage) => item.ready || item.previewOnly) ?? available[0];
          setSelectedLanguage(firstReady.id);
          const fresh = getInitialFiles(firstReady.id);
          setFiles(fresh);
          setActiveFile(Object.keys(fresh)[0]);
        }
      } catch {
        setLanguages([
          { id: 'python', label: 'Python', ready: true },
          { id: 'javascript', label: 'JavaScript', ready: true },
          { id: 'bash', label: 'Bash', ready: true },
          { id: 'html', label: 'HTML', ready: true, previewOnly: true },
          { id: 'css', label: 'CSS', ready: true, previewOnly: true },
          { id: 'sql', label: 'SQL', ready: true, previewOnly: true },
        ]);
      }
    };

    loadLanguages();
  }, []);

  const activeLanguage = useMemo(
    () => languages.find((item) => item.id === selectedLanguage) ?? languages[0],
    [languages, selectedLanguage],
  );

  const code = files[activeFile] ?? '';

  const handleLanguageChange = (nextLanguage: string) => {
    setSelectedLanguage(nextLanguage);
    const freshFiles = getInitialFiles(nextLanguage);
    setFiles(freshFiles);
    setActiveFile(Object.keys(freshFiles)[0]);
    setOutput(`Language switched to ${nextLanguage}. Ready to run.`);
    setStatus('idle');
  };

  const handleRunCode = async () => {
    setStatus('running');
    setOutput('Running program in the secure sandbox...');

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: selectedLanguage,
          code,
          input: inputValue,
          files: Object.entries(files).map(([name, content]) => ({ name, content })),
        }),
      });

      const result: ExecutionResult = await response.json();
      setExecutionTime(result.executionTimeMs || 0);
      setStatus(result.status as 'success' | 'error' | 'timeout');

      const cleanStdout = result.output?.trim() ? result.output : 'No output produced.';
      const cleanError = result.stderr?.trim() ? `\n\nError:\n${result.stderr}` : '';
      setOutput(`${cleanStdout}${cleanError}`);

      if (result.status === 'success') {
        setXp((current) => current + 35);
        setCoins((current) => current + 10);
      }
    } catch {
      setStatus('error');
      setOutput('Execution failed. The backend service is unavailable. Please check that the server is running.');
    }
  };

  const handleConvertToGame = () => {
    setGameMode('Game Mode');
    const target = gameIdeas[Math.floor(Math.random() * gameIdeas.length)];
    setSelectedGame(target);
    setGuessNumber('');
    setGuessFeedback(`New challenge: ${target.name}. Pick a number and test your logic.`);
    setOutput(`Game mode enabled: ${target.name}. Use the challenge card to practice the same logic.`);
  };

  const handleReset = () => {
    const freshFiles = getInitialFiles(selectedLanguage);
    setFiles(freshFiles);
    setActiveFile(Object.keys(freshFiles)[0]);
    setInputValue('');
    setOutput('Workspace cleared and reset to a fresh starter program.');
    setStatus('idle');
  };

  const handleSave = () => {
    localStorage.setItem(`codeplay-${selectedLanguage}-${activeFile}`, files[activeFile]);
    setOutput(`Saved ${activeFile} successfully.`);
  };

  const handleLoad = () => {
    const saved = localStorage.getItem(`codeplay-${selectedLanguage}-${activeFile}`);
    if (saved) {
      setFiles((current) => ({ ...current, [activeFile]: saved }));
      setOutput(`Loaded your saved ${activeFile}.`);
    } else {
      setOutput(`No saved program found for ${activeFile}.`);
    }
  };

  const handleCopy = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(code);
    }
    setOutput('Code copied to your clipboard.');
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile || `program.${activeLanguage?.fileExt || 'txt'}`;
    a.click();
    URL.revokeObjectURL(url);
    setOutput('Program downloaded successfully.');
  };

  const submitGuess = () => {
    const value = Number(guessNumber);
    if (!Number.isFinite(value)) {
      setGuessFeedback('Please enter a valid number.');
      return;
    }

    const secret = Math.floor(Math.random() * 20) + 1;
    if (value === secret) {
      setGuessScore((current) => current + 10);
      setGuessFeedback(`Correct! ${value} was the secret number. Great job.`);
      setXp((current) => current + 25);
      setCoins((current) => current + 5);
    } else if (value < secret) {
      setGuessFeedback('Too low. Try a higher number.');
    } else {
      setGuessFeedback('Too high. Try a lower number.');
    }
    setGuessNumber('');
  };

  const renderGamePanel = () => {
    if (gameMode !== 'Game Mode') return null;

    return (
      <div className="rounded-3xl border border-violet-500/30 bg-violet-500/5 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-violet-300">
            <Gamepad2 size={18} />
            <h3 className="font-semibold text-slate-100">{selectedGame.name}</h3>
          </div>
          <span className="rounded-full border border-violet-400/40 bg-violet-500/10 px-2 py-0.5 text-xs uppercase tracking-[0.2em] text-violet-200">
            {selectedGame.difficulty}
          </span>
        </div>

        <p className="mb-3 text-sm text-slate-300">{selectedGame.description}</p>

        <div className="rounded-2xl border border-slate-700 bg-slate-950 p-3">
          <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
            <span>Score</span>
            <span>{guessScore}</span>
          </div>
          <div className="flex gap-2">
            <input
              value={guessNumber}
              onChange={(event) => setGuessNumber(event.target.value)}
              placeholder="Enter your guess"
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-violet-400"
            />
            <button onClick={submitGuess} className="rounded-xl bg-violet-500 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-400">
              Guess
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-300">{guessFeedback || 'Make your first guess to start the challenge.'}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-glow backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 p-3 text-slate-950">
                <BrainCircuit size={26} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-sky-300">CodePlay AI</p>
                <h1 className="text-2xl font-bold">Learn Coding by Playing</h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200">XP {xp}</div>
              <div className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-200">Coins {coins}</div>
              <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-200">Streak {streak} days</div>
              <button onClick={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))} className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-100 hover:border-sky-400">
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </button>
            </div>
          </div>
        </header>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-sky-300"><Gauge size={18} /> Beginner</div>
            <p className="text-xl font-bold">Logic Builder</p>
            <p className="text-sm text-slate-300">Solve mini challenges to unlock more advanced tasks.</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-emerald-300"><Trophy size={18} /> Daily Mission</div>
            <p className="text-xl font-bold">Fix 3 bugs</p>
            <p className="text-sm text-slate-300">Earn rewards and unlock new badges.</p>
          </div>
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-violet-300"><Sword size={18} /> Coding Quest</div>
            <p className="text-xl font-bold">Adventure Mode</p>
            <p className="text-sm text-slate-300">Turn logic into a game and keep progressing.</p>
          </div>
        </div>

        <main className="grid gap-6 xl:grid-cols-[1.65fr_0.9fr]">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/85 p-4 shadow-2xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <select value={selectedLanguage} onChange={(event) => handleLanguageChange(event.target.value)} className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-sky-400">
                  {languages.length ? languages.map((language) => <option key={language.id} value={language.id}>{language.label}</option>) : <option value="python">Python</option>}
                </select>

                <button onClick={handleRunCode} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:opacity-95">
                  <Play size={16} /> Run Code
                </button>

                <button onClick={handleConvertToGame} className="inline-flex items-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-200 hover:border-violet-400">
                  <Gamepad2 size={16} /> Convert Code to Game
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button onClick={handleSave} className="rounded-xl border border-slate-700 bg-slate-800 p-2 hover:border-sky-400" title="Save"><Save size={16} /></button>
                <button onClick={handleDownload} className="rounded-xl border border-slate-700 bg-slate-800 p-2 hover:border-sky-400" title="Download"><Download size={16} /></button>
                <button onClick={handleCopy} className="rounded-xl border border-slate-700 bg-slate-800 p-2 hover:border-sky-400" title="Copy code"><Copy size={16} /></button>
                <button onClick={handleReset} className="rounded-xl border border-slate-700 bg-slate-800 p-2 hover:border-sky-400" title="Reset"><RotateCcw size={16} /></button>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              {fileTabs.map((fileName) => (
                <button
                  key={fileName}
                  onClick={() => setActiveFile(fileName)}
                  className={`rounded-xl border px-3 py-1.5 text-sm ${activeFile === fileName ? 'border-sky-400 bg-sky-500/10 text-sky-200' : 'border-slate-700 bg-slate-800 text-slate-300'}`}
                >
                  {fileName}
                </button>
              ))}
            </div>

            <div className="mb-4 overflow-hidden rounded-2xl border border-slate-800">
              <Editor
                height="430px"
                theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
                language={selectedLanguage === 'typescript' ? 'typescript' : selectedLanguage === 'javascript' ? 'javascript' : selectedLanguage === 'python' ? 'python' : selectedLanguage === 'bash' ? 'shell' : selectedLanguage === 'html' ? 'html' : selectedLanguage === 'css' ? 'css' : 'plaintext'}
                value={code}
                onChange={(value) => {
                  const nextValue = value ?? '';
                  setFiles((current) => ({ ...current, [activeFile]: nextValue }));
                }}
                options={{
                  minimap: { enabled: false },
                  automaticLayout: true,
                  fontSize: 14,
                  lineNumbersMinChars: 3,
                  padding: { top: 16, bottom: 16 },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  tabSize: 2,
                  suggestOnTriggerCharacters: true,
                  formatOnPaste: true,
                  formatOnType: true,
                }}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-semibold text-slate-200">Input Console</p>
                  <span className="text-xs text-slate-400">Optional</span>
                </div>
                <textarea value={inputValue} onChange={(event) => setInputValue(event.target.value)} placeholder="Enter program input here..." className="h-28 w-full resize-none rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-slate-100 outline-none focus:border-sky-400" />
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                <p className="mb-2 font-semibold text-slate-200">Execution Status</p>
                <div className="mb-3 flex items-center gap-2 text-sm">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${status === 'success' ? 'bg-emerald-400' : status === 'error' || status === 'timeout' ? 'bg-rose-400' : status === 'running' ? 'bg-amber-400' : 'bg-slate-500'}`} />
                  <span className="capitalize text-slate-200">{status || 'idle'}</span>
                </div>
                <div className="space-y-1 text-sm text-slate-300">
                  <p>Language: {activeLanguage?.label || selectedLanguage}</p>
                  <p>Runtime: {activeLanguage?.ready || activeLanguage?.previewOnly ? 'Available' : 'Unavailable'}</p>
                  <p>Execution time: {executionTime} ms</p>
                  <p>{activeLanguage?.note || 'Ready for new challenges.'}</p>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/85 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-100">Unified Output</h2>
                <button onClick={() => setOutput('Output panel cleared.')} className="rounded-full border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200">Clear</button>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 font-mono text-sm text-slate-100">
                <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                  <span>{gameMode}</span>
                  <span>Console</span>
                </div>
                <pre className="min-h-[200px] whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">{output}</pre>
              </div>
            </div>

            {renderGamePanel()}

            <div className="rounded-3xl border border-slate-800 bg-slate-900/85 p-4">
              <div className="mb-4 flex items-center gap-2 text-sky-300">
                <Bot size={18} />
                <h3 className="font-semibold text-slate-100">AI Tutor</h3>
              </div>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="rounded-xl bg-slate-800 p-3">Explain this code in simple language.</div>
                <div className="rounded-xl bg-slate-800 p-3">Find the bug and suggest the fix.</div>
                <div className="rounded-xl bg-slate-800 p-3">Show a gentle hint without revealing the full answer.</div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/85 p-4">
              <div className="mb-4 flex items-center gap-2 text-violet-300">
                <Sparkles size={18} />
                <h3 className="font-semibold text-slate-100">Challenge Cards</h3>
              </div>
              <div className="space-y-3">
                {gameIdeas.map((game) => (
                  <button key={game.name} onClick={() => { setSelectedGame(game); setGameMode('Game Mode'); setGuessFeedback(`Challenge started: ${game.name}.`); }} className={`w-full rounded-2xl border p-3 text-left transition ${selectedGame.name === game.name ? 'border-sky-400 bg-sky-500/10' : 'border-slate-700 bg-slate-800/60 hover:border-slate-500'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-100">{game.name}</span>
                      <span className="rounded-full border border-slate-600 bg-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] text-slate-200">{game.difficulty}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-300">{game.description}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1"><Zap size={12} /> {game.xp} XP</span>
                      <span className="inline-flex items-center gap-1"><Crosshair size={12} /> Play</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}

export default App;

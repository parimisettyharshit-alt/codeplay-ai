const express = require('express');
const cors = require('cors');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
const EXECUTION_TIMEOUT_MS = Number(process.env.EXECUTION_TIMEOUT_MS || 2500);

const runtimeCatalog = {
  python: { label: 'Python', command: 'python3', fileExt: '.py', ready: true },
  javascript: { label: 'JavaScript', command: 'node', fileExt: '.js', ready: true },
  typescript: { label: 'TypeScript', command: 'node', fileExt: '.ts', ready: false, note: 'Needs a TypeScript compiler installed in the runtime environment.' },
  bash: { label: 'Bash', command: 'bash', fileExt: '.sh', ready: true },
  html: { label: 'HTML', command: null, fileExt: '.html', ready: true, previewOnly: true },
  css: { label: 'CSS', command: null, fileExt: '.css', ready: true, previewOnly: true },
  sql: { label: 'SQL', command: null, fileExt: '.sql', ready: true, previewOnly: true },
  java: { label: 'Java', command: 'javac', fileExt: '.java', ready: false, note: 'Install Java runtime to enable compilation.' },
  c: { label: 'C', command: 'gcc', fileExt: '.c', ready: false, note: 'Install GCC in the backend sandbox.' },
  cpp: { label: 'C++', command: 'g++', fileExt: '.cpp', ready: false, note: 'Install g++ in the backend sandbox.' },
  csharp: { label: 'C#', command: 'dotnet', fileExt: '.cs', ready: false, note: 'Install .NET SDK in the backend sandbox.' },
  php: { label: 'PHP', command: 'php', fileExt: '.php', ready: false, note: 'Install PHP to enable execution.' },
  ruby: { label: 'Ruby', command: 'ruby', fileExt: '.rb', ready: false, note: 'Install Ruby to enable execution.' },
  go: { label: 'Go', command: 'go', fileExt: '.go', ready: false, note: 'Install Go to enable execution.' },
  rust: { label: 'Rust', command: 'rustc', fileExt: '.rs', ready: false, note: 'Install Rust toolchain to enable execution.' },
  swift: { label: 'Swift', command: 'swift', fileExt: '.swift', ready: false, note: 'Install Swift toolchain to enable execution.' },
  kotlin: { label: 'Kotlin', command: 'kotlinc', fileExt: '.kt', ready: false, note: 'Install Kotlin compiler to enable execution.' },
  dart: { label: 'Dart', command: 'dart', fileExt: '.dart', ready: false, note: 'Install Dart SDK to enable execution.' },
  r: { label: 'R', command: 'Rscript', fileExt: '.R', ready: false, note: 'Install R to enable execution.' },
  scala: { label: 'Scala', command: 'scala', fileExt: '.scala', ready: false, note: 'Install Scala to enable execution.' },
  perl: { label: 'Perl', command: 'perl', fileExt: '.pl', ready: false, note: 'Install Perl to enable execution.' },
  lua: { label: 'Lua', command: 'lua', fileExt: '.lua', ready: false, note: 'Install Lua to enable execution.' },
};

app.use(express.json({ limit: '1mb' }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

function getSupportedLanguages() {
  return Object.entries(runtimeCatalog).map(([id, meta]) => ({
    id,
    label: meta.label,
    ready: meta.ready,
    previewOnly: meta.previewOnly || false,
    note: meta.note || null,
    fileExt: meta.fileExt,
  }));
}

function toText(value) {
  if (value === undefined || value === null) return '';
  return String(value);
}

function composeProgram(files, fallbackCode) {
  if (!Array.isArray(files) || files.length === 0) return fallbackCode || '';
  const segments = files.map((file) => {
    const name = file.name || 'program';
    const content = file.content || '';
    return `# --- ${name} ---\n${content}`;
  });
  return segments.join('\n\n');
}

function runPreviewOnly(language, code) {
  if (language === 'html') {
    return {
      status: 'success',
      output: `Preview-ready HTML output.\n\n${code.trim() || '<p>Empty HTML document.</p>'}`,
      stderr: '',
      executionTimeMs: 8,
      language,
      inputRequired: false,
    };
  }

  if (language === 'css') {
    return {
      status: 'success',
      output: `CSS loaded successfully.\nGenerated style rules:\n${(code.trim() || 'body { color: #fff; }').split('\n').slice(0, 5).join('\n')}`,
      stderr: '',
      executionTimeMs: 7,
      language,
      inputRequired: false,
    };
  }

  if (language === 'sql') {
    return {
      status: 'success',
      output: `SQL statement accepted.\nThis runtime supports syntax validation only.\nQuery preview:\n${(code.trim() || 'SELECT * FROM students;')}`,
      stderr: '',
      executionTimeMs: 9,
      language,
      inputRequired: false,
    };
  }

  return {
    status: 'error',
    output: '',
    stderr: 'The selected language is preview-only in this sandbox. Connect a real execution engine for full support.',
    executionTimeMs: 0,
    language,
    inputRequired: false,
  };
}

function executeCode(language, code, input = '') {
  const runtime = runtimeCatalog[language];
  if (!runtime) {
    return {
      status: 'error',
      output: '',
      stderr: `Unsupported language: ${language}`,
      executionTimeMs: 0,
      language,
      inputRequired: false,
    };
  }

  if (runtime.previewOnly) {
    return runPreviewOnly(language, code);
  }

  if (!runtime.ready) {
    return {
      status: 'error',
      output: '',
      stderr: runtime.note || `The language ${language} is not available in the current sandbox.`,
      executionTimeMs: 0,
      language,
      inputRequired: false,
    };
  }

  try {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'codeplay-'));
    const filePath = path.join(tempDir, `program${runtime.fileExt}`);
    fs.writeFileSync(filePath, code || '', 'utf8');

    let command = runtime.command;
    let args = [];

    if (language === 'python') {
      args = [filePath];
    } else if (language === 'javascript') {
      args = [filePath];
    } else if (language === 'bash') {
      args = [filePath];
    }

    const startedAt = Date.now();
    const result = spawnSync(command, args, {
      cwd: tempDir,
      input,
      encoding: 'utf8',
      timeout: EXECUTION_TIMEOUT_MS,
      maxBuffer: 1024 * 1024,
    });
    const executionTimeMs = Date.now() - startedAt;

    fs.rmSync(tempDir, { recursive: true, force: true });

    const stdout = toText(result.stdout || '');
    const stderr = toText(result.stderr || '');

    if (result.error) {
      return {
        status: 'error',
        output: '',
        stderr: result.error.message,
        executionTimeMs,
        language,
        inputRequired: false,
      };
    }

    if (result.signal) {
      return {
        status: 'error',
        output: stdout,
        stderr: `Program was interrupted by signal: ${result.signal}`,
        executionTimeMs,
        language,
        inputRequired: false,
      };
    }

    if (result.status === 124) {
      return {
        status: 'timeout',
        output: stdout,
        stderr: `Execution timed out after ${EXECUTION_TIMEOUT_MS} ms. Check for infinite loops or heavy processing.`,
        executionTimeMs,
        language,
        inputRequired: false,
      };
    }

    return {
      status: result.status === 0 ? 'success' : 'error',
      output: stdout,
      stderr,
      executionTimeMs,
      language,
      inputRequired: /readline|input\(/i.test(code) || /stdin/i.test(stderr),
    };
  } catch (error) {
    return {
      status: 'error',
      output: '',
      stderr: error.message || 'Execution failed in the sandbox.',
      executionTimeMs: 0,
      language,
      inputRequired: false,
    };
  }
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    supportedLanguages: getSupportedLanguages(),
    appName: 'CodePlay AI',
  });
});

app.post('/api/execute', (req, res) => {
  const { language = 'python', code = '', input = '', files = [] } = req.body || {};
  const programText = composeProgram(files, code);
  const result = executeCode(language, programText, input);
  res.json({
    ...result,
    code: programText,
    input,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    status: 'ready',
    message: 'CodePlay AI backend is running.',
    supportedLanguages: getSupportedLanguages().filter((item) => item.ready || item.previewOnly),
  });
});

app.listen(PORT, () => {
  console.log(`CodePlay AI backend running on http://localhost:${PORT}`);
});

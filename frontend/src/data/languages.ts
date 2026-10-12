export const starterSamples: Record<string, string> = {
  python: `print("Welcome to CodePlay AI!")\nname = input("What is your name? ")\nprint(f"Hello, {name}! You are learning to code.")`,
  javascript: `const guess = 7;\nconst answer = Number(prompt("Guess a number from 1 to 10: "));\nif (answer === guess) {\n  console.log("Correct! You guessed it!");\n} else {\n  console.log("Not quite. Try again!");\n}`,
  bash: `echo "Starting challenge..."\nfor i in 1 2 3 4 5; do\n  echo "Level $i"\ndone`,
  html: `<!DOCTYPE html>\n<html>\n  <head>\n    <title>My First Page</title>\n  </head>\n  <body>\n    <h1>Hello from CodePlay AI</h1>\n    <p>Build, test, and play.</p>\n  </body>\n</html>`,
  css: `body {\n  background: linear-gradient(135deg, #0ea5e9, #111827);\n  color: white;\n  font-family: sans-serif;\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n}`,
  sql: `SELECT 'CodePlay AI' AS app_name, 42 AS xp_points;`,
};

export const defaultLanguage = 'python';

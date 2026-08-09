# File Writing & Escaping

When using tools like `write_to_file` or `replace_file_content`:
- **DO NOT** escape backticks (\`), dollar signs (\$), or quotes (\") in your code content, even for template literals.
- The system automatically handles JSON serialization for tool arguments. If you manually escape them (e.g., `\\$\\{var\\}`), literal backslashes will be written into the user's source code and cause syntax errors.
- Always provide the exact, raw text you want to appear in the file.

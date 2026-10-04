import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { LANGUAGES } from "../utils/status";
import Spinner from "./Spinner";

// A theme that matches the app palette instead of stock vs-dark.
function defineTheme(monaco) {
  monaco.editor.defineTheme("dsadebug", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "6B7385", fontStyle: "italic" },
      { token: "keyword", foreground: "F0A93B" },
      { token: "string", foreground: "5FD39A" },
      { token: "number", foreground: "7AA2F7" },
      { token: "type", foreground: "E6C07B" },
    ],
    colors: {
      "editor.background": "#12151D",
      "editor.lineHighlightBackground": "#1A1E29",
      "editorLineNumber.foreground": "#4B5266",
      "editorLineNumber.activeForeground": "#9AA0B2",
      "editorCursor.foreground": "#F0A93B",
      "editor.selectionBackground": "#4A3A2299",
      "editorIndentGuide.background1": "#232836",
      "editorWidget.background": "#171A23",
    },
  });
}

export default function CodeEditor({ language, value, onChange, onSubmit }) {
  const cfg = LANGUAGES[language] || LANGUAGES.javascript;
  const submitRef = useRef(onSubmit);
  useEffect(() => { submitRef.current = onSubmit; }, [onSubmit]);

  return (
    <Editor
      height="100%"
      language={cfg.monaco}
      theme="dsadebug"
      value={value}
      beforeMount={defineTheme}
      onMount={(editor, monaco) => {
        // Ctrl/Cmd + Enter submits, even while the editor has focus.
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => submitRef.current?.());
      }}
      onChange={(v) => onChange(v || "")}
      loading={<div className="flex h-full items-center justify-center gap-3 text-sm text-dim"><Spinner size={18} /> Loading editor…</div>}
      options={{
        fontSize: 14,
        fontFamily: "JetBrains Mono, ui-monospace, monospace",
        fontLigatures: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: cfg.tabSize,
        padding: { top: 14, bottom: 14 },
        renderLineHighlight: "gutter",
        smoothScrolling: true,
        cursorBlinking: "smooth",
        roundedSelection: true,
      }}
    />
  );
}

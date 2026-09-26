import Editor from "@monaco-editor/react";

export default function CodeEditor({ language, value, onChange }) {
  const monacoLang = language === "python" ? "python" : "javascript";
  return (
    <Editor
      height="100%"
      language={monacoLang}
      theme="vs-dark"
      value={value}
      onChange={(v) => onChange(v || "")}
      options={{
        fontSize: 14,
        fontFamily: "JetBrains Mono, monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
      }}
    />
  );
}

function PromptInput({ prompt, onChange, onGenerate, loading, error }) {
  return (
    <div className="prompt-input">
      <label htmlFor="site-prompt">Describe your business</label>
      <textarea
        id="site-prompt"
        value={prompt}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Example: Kampala coffee shop. Phone: +256... Email: hello@..."
        rows={5}
        disabled={loading}
      />
      {error && <p className="error">{error}</p>}
      <button type="button" onClick={onGenerate} disabled={loading}>
        {loading ? 'Generating…' : 'Generate Website'}
      </button>
    </div>
  );
}

export default PromptInput;

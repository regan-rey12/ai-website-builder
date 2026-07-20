const FONT_OPTIONS = [
  { id: 'modern', label: 'Modern', detail: 'Inter' },
  { id: 'professional', label: 'Professional', detail: 'Roboto / Montserrat' },
  { id: 'elegant', label: 'Elegant', detail: 'Playfair / Lato' },
  { id: 'bold', label: 'Bold', detail: 'Oswald / Open Sans' },
];

function FontSelector({ value, onChange, disabled }) {
  return (
    <div className="font-selector">
      <label>Font style</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
        {FONT_OPTIONS.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label} — {opt.detail}
          </option>
        ))}
      </select>
    </div>
  );
}

export default FontSelector;

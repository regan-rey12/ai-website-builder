import { HexColorPicker } from 'react-colorful';

function ColorPicker({ color, onChange, disabled }) {
  return (
    <div className="color-picker">
      <label>Primary color</label>
      <HexColorPicker color={color} onChange={onChange} style={{ width: '100%' }} />
      <input
        type="text"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
}

export default ColorPicker;

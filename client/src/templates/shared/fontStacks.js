export const FONT_STACKS = {
  modern: "'Inter', system-ui, -apple-system, sans-serif",
  professional: "'Montserrat', 'Roboto', system-ui, sans-serif",
  elegant: "'Playfair Display', 'Lato', Georgia, serif",
  bold: "'Oswald', 'Open Sans', system-ui, sans-serif",
};

export function getFontStack(fontFamily) {
  return FONT_STACKS[fontFamily] || FONT_STACKS.modern;
}
